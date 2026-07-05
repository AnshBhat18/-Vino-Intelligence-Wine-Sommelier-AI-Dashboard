import axios from 'axios';

// Default backend location
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictSingle = async (chemicalData) => {
  const response = await api.post('/predict/single', chemicalData);
  return response.data;
};

export const predictBatch = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/predict/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/model/info');
  return response.data;
};

export const retrainModel = async (retrainParams) => {
  const response = await api.post('/model/retrain', retrainParams);
  return response.data;
};

export const getPredictionHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

export const submitFeedback = async (recordId, feedbackData) => {
  const response = await api.post(`/history/${recordId}/feedback`, feedbackData);
  return response.data;
};

export const clearPredictionHistory = async () => {
  const response = await api.delete('/history/clear');
  return response.data;
};

export default api;
