# AI Form Filling Assistant (Vision + UI Automation)

An AI-powered automation tool that interprets web form screenshots using GPT-4o Vision, extracts fields with OCR fallback, generates a JSON action plan, and automatically fills real forms using Playwright.

## 🚀 Features

- 🧠 Vision-based form understanding (text fields, dropdowns, checkboxes)
- 🔎 OCR fallback for accurate text extraction
- 🔧 JSON-based automation plan (type, click, select, scroll)
- 🛡️ Safety layer with confirmation & validation
- 🤖 Playwright-driven UI automation for any website
- 🔁 Supports multi-step forms
- 📸 Works with screenshot OR direct URL

## 🧩 Architecture

### System Architecture Diagram

![System Architecture](media/architecture-system.png)

### 🔁 Automation Workflow

![Sequence Diagram](media/sequence-diagram.png)

## 📁 Project Structure

```
ai-form-filling-assistant/
│
├── backend/
│   ├── app/
│   ├── automation/
│   ├── services/
│   ├── utils/
│   ├── tests/
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   └── App.jsx       # Main app
│   └── package.json
│
├── media/
│   ├── architecture-system.png
│   ├── sequence-diagram.png
│
└── README.md
```

## 🏁 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - Check with `python3 --version`
- **Node.js 16+** - Check with `node --version`
- **npm** or **yarn** - Usually comes with Node.js
- **OpenAI API key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Git** - For cloning the repository

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-form-filling-assistant
   ```

2. **Set up backend** (see Backend Setup below)
3. **Set up frontend** (see Frontend Setup below)
4. **Start both servers** and open `http://localhost:5173`

### Backend Setup

#### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** It's recommended to use a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Step 2: Install Playwright Browsers

Playwright needs browser binaries for automation:

```bash
playwright install
```

This installs Firefox, Chromium, and WebKit browsers. The first time may take a few minutes.

#### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env  # or create manually
```

Add the following configuration to `.env`:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Playwright Configuration
PLAYWRIGHT_HEADLESS=True
PLAYWRIGHT_TIMEOUT=30000

# Security: Generate a long random string for production
SECRET_KEY=your-secret-key-change-in-production-use-a-long-random-string

# Optional: Database URL (defaults to SQLite)
# DATABASE_URL=sqlite+aiosqlite:///./profiles.db
```

**Important:**
- Get your OpenAI API key from https://platform.openai.com/api-keys
- Generate a secure `SECRET_KEY` for JWT tokens (use a long random string)
- Never commit your `.env` file to version control

#### Step 4: Initialize Database

The database will be created automatically on first run. No manual setup needed.

#### Step 5: Start the Backend Server

```bash
# Option 1: Using run.py script (Recommended)
python3 run.py

# Option 2: Using uvicorn directly
python3 -m uvicorn app.main:app --reload
```

The server should start on `http://localhost:8000`

**Verify it's working:**
- Health check: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Setup

#### Step 1: Install Node Dependencies

```bash
cd frontend
npm install
```

#### Step 2: Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
touch .env  # or create manually
```

Add the following:

```env
VITE_API_URL=http://localhost:8000
```

**Note:** If your backend runs on a different port, update the URL accordingly.

#### Step 3: Start the Frontend Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### First Use

1. **Open the application:**
   - Navigate to `http://localhost:5173` in your browser

2. **Create an account:**
   - Click "Sign up" to create a new account
   - Enter your email and password
   - You'll be automatically logged in after registration

3. **Set up your profile:**
   - Go to "My Profile" in the navigation
   - Fill in your information (name, email, phone, address)
   - Optionally upload a resume (PDF or DOCX) to auto-fill profile data

4. **Analyze a form:**
   - Go to "Analyze" tab
   - Either:
     - Upload a form screenshot (PNG, JPG, etc.)
     - Enter a form URL directly
   - Review the detected form fields

5. **Fill a form:**
   - After analysis, click "Continue to Fill"
   - Choose to use your profile or enter custom data
   - Click "Fill Form" to automate the form filling
   - Review the results

## 🔧 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find and kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Or change PORT in .env file
```

**Playwright browsers not found:**
```bash
cd backend
playwright install
```

**OpenAI API errors:**
- Verify your API key is correct in `.env`
- Check your OpenAI account has credits
- Ensure the API key has proper permissions
- Check API status at https://status.openai.com

**Database errors:**
- Delete `profiles.db` and restart the server (this will reset all data)
- Check file permissions in the backend directory
- Ensure SQLite is available

**Module not found errors:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**API connection errors:**
- Verify backend is running on port 8000
- Check `VITE_API_URL` in `.env` matches backend URL
- Check browser console for CORS errors
- Ensure both servers are running

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port 5173 already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3000
```

### Common Issues

**"No profile found" error:**
- Create a profile in "My Profile" section
- Ensure you're logged in
- Check browser console for authentication errors

**Form filling fails:**
- Check browser console for errors
- Verify the form URL is accessible
- Some forms may require manual intervention
- Check Playwright browser installation

**OCR not working:**
- Ensure EasyOCR dependencies are installed
- On first run, EasyOCR downloads models (may take time)
- Check internet connection for model downloads

**Authentication errors:**
- Clear browser localStorage
- Log out and log back in
- Check backend logs for JWT errors
- Verify `SECRET_KEY` is set in backend `.env`

## 🚀 Production Deployment

### Backend

1. **Environment Configuration:**
   ```env
   DEBUG=False
   SECRET_KEY=<strong-random-string>
   HOST=0.0.0.0
   PORT=8000
   ```

2. **Use Production WSGI Server:**
   ```bash
   pip install gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. **Database:**
   - Use PostgreSQL or MySQL for production
   - Update `DATABASE_URL` in `.env`
   - Run migrations if needed

4. **Security:**
   - Set strong `SECRET_KEY`
   - Configure proper CORS origins
   - Set up SSL/TLS
   - Use environment variables for secrets
   - Enable rate limiting

### Frontend

1. **Build for production:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve the build:**
   - The `dist` folder contains production files
   - Serve with Nginx, Apache, or any static file server
   - Configure API URL for production backend

3. **Environment:**
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```

## 🐳 Docker Deployment

### Using Docker Compose

The easiest way to run the entire stack:

1. **Create environment file:**
   ```bash
   # Create .env file in root directory
   echo "OPENAI_API_KEY=your_key_here" > .env
   echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### Individual Docker Builds

**Backend:**
```bash
cd backend
docker build -t ai-form-backend .
docker run -p 8000:8000 --env-file .env ai-form-backend
```

**Frontend:**
```bash
cd frontend
docker build -t ai-form-frontend .
docker run -p 80:80 ai-form-frontend
```

## 🧪 Testing

### Backend Tests

Run the test suite:

```bash
cd backend
pytest tests/
```

Run with coverage:

```bash
pytest tests/ --cov=app --cov-report=html
```

Run specific test file:

```bash
pytest tests/test_field_validator.py
```

### Frontend Tests

(Add frontend tests if available)

```bash
cd frontend
npm test
```

