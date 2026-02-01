import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { analyzeForm, healthCheck, isAuthenticated, getCurrentUser, logout, checkIfFillable, checkAtsScore } from './api/client';
import FormPreview from './components/FormPreview';
import FormFiller from './components/FormFiller';
import ProfileManager from './components/ProfileManager';
import QuickApplyProfile from './components/QuickApplyProfile';
import ApplicationsDashboard from './components/ApplicationsDashboard';
import Login from './components/Login';

function AppContent() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [fillableInfo, setFillableInfo] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAtsResult, setShowAtsResult] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        setAuthenticated(false);
      }
    }
    setAuthChecked(true);
  };

  const handleLogin = () => {
    setAuthenticated(true);
    checkAuth();
    navigate('/');
  };

  const checkApiHealth = async () => {
    try {
      await healthCheck();
      setApiStatus('connected');
    } catch (err) {
      setApiStatus('disconnected');
    }
  };

  const analyzeFormAfterAts = async (formUrl) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeForm(formUrl);
      if (result.form_structure) {
        setFormData(result.form_structure);
      } else {
        setFormData(result);
      }
      
      try {
        const fillableCheck = await checkIfFillable(formUrl);
        setFillableInfo(fillableCheck);
      } catch (err) {
        console.warn('Could not check fillability:', err);
      }
      
      setShowAtsResult(false);
      navigate('/preview');
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
    setFillableInfo(null);
    setAtsScore(null);
    setShowAtsResult(false);
    
    try {
      // Step 1: Check ATS score first
      let atsResult = null;
      try {
        atsResult = await checkAtsScore(formUrl);
        setAtsScore(atsResult);
        
        // If no resume, show error
        if (atsResult.recommendation === 'no_resume') {
          setError('Please upload your resume first to check ATS score.');
          setLoading(false);
          return;
        }
        
        // If score is high or medium (acceptable), automatically proceed to analyze form
        if (atsResult.recommendation === 'high' || atsResult.recommendation === 'medium') {
          setShowAtsResult(true);
          // Automatically proceed to analyze form after showing ATS result
          await analyzeFormAfterAts(formUrl);
          return;
        } else {
          // Low or poor score - show result and let user decide
          setShowAtsResult(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Could not check ATS score:', err);
        // If ATS check fails, proceed directly to form analysis
        await analyzeFormAfterAts(formUrl);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error processing request');
      setLoading(false);
    }
  };

  const handleProceedAfterAts = async () => {
    // User wants to proceed despite ATS score
    await analyzeFormAfterAts(url);
  };

  // Close account menu when clicking outside
  useEffect(() => {
    if (!authenticated) return;
    const handleClickOutside = (event) => {
      if (showAccountMenu && !event.target.closest('.account-menu-container')) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountMenu, authenticated]);

  // Redirect to login if not authenticated (except on login route)
  // Only redirect after auth check is complete to avoid redirecting during initial load
  useEffect(() => {
    if (!authChecked) return; // Wait for auth check to complete
    
    if (!authenticated && location.pathname !== '/login') {
      navigate('/login');
    } else if (authenticated && location.pathname === '/login') {
      // Only redirect from login page to home, don't redirect from other pages
      navigate('/');
    }
    // Don't redirect authenticated users from their current route on reload
  }, [authenticated, location.pathname, navigate, authChecked]);

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">AI</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Form Filling Assistant
                </h1>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/applications')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  isActiveRoute('/applications')
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                Applications
              </button>
              {user && (
                <div className="relative account-menu-container">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full hover:opacity-80 transition-all duration-200 shadow-lg"
                  >
                    <span className="text-white text-lg font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowAccountMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          isActiveRoute('/profile')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/quick-apply');
                          setShowAccountMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          isActiveRoute('/quick-apply')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Quick Apply
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          logout();
                          setShowAccountMenu(false);
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
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

        <Routes>
          <Route path="/" element={
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
            
            {/* ATS Score Result */}
            {showAtsResult && atsScore && (
              <div className={`mt-8 p-6 rounded-2xl border-2 shadow-lg backdrop-blur-sm animate-fade-in ${
                atsScore.recommendation === 'high'
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300'
                  : atsScore.recommendation === 'medium'
                  ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'
                  : atsScore.recommendation === 'low' || atsScore.recommendation === 'poor'
                  ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${
                    atsScore.recommendation === 'high'
                      ? 'bg-emerald-100'
                      : atsScore.recommendation === 'medium'
                      ? 'bg-amber-100'
                      : atsScore.recommendation === 'low' || atsScore.recommendation === 'poor'
                      ? 'bg-orange-100'
                      : 'bg-gray-100'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      atsScore.recommendation === 'high'
                        ? 'text-emerald-700'
                        : atsScore.recommendation === 'medium'
                        ? 'text-amber-700'
                        : atsScore.recommendation === 'low' || atsScore.recommendation === 'poor'
                        ? 'text-orange-700'
                        : 'text-gray-700'
                    }`}>
                      {atsScore.score}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-xl mb-2 ${
                      atsScore.recommendation === 'high'
                        ? 'text-emerald-800'
                        : atsScore.recommendation === 'medium'
                        ? 'text-amber-800'
                        : atsScore.recommendation === 'low' || atsScore.recommendation === 'poor'
                        ? 'text-orange-800'
                        : 'text-gray-800'
                    }`}>
                      ATS Score: {atsScore.score}%
                    </h3>
                    <p className={`text-sm font-medium mb-4 ${
                      atsScore.recommendation === 'high'
                        ? 'text-emerald-700'
                        : atsScore.recommendation === 'medium'
                        ? 'text-amber-700'
                        : atsScore.recommendation === 'low' || atsScore.recommendation === 'poor'
                        ? 'text-orange-700'
                        : 'text-gray-700'
                    }`}>
                      {atsScore.message}
                    </p>
                    {atsScore.details && Object.keys(atsScore.details).length > 0 && (
                      <div className="space-y-4">
                        {/* Match Scores */}
                        {(atsScore.details.skills_match !== undefined || 
                          atsScore.details.keywords_match !== undefined || 
                          atsScore.details.education_match !== undefined || 
                          atsScore.details.experience_match !== undefined) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {atsScore.details.skills_match !== undefined && (
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Skills Match</p>
                                <p className="text-lg font-bold text-gray-800">{Math.round(atsScore.details.skills_match)}%</p>
                              </div>
                            )}
                            {atsScore.details.keywords_match !== undefined && (
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Keywords Match</p>
                                <p className="text-lg font-bold text-gray-800">{Math.round(atsScore.details.keywords_match)}%</p>
                              </div>
                            )}
                            {atsScore.details.education_match !== undefined && (
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Education Match</p>
                                <p className="text-lg font-bold text-gray-800">{Math.round(atsScore.details.education_match)}%</p>
                              </div>
                            )}
                            {atsScore.details.experience_match !== undefined && (
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Experience Match</p>
                                <p className="text-lg font-bold text-gray-800">{Math.round(atsScore.details.experience_match)}%</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Strengths */}
                        {atsScore.details.strengths && atsScore.details.strengths.length > 0 && (
                          <div className="bg-emerald-50/60 rounded-lg p-4 border border-emerald-200">
                            <h4 className="font-semibold text-emerald-800 mb-2 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Strengths
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-emerald-700">
                              {atsScore.details.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Weaknesses */}
                        {atsScore.details.weaknesses && atsScore.details.weaknesses.length > 0 && (
                          <div className="bg-orange-50/60 rounded-lg p-4 border border-orange-200">
                            <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Areas for Improvement
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                              {atsScore.details.weaknesses.map((weakness, idx) => (
                                <li key={idx}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Suggestions */}
                        {atsScore.details.suggestions && atsScore.details.suggestions.length > 0 && (
                          <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Suggestions
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                              {atsScore.details.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex space-x-3">
                      {(atsScore.recommendation === 'high' || atsScore.recommendation === 'medium') ? (
                        <button
                          onClick={handleProceedAfterAts}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30"
                        >
                          {loading ? 'Analyzing Form...' : 'Proceed to Analyze Form'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleProceedAfterAts}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            {loading ? 'Analyzing...' : 'Proceed Anyway'}
                          </button>
                          <button
                            onClick={() => {
                              setShowAtsResult(false);
                              setAtsScore(null);
                            }}
                            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border-2 border-gray-200 shadow-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {formData && !showAtsResult && (
              <div className="mt-8 animate-fade-in">
                <FormPreview formData={formData} />
                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/preview')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30"
                  >
                    Continue to Fill
                  </button>
                  <button
                    onClick={() => {
                      setFormData(null);
                      setAtsScore(null);
                      navigate('/');
                    }}
                    className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border-2 border-gray-200 shadow-sm"
                  >
                    Analyze Another
                  </button>
                </div>
              </div>
            )}
            </div>
          } />
          
          <Route path="/preview" element={formData ? (
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
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
            </div>
          </div>
          ) : (
            <Navigate to="/" replace />
          )} />
          
          <Route path="/profile" element={
            <div>
              <ProfileManager onSelectProfile={() => {}} />
            </div>
          } />
          
          <Route path="/quick-apply" element={
            <div>
              <QuickApplyProfile />
            </div>
          } />
          
          <Route path="/applications" element={
            <div>
              <ApplicationsDashboard />
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
