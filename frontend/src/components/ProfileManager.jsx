import { useState, useEffect } from 'react';
import {
  getMyProfile,
  createProfile,
  updateProfile,
} from '../api/client';

export default function ProfileManager({ onSelectProfile, selectedProfileId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
        // Handle address - it could be a string or an object
        let addressValue = '';
        if (data.address) {
          if (typeof data.address === 'string') {
            addressValue = data.address;
          } else if (typeof data.address === 'object') {
            addressValue = data.address.full || data.address.street || JSON.stringify(data.address);
          }
        }
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: addressValue,
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
      // Prepare data in the correct format for the API
      const profileData = {
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        additional_data: formData.additional_data || {},
      };
      
      // Handle address - convert string to object if needed, or keep as null
      if (formData.address?.trim()) {
        // If address is a string, convert it to an object with 'full' key
        // The backend expects Optional[Dict[str, Any]]
        profileData.address = { full: formData.address.trim() };
      } else {
        profileData.address = null;
      }
      
      // Remove empty strings and convert to null
      if (profileData.email === '') profileData.email = null;
      if (profileData.phone === '') profileData.phone = null;
      
      if (profile) {
        await updateProfile(profileData);
      } else {
        await createProfile(profileData);
      }
      await loadProfile();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error saving profile';
      alert(`Error saving profile: ${errorMessage}`);
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
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              My Profile
            </h2>
            <p className="text-gray-600 mt-1">Manage your personal information</p>
          </div>
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              {showForm ? 'Cancel' : 'Edit Profile'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                }}
                className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border-2 border-gray-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                {profile ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {!showForm && profile && (
          <div className="border-2 border-gray-200 rounded-xl p-8 bg-gradient-to-r from-gray-50 to-blue-50">
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

