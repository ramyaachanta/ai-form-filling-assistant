# Frontend - AI Form Filling Assistant

React frontend for the AI Form Filling Assistant built with Vite and Tailwind CSS.

## Features

- 📸 **Screenshot Upload** - Upload form screenshots for analysis
- 🔗 **URL Support** - Enter form URLs directly
- 👁️ **Form Preview** - View detected form fields and structure
- 👤 **Profile Management** - Create and manage user profiles
- ✍️ **Form Filling** - Fill forms using profiles or custom data
- 🎨 **Modern UI** - Beautiful, responsive interface with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js          # API client for backend communication
│   ├── components/
│   │   ├── ScreenshotUpload.jsx
│   │   ├── FormPreview.jsx
│   │   ├── ProfileManager.jsx
│   │   └── FormFiller.jsx
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles with Tailwind
├── public/                     # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Usage

1. **Analyze Form:**
   - Upload a screenshot or enter a form URL
   - View detected form fields

2. **Manage Profiles:**
   - Create user profiles with name, email, phone, address
   - Edit or delete existing profiles

3. **Fill Form:**
   - Select a profile or enter custom data
   - Click "Fill Form" to automate form submission

## Technologies

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation (ready for future use)
