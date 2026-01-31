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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">AI</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Form Filling Assistant
                </h1>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm ${
                  apiStatus === 'connected'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : apiStatus === 'disconnected'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'disconnected' ? 'bg-red-500' : 'bg-amber-500'
                } animate-pulse`}></span>
                <span>
                  {apiStatus === 'connected'
                    ? 'Connected'
                    : apiStatus === 'disconnected'
                    ? 'Disconnected'
                    : 'Checking...'}
                </span>
              </span>
              {user && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('upload')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  step === 'upload'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                Analyze
              </button>
              <button
                onClick={() => setStep('profiles')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  step === 'profiles'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                My Profile
              </button>
              <button
                onClick={() => setStep('applications')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  step === 'applications'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                Applications
              </button>
              <button
                onClick={logout}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:from-red-600 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl shadow-lg animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  Analyze Form
                </h2>
                <p className="text-gray-600">Enter the URL of the form you want to automatically fill</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formUrl = e.target.url.value.trim();
                  if (formUrl) {
                    await handleUrlSubmit(formUrl);
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-3">
                    Form URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      id="url"
                      name="url"
                      placeholder="https://example.com/job-application-form"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-500 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Paste the complete URL of the form page</span>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Analyze Form</span>
                    </>
                  )}
                </button>
              </form>
            </div>
            {formData && (
              <div className="mt-8 animate-fade-in">
                <FormPreview formData={formData} />
                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => setStep('preview')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30"
                  >
                    Continue to Fill
                  </button>
                  <button
                    onClick={() => {
                      setFormData(null);
                      setStep('upload');
                    }}
                    className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border-2 border-gray-200 shadow-sm"
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
              <div className={`p-6 rounded-2xl border-2 shadow-lg backdrop-blur-sm ${
                fillableInfo.fillable 
                  ? fillableInfo.confidence === 'high'
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300'
                    : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    fillableInfo.fillable 
                      ? fillableInfo.confidence === 'high'
                        ? 'bg-emerald-100'
                        : 'bg-amber-100'
                      : 'bg-red-100'
                  }`}>
                    {fillableInfo.fillable ? (
                      fillableInfo.confidence === 'high' ? (
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-2 ${
                      fillableInfo.fillable 
                        ? fillableInfo.confidence === 'high'
                          ? 'text-emerald-800'
                          : 'text-amber-800'
                        : 'text-red-800'
                    }`}>
                      {fillableInfo.fillable 
                        ? fillableInfo.confidence === 'high'
                          ? 'Form is fillable!'
                          : 'Form may be partially fillable'
                        : 'Form may not be fillable automatically'}
                    </h3>
                    <p className={`text-sm font-medium ${
                      fillableInfo.fillable 
                        ? fillableInfo.confidence === 'high'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                        : 'text-red-700'
                    }`}>
                      {fillableInfo.message}
                    </p>
                  </div>
                </div>
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

    </div>
  );
}

export default App;
