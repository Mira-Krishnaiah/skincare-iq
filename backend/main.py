from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")

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
    with open("system_prompt.txt", encoding="utf-8") as f:
        prompt = f.read() + "\n\nProducts: " + json.dumps(products)
    response = model.generate_content(prompt)
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