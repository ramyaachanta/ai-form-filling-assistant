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
    if (formData && formData.fields) {
      const initialData = {};
      formData.fields.forEach((field) => {
        if (field.label) {
          initialData[field.label] = field.value || '';
        }
      });
      setCustomData(initialData);
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
      setError(err.response?.data?.detail || err.message || 'Error filling form');
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
              {formData?.fields?.map((field, index) => (
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
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
            <pre className="text-sm text-green-700 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

