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

    # Run the local conflict engine before calling Gemini
    pre_conflicts = find_conflicts(ingredient_lists)
    pubchem_data  = pubchem_enrich(ingredient_lists, max_lookups=3)
    conflict_context = summarize_for_prompt(pre_conflicts, pubchem_data or None)

    with open("system_prompt.txt", encoding="utf-8") as f:
        base_prompt = f.read()

    prompt = base_prompt + "\n\n" + conflict_context + "\n\nProducts: " + json.dumps(products)
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
    return jsonify({"result": text})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
