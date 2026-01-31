import { useState, useEffect } from 'react';
import { fillForm, getMyProfile } from '../api/client';

export default function FormFiller({ formData, url }) {
  const [profile, setProfile] = useState(null);
  const [customData, setCustomData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [useProfile, setUseProfile] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    if (formData) {
      const fields = formData.fields || (formData.form_structure && formData.form_structure.fields) || [];
      if (fields.length > 0) {
        const initialData = {};
        fields.forEach((field) => {
          if (field.label) {
            initialData[field.label] = field.value || '';
          }
        });
        setCustomData(initialData);
      }
    }
  }, [formData]);

  const handleFill = async () => {
    if (!url) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestData = {
        url: url,
        multi_step: true,
      };

      if (!useProfile || !profile) {
        requestData.form_data = customData;
      }

      const response = await fillForm(requestData);
      setResult(response);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error filling form';
      setError(errorMessage);
      console.error('Fill form error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  if (!formData && !url) {
    return (
      <div className="text-center text-gray-500 py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium">Please analyze a form first</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Fill Form
          </h2>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="radio"
                checked={useProfile}
                onChange={() => setUseProfile(true)}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">Use Profile</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="radio"
                checked={!useProfile}
                onChange={() => setUseProfile(false)}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">Custom Data</span>
            </label>
          </div>
        </div>

        {useProfile ? (
          <div className="mb-6">
            {profile ? (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      Using profile: {profile.name}
                    </p>
                    {profile.resume_path && (
                      <p className="text-xs text-emerald-700 mt-1 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Resume available</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-800">
                    No profile found. Please create a profile first.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Form Data</h3>
            <div className="space-y-4">
              {(formData?.fields || (formData?.form_structure && formData.form_structure.fields) || []).map((field, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border-2 border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label}
                    {field.required && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Required</span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={customData[field.label] || ''}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          [field.label]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      rows={3}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={customData[field.label] || ''}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          [field.label]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((option, optIndex) => (
                        <option key={optIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                      value={customData[field.label] || ''}
                      onChange={(e) =>
                        setCustomData({
                          ...customData,
                          [field.label]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder={field.value || ''}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleFill}
          disabled={loading || (useProfile && !profile) || !url}
          className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Filling Form...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Fill Form</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl animate-fade-in">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-6 rounded-2xl border-2 shadow-lg ${
            result.success 
              ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300' 
              : result.fillable || result.filled_count > 0 || result.browser_open
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
          }`}>
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                result.success 
                  ? 'bg-emerald-100' 
                  : result.fillable || result.filled_count > 0 || result.browser_open
                  ? 'bg-blue-100'
                  : 'bg-red-100'
              }`}>
                {result.browser_open ? (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                ) : result.success ? (
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : result.fillable || result.filled_count > 0 ? (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-2 ${
                  result.success 
                    ? 'text-emerald-800' 
                    : result.fillable || result.filled_count > 0 || result.browser_open
                    ? 'text-blue-800'
                    : 'text-red-800'
                }`}>
                  {result.browser_open
                    ? 'Browser Opened - Complete Remaining Fields'
                    : result.success 
                    ? 'Form Filled Successfully!' 
                    : result.fillable || result.filled_count > 0
                    ? `Partially Filled (${result.filled_count || 0} fields)`
                    : 'Could Not Fill Form'}
                </h3>
                {result.message && (
                  <p className={`text-sm mb-3 font-medium ${
                    result.success ? 'text-emerald-700' : result.browser_open ? 'text-blue-700' : result.fillable || result.filled_count > 0 ? 'text-blue-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                )}
                {result.browser_open && (
                  <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 font-semibold">
                      💡 The browser window is now open. Complete any remaining fields and submit the form manually.
                      Once submitted, you can update the application status in the Applications dashboard.
                    </p>
                  </div>
                )}
                {result.executed_actions && result.executed_actions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-gray-800 mb-2">Actions performed:</p>
                    <ul className="text-sm space-y-1">
                      {result.executed_actions.slice(0, 10).map((action, idx) => (
                        <li key={idx} className="text-gray-700 flex items-start space-x-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{action}</span>
                        </li>
                      ))}
                      {result.executed_actions.length > 10 && (
                        <li className="text-gray-500">... and {result.executed_actions.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-red-700 mb-2">Issues encountered:</p>
                    <ul className="text-sm space-y-1">
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx} className="text-red-600 flex items-start space-x-2">
                          <span className="text-red-600 mt-1">✗</span>
                          <span>{error}</span>
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-red-500">... and {result.errors.length - 5} more issues</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
