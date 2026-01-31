import { useState, useEffect } from 'react';
import { analyzeForm, healthCheck, isAuthenticated, getCurrentUser, logout, checkIfFillable } from './api/client';
import FormPreview from './components/FormPreview';
import FormFiller from './components/FormFiller';
import ProfileManager from './components/ProfileManager';
import ApplicationsDashboard from './components/ApplicationsDashboard';
import Login from './components/Login';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('upload');
  const [formData, setFormData] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [fillableInfo, setFillableInfo] = useState(null);

  useEffect(() => {
    checkAuth();
    checkApiHealth();
  }, []);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setAuthenticated(true);
      } catch (err) {
        logout();
      }
    }
  };

  const handleLogin = () => {
    setAuthenticated(true);
    checkAuth();
  };

  const checkApiHealth = async () => {
    try {
      await healthCheck();
      setApiStatus('connected');
    } catch (err) {
      setApiStatus('disconnected');
    }
  };

  const handleUrlSubmit = async (formUrl) => {
    setLoading(true);
    setError(null);
    setUrl(formUrl);
    setFillableInfo(null);
    try {
      const result = await analyzeForm(formUrl);
      // Handle different response structures
      if (result.form_structure) {
        setFormData(result.form_structure);
      } else {
        setFormData(result);
      }
      
      // Check if form is fillable
      try {
        const fillableCheck = await checkIfFillable(formUrl);
        setFillableInfo(fillableCheck);
      } catch (err) {
        console.warn('Could not check fillability:', err);
      }
      
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error analyzing form');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
              {user && (
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
              )}
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
                My Profile
              </button>
              <button
                onClick={() => setStep('applications')}
                className={`px-4 py-2 rounded-lg transition ${
                  step === 'applications'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Applications
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
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
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Analyze Form</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formUrl = e.target.url.value.trim();
                  if (formUrl) {
                    await handleUrlSubmit(formUrl);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Form URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    placeholder="https://example.com/form"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Enter the URL of the form you want to fill
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Analyzing...' : 'Analyze Form'}
                </button>
              </form>
            </div>
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
            {fillableInfo && (
              <div className={`p-4 rounded-lg border ${
                fillableInfo.fillable 
                  ? fillableInfo.confidence === 'high'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {fillableInfo.fillable ? (
                    fillableInfo.confidence === 'high' ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">⚠️</span>
                    )
                  ) : (
                    <span className="text-2xl">❌</span>
                  )}
                  <h3 className={`font-semibold ${
                    fillableInfo.fillable 
                      ? fillableInfo.confidence === 'high'
                        ? 'text-green-800'
                        : 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {fillableInfo.fillable 
                      ? fillableInfo.confidence === 'high'
                        ? 'Form is fillable!'
                        : 'Form may be partially fillable'
                      : 'Form may not be fillable automatically'}
                  </h3>
                </div>
                <p className={`text-sm ${
                  fillableInfo.fillable 
                    ? fillableInfo.confidence === 'high'
                      ? 'text-green-700'
                      : 'text-yellow-700'
                    : 'text-red-700'
                }`}>
                  {fillableInfo.message}
                </p>
              </div>
            )}
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
            <ProfileManager onSelectProfile={() => {}} />
          </div>
        )}

        {step === 'applications' && (
          <div>
            <ApplicationsDashboard />
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
