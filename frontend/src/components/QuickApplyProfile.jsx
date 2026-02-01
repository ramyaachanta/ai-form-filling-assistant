import { useState, useEffect } from 'react';
import { getMyProfile, updateProfile, uploadResume } from '../api/client';

export default function QuickApplyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preferred_first_name: '',
    phone: '',
    phone_country: 'United States+1',
    location: '',
    education: [],
    employment: [],
    online_profiles: {
      linkedin: '',
      github: '',
      portfolio: '',
      website: ''
    },
    voluntary_identification: {
      gender: '',
      hispanic_latino: '',
      race: '',
      veteran_status: '',
      disability_status: ''
    }
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
        const quickApply = data.quick_apply_data || {};
        setFormData({
          first_name: quickApply.first_name || '',
          last_name: quickApply.last_name || '',
          preferred_first_name: quickApply.preferred_first_name || '',
          phone: data.phone || quickApply.phone || '',
          phone_country: quickApply.phone_country || 'United States+1',
          location: quickApply.location || '',
          education: quickApply.education || [],
          employment: quickApply.employment || [],
          online_profiles: quickApply.online_profiles || {
            linkedin: '',
            github: '',
            portfolio: '',
            website: ''
          },
          voluntary_identification: quickApply.voluntary_identification || {
            gender: '',
            hispanic_latino: '',
            race: '',
            veteran_status: '',
            disability_status: ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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
      const response = await uploadResume(file);
      alert('Resume uploaded and parsed successfully! Your Quick Apply profile has been auto-filled.');
      // Reload profile to get updated quick_apply_data
      await loadProfile();
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSave = async () => {
    if (!profile) {
      alert('Please create a basic profile first');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare update data - ensure all fields are properly formatted
      const updateData = {
        name: formData.first_name && formData.last_name 
          ? `${formData.first_name} ${formData.last_name}` 
          : profile.name || '',
        phone: formData.phone || '',
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        preferred_first_name: formData.preferred_first_name || '',
        phone_country: formData.phone_country || 'United States+1',
        location: formData.location || '',
        education: formData.education || [],
        employment: formData.employment || [],
        online_profiles: formData.online_profiles || {
          linkedin: '',
          github: '',
          portfolio: '',
          website: ''
        },
        voluntary_identification: formData.voluntary_identification || {
          gender: '',
          hispanic_latino: '',
          race: '',
          veteran_status: '',
          disability_status: ''
        }
      };
      
      console.log('Saving profile data:', JSON.stringify(updateData, null, 2));
      console.log('Education array:', formData.education);
      console.log('Employment array:', formData.employment);
      
      const response = await updateProfile(updateData);
      console.log('Save response:', JSON.stringify(response, null, 2));
      console.log('Response quick_apply_data:', response?.quick_apply_data);
      
      // Update profile state immediately from response
      if (response) {
        setProfile(response);
        const quickApply = response.quick_apply_data || {};
        setFormData({
          first_name: quickApply.first_name || '',
          last_name: quickApply.last_name || '',
          preferred_first_name: quickApply.preferred_first_name || '',
          phone: response.phone || quickApply.phone || '',
          phone_country: quickApply.phone_country || 'United States+1',
          location: quickApply.location || '',
          education: quickApply.education || [],
          employment: quickApply.employment || [],
          online_profiles: quickApply.online_profiles || {
            linkedin: '',
            github: '',
            portfolio: '',
            website: ''
          },
          voluntary_identification: quickApply.voluntary_identification || {
            gender: '',
            hispanic_latino: '',
            race: '',
            veteran_status: '',
            disability_status: ''
          }
        });
      }
      
      alert('Quick Apply profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', error.response?.data);
      alert('Error saving profile: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, {
        school: '',
        degree: '',
        discipline: '',
        start_month: '',
        start_year: '',
        end_month: '',
        end_year: ''
      }]
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...formData.education];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, education: updated });
  };

  const removeEducation = (index) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index)
    });
  };

  const addEmployment = () => {
    setFormData({
      ...formData,
      employment: [...formData.employment, {
        company: '',
        title: '',
        start_month: '',
        start_year: '',
        end_month: '',
        end_year: '',
        current: false
      }]
    });
  };

  const updateEmployment = (index, field, value) => {
    const updated = [...formData.employment];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, employment: updated });
  };

  const removeEmployment = (index) => {
    setFormData({
      ...formData,
      employment: formData.employment.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-gray-800 mb-4">Please create a basic profile first</p>
        <p className="text-gray-600">Go to "My Profile" to create your profile, then return here to set up Quick Apply.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Quick Apply Profile
          </h2>
          <p className="text-gray-600">
            Apply faster with Quick Apply. Upload your resume to autofill your profile, then review and update your information anytime.
          </p>
        </div>

        {/* Resume Upload */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Resume / CV</h3>
          {profile.resume_path ? (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-gray-800">{profile.resume_path.split('/').pop()}</span>
              </div>
              <label className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/30">
                {uploadingResume ? 'Uploading...' : 'Update Resume'}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleResumeUpload(file);
                  }}
                  disabled={uploadingResume}
                />
              </label>
            </div>
          ) : (
            <label className="block p-6 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-all">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-700 font-semibold">Click to upload resume</p>
                <p className="text-sm text-gray-500 mt-1">PDF, DOCX, or DOC files</p>
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleResumeUpload(file);
                }}
                disabled={uploadingResume}
              />
            </label>
          )}
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred First Name</label>
              <input
                type="text"
                value={formData.preferred_first_name}
                onChange={(e) => setFormData({ ...formData, preferred_first_name: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Country</label>
              <select
                value={formData.phone_country}
                onChange={(e) => setFormData({ ...formData, phone_country: e.target.value })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="United States+1">United States +1</option>
                <option value="Canada+1">Canada +1</option>
                <option value="United Kingdom+44">United Kingdom +44</option>
                <option value="India+91">India +91</option>
                <option value="Australia+61">Australia +61</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(346) 526-1097"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Houston, Texas, United States"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Education</h3>
            <button
              onClick={addEducation}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              + Add Education
            </button>
          </div>
          {formData.education.map((edu, index) => (
            <div key={index} className="mb-4 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-800">Education {index + 1}</h4>
                <button
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">School</label>
                  <input
                    type="text"
                    value={edu.school || ''}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Degree</label>
                  <select
                    value={edu.degree || ''}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="High School">High School</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Associate's Degree">Associate's Degree</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discipline</label>
                  <input
                    type="text"
                    value={edu.discipline || ''}
                    onChange={(e) => updateEducation(index, 'discipline', e.target.value)}
                    placeholder="Computer Science"
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Month</label>
                    <select
                      value={edu.start_month || ''}
                      onChange={(e) => updateEducation(index, 'start_month', e.target.value)}
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Year</label>
                    <input
                      type="number"
                      value={edu.start_year || ''}
                      onChange={(e) => updateEducation(index, 'start_year', e.target.value)}
                      placeholder="2024"
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Month</label>
                    <select
                      value={edu.end_month || ''}
                      onChange={(e) => updateEducation(index, 'end_month', e.target.value)}
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Year</label>
                    <input
                      type="number"
                      value={edu.end_year || ''}
                      onChange={(e) => updateEducation(index, 'end_year', e.target.value)}
                      placeholder="2025"
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Employment */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Employment</h3>
            <button
              onClick={addEmployment}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              + Add Employment
            </button>
          </div>
          {formData.employment.map((emp, index) => (
            <div key={index} className="mb-4 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-800">Employment {index + 1}</h4>
                <button
                  onClick={() => removeEmployment(index)}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={emp.company || ''}
                    onChange={(e) => updateEmployment(index, 'company', e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={emp.title || ''}
                    onChange={(e) => updateEmployment(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Month</label>
                    <select
                      value={emp.start_month || ''}
                      onChange={(e) => updateEmployment(index, 'start_month', e.target.value)}
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Year</label>
                    <input
                      type="number"
                      value={emp.start_year || ''}
                      onChange={(e) => updateEmployment(index, 'start_year', e.target.value)}
                      placeholder="2025"
                      className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {!emp.current && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Month</label>
                      <select
                        value={emp.end_month || ''}
                        onChange={(e) => updateEmployment(index, 'end_month', e.target.value)}
                        className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Year</label>
                      <input
                        type="number"
                        value={emp.end_year || ''}
                        onChange={(e) => updateEmployment(index, 'end_year', e.target.value)}
                        placeholder="2025"
                        className="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emp.current || false}
                      onChange={(e) => updateEmployment(index, 'current', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Current role</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Online Profiles */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Online Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
              <input
                type="url"
                value={formData.online_profiles.linkedin || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  online_profiles: { ...formData.online_profiles, linkedin: e.target.value }
                })}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Github</label>
              <input
                type="url"
                value={formData.online_profiles.github || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  online_profiles: { ...formData.online_profiles, github: e.target.value }
                })}
                placeholder="https://github.com/username"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio</label>
              <input
                type="url"
                value={formData.online_profiles.portfolio || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  online_profiles: { ...formData.online_profiles, portfolio: e.target.value }
                })}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.online_profiles.website || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  online_profiles: { ...formData.online_profiles, website: e.target.value }
                })}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Voluntary Self-Identification */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Voluntary Self-Identification</h3>
          <p className="text-sm text-gray-600 mb-4">
            Companies may allow you to self-identify as a member of the following groups. Completion of the form is entirely voluntary.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select
                value={formData.voluntary_identification.gender || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  voluntary_identification: { ...formData.voluntary_identification, gender: e.target.value }
                })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Are you Hispanic or Latino?</label>
              <select
                value={formData.voluntary_identification.hispanic_latino || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  voluntary_identification: { ...formData.voluntary_identification, hispanic_latino: e.target.value }
                })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Please identify your race</label>
              <select
                value={formData.voluntary_identification.race || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  voluntary_identification: { ...formData.voluntary_identification, race: e.target.value }
                })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                <option value="Asian">Asian</option>
                <option value="Black or African American">Black or African American</option>
                <option value="Hispanic or Latino">Hispanic or Latino</option>
                <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
                <option value="White">White</option>
                <option value="Two or more races">Two or more races</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Veteran Status</label>
              <select
                value={formData.voluntary_identification.veteran_status || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  voluntary_identification: { ...formData.voluntary_identification, veteran_status: e.target.value }
                })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                <option value="I am not a protected veteran">I am not a protected veteran</option>
                <option value="I identify as one or more of the classifications of protected veteran">I identify as one or more of the classifications of protected veteran</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Disability Status</label>
              <select
                value={formData.voluntary_identification.disability_status || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  voluntary_identification: { ...formData.voluntary_identification, disability_status: e.target.value }
                })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                <option value="Yes, I have a disability">Yes, I have a disability</option>
                <option value="No, I do not have a disability">No, I do not have a disability</option>
                <option value="No, I do not have a disability and have not had one in the past">No, I do not have a disability and have not had one in the past</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
