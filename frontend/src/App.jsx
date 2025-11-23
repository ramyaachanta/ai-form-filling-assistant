import { useState, useEffect } from 'react';
import { analyzeForm, healthCheck } from './api/client';
import ScreenshotUpload from './components/ScreenshotUpload';
import FormPreview from './components/FormPreview';
import FormFiller from './components/FormFiller';
import ProfileManager from './components/ProfileManager';

function App() {
  const [step, setStep] = useState('upload');
  const [formData, setFormData] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await healthCheck();
      setApiStatus('connected');
    } catch (err) {
      setApiStatus('disconnected');
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeForm(file);
      setFormData(result);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error analyzing form');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (formUrl) => {
    setLoading(true);
    setError(null);
    setUrl(formUrl);
    try {
      const result = await analyzeForm(null, formUrl);
      setFormData(result);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error analyzing form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">
                AI Form Filling Assistant
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  apiStatus === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : apiStatus === 'disconnected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {apiStatus === 'connected'
                  ? 'Connected'
                  : apiStatus === 'disconnected'
                  ? 'Disconnected'
                  : 'Checking...'}
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('upload')}
                className={`px-4 py-2 rounded-lg transition ${
                  step === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Analyze
              </button>
              <button
                onClick={() => setStep('profiles')}
                className={`px-4 py-2 rounded-lg transition ${
                  step === 'profiles'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Profiles
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <ScreenshotUpload
              onUpload={handleUpload}
              onUrlSubmit={handleUrlSubmit}
              loading={loading}
            />
            {formData && (
              <div className="mt-6">
                <FormPreview formData={formData} />
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={() => setStep('preview')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Continue to Fill
                  </button>
                  <button
                    onClick={() => {
                      setFormData(null);
                      setStep('upload');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Analyze Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && formData && (
          <div className="space-y-6">
            <FormPreview formData={formData} />
            <FormFiller formData={formData} url={url} />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'profiles' && (
          <div>
            <ProfileManager />
          </div>
        )}
      </main>

      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            AI Form Filling Assistant - Powered by GPT-4o Vision & Playwright
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
