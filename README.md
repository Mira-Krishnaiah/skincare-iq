# SkincareIQ

An AI-powered skincare advisor built with Claude, FastAPI, and vanilla JS.

## Project Structure

```
skincare-iq/
├── frontend/
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styles
│   └── app.js          # Frontend logic & API calls
├── backend/
│   ├── main.py         # FastAPI server
│   ├── requirements.txt
│   └── system_prompt.txt  # Claude system prompt
└── README.md
```

## Setup

### Backend

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   ```

4. Run the server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

### Frontend

Open `frontend/index.html` directly in your browser, or serve it with any static file server:

```bash
cd frontend
python -m http.server 3000
```

Then visit `http://localhost:3000`.

## Usage

Type a skincare question into the chat input and press **Send** (or `Enter`). SkincareIQ will respond with personalized advice powered by Claude.

## API

### `POST /chat`

**Request:**
```json
{ "message": "What's a good routine for oily skin?" }
```

**Response:**
```json
{ "reply": "For oily skin, I'd recommend..." }
```
