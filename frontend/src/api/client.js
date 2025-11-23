import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeForm = async (file, url = null) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (url) {
    formData.append('url', url);
  }
  
  const response = await axios.post(`${API_BASE_URL}/api/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const previewForm = async (requestData) => {
  const response = await apiClient.post('/api/preview', requestData);
  return response.data;
};

export const dryRunForm = async (requestData) => {
  const response = await apiClient.post('/api/dry-run', requestData);
  return response.data;
};

export const fillForm = async (requestData) => {
  const response = await apiClient.post('/api/fill', requestData);
  return response.data;
};

export const getProfiles = async () => {
  const response = await apiClient.get('/api/profiles');
  return response.data;
};

export const getProfile = async (id) => {
  const response = await apiClient.get(`/api/profiles/${id}`);
  return response.data;
};

export const createProfile = async (profileData) => {
  const response = await apiClient.post('/api/profiles', profileData);
  return response.data;
};

export const updateProfile = async (id, profileData) => {
  const response = await apiClient.put(`/api/profiles/${id}`, profileData);
  return response.data;
};

export const deleteProfile = async (id) => {
  const response = await apiClient.delete(`/api/profiles/${id}`);
  return response.data;
};

export const healthCheck = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

export default apiClient;

