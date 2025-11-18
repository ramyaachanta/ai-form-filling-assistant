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
├── docs/
│   ├── architecture.md
│   ├── api-spec.md
│   └── roadmap.md
│
├── frontend/
│
├── media/
│   ├── architecture-system.png
│   ├── sequence-diagram.png
│
└── README.md
```

## 🏁 Getting Started

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
playwright install
```

Run server:

```bash
uvicorn app.main:app --reload
```

## 🎯 Roadmap

- [ ] Initial MVP: Screenshot → Form JSON
- [ ] Page HTML parsing for selectors
- [ ] Multi-step wizards
- [ ] Auto-detection of required fields
- [ ] Save user profiles for auto-fill
- [ ] Browser plugin version


