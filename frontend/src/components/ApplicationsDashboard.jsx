import { useState, useEffect } from 'react';
import { getMyApplications, updateApplication, deleteApplication } from '../api/client';

export default function ApplicationsDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getMyApplications();
      setApplications(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await updateApplication(appId, { status: newStatus });
      await loadApplications();
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (appId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteApplication(appId);
        await loadApplications();
      } catch (err) {
        alert('Error deleting application: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300';
      case 'pending':
      default:
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              My Applications
            </h2>
            <p className="text-gray-600 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <button
            onClick={loadApplications}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">No applications yet</p>
            <p className="text-gray-600">Fill forms to track your job applications here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {app.job_title || 'Job Application'}
                      </h3>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    {app.company_name && (
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-700 font-semibold">
                          {app.company_name}
                        </p>
                      </div>
                    )}
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 group"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="group-hover:underline">{app.job_url}</span>
                    </a>
                    {app.filled_fields && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 font-semibold">
                          <span className="text-gray-600">Auto-filled:</span>{' '}
                          <span className="text-blue-600 font-bold">{app.filled_fields.filled_count || 0}</span> out of{' '}
                          <span className="text-gray-800 font-bold">{app.filled_fields.total_fields || 0}</span> fields
                        </p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                      {app.submitted_at && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-3 ml-6">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${getStatusColor(app.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
