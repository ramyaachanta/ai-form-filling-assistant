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
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
          <button
            onClick={loadApplications}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No applications yet</p>
            <p className="text-sm">Fill forms to track your job applications here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {app.job_title || 'Job Application'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.company_name && (
                      <p className="text-gray-600 mb-1">
                        <span className="font-medium">Company:</span> {app.company_name}
                      </p>
                    )}
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {app.job_url}
                    </a>
                    {app.filled_fields && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Auto-filled:</span>{' '}
                        {app.filled_fields.filled_count || 0} out of{' '}
                        {app.filled_fields.total_fields || 0} fields
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Created: {new Date(app.created_at).toLocaleString()}
                      {app.submitted_at && (
                        <span className="ml-4">
                          Submitted: {new Date(app.submitted_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                      className={`px-3 py-1 rounded text-sm border ${getStatusColor(app.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
