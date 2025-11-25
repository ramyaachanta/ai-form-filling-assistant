import { useState, useEffect } from 'react';
import {
  getMyProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  uploadResume,
} from '../api/client';

export default function ProfileManager({ onSelectProfile, selectedProfileId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    additional_data: {},
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: typeof data.address === 'string' 
            ? data.address 
            : data.address?.full || '',
          additional_data: data.additional_data || {},
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 404) {
        setProfile(null);
        setShowForm(true);
      } else {
        alert('Error loading profile: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (profile) {
        await updateProfile(formData);
      } else {
        await createProfile(formData);
      }
      await loadProfile();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error saving profile';
      alert(`Error saving profile: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
      try {
        await deleteProfile();
        setProfile(null);
        setShowForm(true);
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Error deleting profile');
      }
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(fileExt)) {
      alert('Please upload a PDF or DOCX file');
      return;
    }
    
    try {
      setUploadingResume(true);
      const result = await uploadResume(file);
      alert('Resume uploaded and parsed successfully!');
      await loadProfile();
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          {profile && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setFormData({
                    name: profile.name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    address: typeof profile.address === 'string' 
                      ? profile.address 
                      : profile.address?.full || '',
                    additional_data: profile.additional_data || {},
                  });
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {showForm ? 'Cancel' : 'Edit Profile'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {profile ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {!showForm && profile && (
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {profile.name}
                </h3>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                {profile.email && (
                  <p>
                    <span className="font-medium">Email:</span> {profile.email}
                  </p>
                )}
                {profile.phone && (
                  <p>
                    <span className="font-medium">Phone:</span> {profile.phone}
                  </p>
                )}
                {profile.address && (
                  <p>
                    <span className="font-medium">Address:</span>{' '}
                    {typeof profile.address === 'string' 
                      ? profile.address 
                      : profile.address?.full || JSON.stringify(profile.address)}
                  </p>
                )}
                {profile.resume_path && (
                  <p className="text-green-600">
                    <span className="font-medium">✓ Resume:</span> Uploaded
                  </p>
                )}
                {profile.resume_data && profile.resume_data.skills && profile.resume_data.skills.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Skills ({profile.resume_data.skills.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.resume_data.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2 pt-4 border-t">
                <label className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
                  {uploadingResume ? 'Uploading...' : profile.resume_path ? 'Update Resume' : 'Upload Resume'}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleResumeUpload(file);
                      }
                    }}
                    disabled={uploadingResume}
                  />
                </label>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!showForm && !profile && (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-4">No profile found. Create your profile to get started!</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

