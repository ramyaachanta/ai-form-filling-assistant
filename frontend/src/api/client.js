import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const analyzeForm = async (url) => {
  const formData = new FormData();
  formData.append('url', url);
  
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

export const checkIfFillable = async (url) => {
  const formData = new FormData();
  formData.append('url', url);
  
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(
    `${API_BASE_URL}/api/check-fillable`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getMyProfile = async () => {
  const response = await apiClient.get('/api/profiles/me');
  return response.data;
};

export const createProfile = async (profileData) => {
  const response = await apiClient.post('/api/profiles', profileData);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/api/profiles/me', profileData);
  return response.data;
};

export const deleteProfile = async () => {
  const response = await apiClient.delete('/api/profiles/me');
  return response.data;
};

export const healthCheck = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(
    `${API_BASE_URL}/api/profiles/me/resume`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const register = async (email, password) => {
  const response = await apiClient.post('/api/auth/register', {
    email,
    password,
  });
  return response.data;
};

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await axios.post(
    `${API_BASE_URL}/api/auth/login`,
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  
  if (response.data.access_token) {
    localStorage.setItem('auth_token', response.data.access_token);
  }
  
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me');
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

export const getMyApplications = async () => {
  const response = await apiClient.get('/api/applications');
  return response.data;
};

export const createApplication = async (applicationData) => {
  const response = await apiClient.post('/api/applications', applicationData);
  return response.data;
};

export const updateApplication = async (applicationId, applicationData) => {
  const response = await apiClient.put(`/api/applications/${applicationId}`, applicationData);
  return response.data;
};

export const deleteApplication = async (applicationId) => {
  const response = await apiClient.delete(`/api/applications/${applicationId}`);
  return response.data;
};

export default apiClient;

