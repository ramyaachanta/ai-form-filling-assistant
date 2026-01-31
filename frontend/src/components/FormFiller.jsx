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
      // Handle both direct form_structure and nested form_structure
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
      <div className="text-center text-gray-500 py-8">
        Please analyze a form first
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Fill Form
        </h2>

        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={useProfile}
              onChange={() => setUseProfile(true)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-gray-700">Use Profile</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mt-2">
            <input
              type="radio"
              checked={!useProfile}
              onChange={() => setUseProfile(false)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-gray-700">Custom Data</span>
          </label>
        </div>

        {useProfile ? (
          <div className="mb-6">
            {profile ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Using profile:</span> {profile.name}
                  {profile.resume_path && (
                    <span className="ml-2 text-green-600">✓ Resume available</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No profile found. Please create a profile first.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Form Data</h3>
            <div className="space-y-3">
              {(formData?.fields || (formData?.form_structure && formData.form_structure.fields) || []).map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Filling Form...' : 'Fill Form'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className={`mt-4 p-4 border rounded-lg ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : result.fillable || result.filled_count > 0 || result.browser_open
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              result.success 
                ? 'text-green-800' 
                : result.fillable || result.filled_count > 0 || result.browser_open
                ? 'text-yellow-800'
                : 'text-red-800'
            }`}>
              {result.browser_open
                ? '🌐 Browser Opened - Complete Remaining Fields'
                : result.success 
                ? '✅ Form Filled Successfully!' 
                : result.fillable || result.filled_count > 0
                ? `⚠️ Partially Filled (${result.filled_count || 0} fields)`
                : '❌ Could Not Fill Form'}
            </h3>
            {result.message && (
              <p className={`text-sm mb-2 ${
                result.success ? 'text-green-700' : result.browser_open ? 'text-blue-700' : 'text-yellow-700'
              }`}>
                {result.message}
              </p>
            )}
            {result.browser_open && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 font-medium">
                  💡 The browser window is now open. Complete any remaining fields and submit the form manually.
                  Once submitted, you can update the application status in the Applications dashboard.
                </p>
              </div>
            )}
            {result.executed_actions && result.executed_actions.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium mb-1">Actions performed:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {result.executed_actions.slice(0, 10).map((action, idx) => (
                    <li key={idx} className="text-gray-700">{action}</li>
                  ))}
                  {result.executed_actions.length > 10 && (
                    <li className="text-gray-500">... and {result.executed_actions.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700 mb-1">Issues encountered:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {result.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx} className="text-red-600">{error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-red-500">... and {result.errors.length - 5} more issues</li>
                  )}
                </ul>
              </div>
            )}
            {result.fillable === false && (
              <p className="text-sm text-red-700 mt-2">
                This form may not be fillable automatically. Please fill it manually.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

