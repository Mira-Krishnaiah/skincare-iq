# SkincareIQ

A web app that analyzes skincare product combinations for ingredient conflicts, 
irritation risks, and application order issues. Powered by Gemini AI.

## How it works
1. User enters 2-4 skincare product names
2. Frontend sends product list to backend
3. Backend calls Gemini API with a cosmetic chemistry system prompt
4. Gemini returns a structured conflict report
5. Frontend displays conflicts as color-coded cards (red/yellow/green by severity)

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript — hosted on GitHub Pages
- **Backend:** Python Flask — hosted on Google Cloud Run
- **AI:** Google Gemini 2.0 Flash

## Repo Structure
```
skincare-iq/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── system_prompt.txt
└── README.md
```

## API Contract
**Endpoint:** `POST /analyze`

Request:
```json
{ "products": ["Cerave Moisturizer", "The Ordinary Retinol 0.5%"] }
```

Response:
```json
{
  "result": "[{
    \"product_a\": \"The Ordinary Retinol 0.5%\",
    \"product_b\": \"Paula's Choice AHA\",
    \"severity\": \"high\",
    \"conflict\": \"Retinol and AHA cause over-exfoliation\",
    \"recommendation\": \"Use AHA in the morning, Retinol at night\"
  }]"
}
```

## Team
- **Backend:** Gemini API integration, Flask server, Cloud Run deployment
- **Frontend:** UI/UX, HTML/CSS/JS, GitHub Pages
- **Prompt:** System prompt engineering, domain QA, conflict testing

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
export GEMINI_API_KEY=your_key_here
python main.py
```

### Frontend
Open `frontend/index.html` directly in a browser for local testing.
No build step required.

## Deployment
- Frontend: GitHub Pages (auto-deploys from `/frontend` on `main`)
- Backend: Google Cloud Run
```bash
cd backend
gcloud run deploy skincare-iq \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here
```