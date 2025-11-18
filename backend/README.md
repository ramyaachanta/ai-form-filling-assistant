# Backend - AI Form Filling Assistant

FastAPI backend for the AI Form Filling Assistant.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   playwright install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   HOST=0.0.0.0
   PORT=8000
   DEBUG=True
   PLAYWRIGHT_HEADLESS=True
   PLAYWRIGHT_TIMEOUT=30000
   ```

3. **Run the server:**
   ```bash
   python run.py
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `POST /api/analyze` - Analyze form screenshot
- `POST /api/fill` - Fill form with automation

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py          # API endpoints
│   ├── services/
│   │   ├── vision_service.py  # GPT-4o Vision integration
│   │   ├── ocr_service.py     # OCR fallback
│   │   └── automation_service.py  # Playwright automation
│   ├── config.py              # Configuration
│   └── main.py                # FastAPI app
├── requirements.txt
└── run.py                     # Server runner
```

