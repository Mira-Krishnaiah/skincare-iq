from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
import os
from conflict_engine import find_conflicts, pubchem_enrich, summarize_for_prompt

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")

MAX_PRODUCTS = 4


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return (
            jsonify(
                {
                    "error": "invalid_request",
                    "message": "Request body must be a JSON object.",
                }
            ),
            400,
        )
    products = data.get("products")
    if not isinstance(products, list):
        return (
            jsonify(
                {
                    "error": "invalid_request",
                    "message": 'Field "products" must be an array.',
                }
            ),
            400,
        )
    if len(products) == 0:
        return (
            jsonify(
                {
                    "error": "empty_products",
                    "message": "Provide at least one product.",
                }
            ),
            400,
        )
    if len(products) > MAX_PRODUCTS:
        return (
            jsonify(
                {
                    "error": "too_many_products",
                    "message": f"Maximum {MAX_PRODUCTS} products allowed.",
                }
            ),
            400,
        )
    # Parse ingredient lists from "ProductName (ing1, ing2, ...)" strings
    ingredient_lists = []
    for product_str in products:
        match = re.search(r"\(([^)]{10,})\)\s*$", product_str)
        if match:
            ings = [i.strip() for i in re.split(r",|;", match.group(1)) if i.strip()]
            ingredient_lists.append(ings)
        else:
            ingredient_lists.append([])

    # Resolve ingredient lists for name-only products (not found in OBF) via Gemini
    unknown_indices = [i for i, lst in enumerate(ingredient_lists) if not lst]
    if unknown_indices:
        unknown_names = [products[i] for i in unknown_indices]
        resolve_prompt = (
            "You are an INCI ingredient database. "
            "Return ONLY a valid JSON object mapping each product name to an array of its likely INCI ingredient names. "
            "Use your knowledge of each product's real formulation. "
            "If uncertain, return your best estimate of typical ingredients for that product type. "
            "No markdown, no code fences, no text outside the JSON.\n\n"
            f"Products: {json.dumps(unknown_names)}"
        )
        try:
            resolve_response = model.generate_content(resolve_prompt)
            resolved = json.loads((resolve_response.text or "").strip())
            for i in unknown_indices:
                product_name = products[i]
                inferred = resolved.get(product_name)
                if isinstance(inferred, list) and inferred:
                    ingredient_lists[i] = [str(s).strip() for s in inferred if str(s).strip()]
                    products[i] = f"{product_name} ({', '.join(ingredient_lists[i])})"
        except Exception:
            pass  # Fall through — name-only analysis still works via main Gemini call

    # Run the local conflict engine before calling Gemini
    pre_conflicts = find_conflicts(ingredient_lists)
    pubchem_data  = pubchem_enrich(ingredient_lists, max_lookups=3)
    conflict_context = summarize_for_prompt(pre_conflicts, pubchem_data or None)

    # Build profile text for [USER_PROFILE] placeholder
    profile = data.get("profile") or {}
    profile_lines = []
    if profile.get("skin_type"):
        profile_lines.append(f"skin_type: {profile['skin_type']}")
    if profile.get("concerns"):
        concerns = profile["concerns"]
        if isinstance(concerns, list):
            profile_lines.append(f"concerns: {', '.join(concerns)}")
    if profile.get("sensitivities"):
        sensitivities = profile["sensitivities"]
        if isinstance(sensitivities, list):
            profile_lines.append(f"sensitivities: {', '.join(sensitivities)}")
    profile_text = "\n".join(profile_lines) if profile_lines else "Not provided."

    with open("system_prompt.txt", encoding="utf-8") as f:
        base_prompt = f.read()

    prompt = base_prompt.replace("[USER_PROFILE]", profile_text)
    prompt = prompt + "\n\n" + conflict_context + "\n\nProducts: " + json.dumps(products)
    try:
        response = model.generate_content(prompt)
    except ResourceExhausted:
        return (
            jsonify(
                {
                    "error": "quota_exceeded",
                    "message": "Gemini API quota exceeded. Please try again later.",
                }
            ),
            429,
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "error": "model_error",
                    "message": str(e),
                }
            ),
            502,
        )
    text = (response.text or "").strip()
    try:
        json.loads(text)
    except json.JSONDecodeError:
        return (
            jsonify(
                {
                    "error": "invalid_model_json",
                    "message": "The model response was not valid JSON.",
                    "result": None,
                }
            ),
            422,
        )
    return jsonify({"result": text, "pre_conflicts": pre_conflicts, "pubchem_hits": pubchem_data})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
