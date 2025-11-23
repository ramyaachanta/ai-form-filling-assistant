import { useState, useEffect } from 'react';
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
} from '../api/client';

export default function ProfileManager({ onSelectProfile, selectedProfileId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    additional_data: {},
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, formData);
      } else {
        await createProfile(formData);
      }
      await loadProfiles();
      setShowForm(false);
      setEditingProfile(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        additional_data: {},
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      additional_data: profile.additional_data || {},
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await deleteProfile(id);
        await loadProfiles();
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Error deleting profile');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">User Profiles</h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingProfile(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                additional_data: {},
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : '+ New Profile'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingProfile ? 'Edit Profile' : 'Create Profile'}
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
                  setEditingProfile(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingProfile ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {profiles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No profiles yet. Create one to get started!
            </div>
          ) : (
            profiles.map((profile) => (
              <div
                key={profile.id}
                className={`border rounded-lg p-4 hover:border-blue-500 transition ${
                  selectedProfileId === profile.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {profile.name}
                      </h3>
                      {selectedProfileId === profile.id && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {profile.email && (
                        <p>
                          <span className="font-medium">Email:</span>{' '}
                          {profile.email}
                        </p>
                      )}
                      {profile.phone && (
                        <p>
                          <span className="font-medium">Phone:</span>{' '}
                          {profile.phone}
                        </p>
                      )}
                      {profile.address && (
                        <p>
                          <span className="font-medium">Address:</span>{' '}
                          {profile.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {onSelectProfile && (
                      <button
                        onClick={() => onSelectProfile(profile.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(profile)}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

