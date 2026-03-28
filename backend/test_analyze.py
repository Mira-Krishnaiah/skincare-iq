"""
Integration-style tests for POST /analyze.

- Default: mocks Gemini so no API key or network is required.
- Live: set GEMINI_API_KEY to a real key and RUN_LIVE_GEMINI=1 to hit the API.
"""
import json
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("GEMINI_API_KEY", "test-key-for-mock-import")

import main as m


class FakeResponse:
    def __init__(self, text: str):
        self.text = text


def _should_run_live_gemini() -> bool:
    key = os.environ.get("GEMINI_API_KEY", "")
    return (
        os.environ.get("RUN_LIVE_GEMINI") == "1"
        and len(key) > 10
        and key != "test-key-for-mock-import"
    )


class AnalyzeMockedTests(unittest.TestCase):
    def setUp(self):
        self.client = m.app.test_client()

    @patch.object(m.model, "generate_content")
    def test_realistic_product_list_returns_parseable_json_result(self, mock_gen):
        mock_gen.return_value = FakeResponse(
            text='[{"products":["Paula\'s Choice 2% BHA","The Ordinary Retinol 0.5%"],'
            '"issue":"Avoid using strong exfoliants with retinol the same night."}]'
        )
        products = [
            {
                "name": "Paula's Choice 2% BHA Liquid Exfoliant",
                "ingredients": ["Salicylic Acid", "Green Tea Extract", "Water"],
            },
            {
                "name": "The Ordinary Retinol 0.5% in Squalane",
                "ingredients": ["Retinol", "Squalane", "Caprylic/Capric Triglyceride"],
            },
        ]
        r = self.client.post("/analyze", json={"products": products})
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        data = r.get_json()
        self.assertIn("result", data)
        parsed = json.loads(data["result"])
        self.assertIsInstance(parsed, list)
        self.assertEqual(len(parsed), 1)


@unittest.skipUnless(
    _should_run_live_gemini(),
    "Set RUN_LIVE_GEMINI=1 and a real GEMINI_API_KEY to run the live Gemini test.",
)
class AnalyzeLiveGeminiTests(unittest.TestCase):
    def setUp(self):
        self.client = m.app.test_client()

    def test_live_realistic_products(self):
        products = [
            {
                "name": "CeraVe Foaming Facial Cleanser",
                "ingredients": ["Water", "Ceramide NP", "Niacinamide", "Hyaluronic Acid"],
            },
            {
                "name": "La Roche-Posay Anthelios SPF 50",
                "ingredients": ["Avobenzone", "Octisalate", "Octocrylene", "Water"],
            },
        ]
        r = self.client.post("/analyze", json={"products": products})
        self.assertIn(r.status_code, (200, 422), r.get_data(as_text=True))
        data = r.get_json()
        if r.status_code == 200:
            self.assertIn("result", data)
            json.loads(data["result"])
        else:
            self.assertEqual(data.get("error"), "invalid_model_json")


if __name__ == "__main__":
    unittest.main(verbosity=2)
