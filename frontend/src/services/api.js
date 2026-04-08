import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getSessions: () => api.get('/chat/sessions'),
  getSessionMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  createSession: (title) => api.post('/chat/sessions', null, { params: { title } }),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
  regenerateResponse: (sessionId) => api.post(`/chat/sessions/${sessionId}/regenerate`),
  locationChat: (data) => api.post('/chat/location', data),
};

// Medical Report APIs
export const reportAPI = {
  uploadReport: (formData) => api.post('/reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getReports: () => api.get('/reports'),
  getReportById: (reportId) => api.get(`/reports/${reportId}`),
  deleteReport: (reportId) => api.delete(`/reports/${reportId}`),
};

// Patient APIs
export const patientAPI = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data) => api.put('/patient/profile', data),
  getStats: () => api.get('/patient/stats'),
  getAppointments: () => api.get('/patient/appointments'),
  bookAppointment: (data) => api.post('/patient/appointments', data),
  cancelAppointment: (id) => api.delete(`/patient/appointments/${id}`),
  getDoctors: () => api.get('/patient/doctors'),
  sendEmergencyAlert: () => api.post('/patient/emergency'),
  getSuiteState: () => api.get('/patient/suite/state'),
  saveSuiteState: (data) => api.put('/patient/suite/state', data),
  estimateSuiteCost: (data) => api.post('/patient/suite/estimate', data),
  getSuiteCharts: () => api.get('/patient/suite/charts'),
  updateSuiteAdherence: (data) => api.post('/patient/suite/adherence', data),
  getOptimizedSlots: () => api.get('/patient/suite/optimized-slots'),
  getHospitalInsights: () => api.get('/patient/suite/hospital-insights'),
  addFamilyMember: (data) => api.post('/patient/suite/family-members', data),
  updateFamilyMember: (memberId, data) => api.put(`/patient/suite/family-members/${memberId}`, data),
  removeFamilyMember: (memberId) => api.delete(`/patient/suite/family-members/${memberId}`),
  addMedication: (data) => api.post('/patient/suite/medications', data),
  updateMedication: (medicationId, data) => api.put(`/patient/suite/medications/${medicationId}`, data),
  toggleMedication: (medicationId) => api.patch(`/patient/suite/medications/${medicationId}/toggle`),
  removeMedication: (medicationId) => api.delete(`/patient/suite/medications/${medicationId}`),
  logSuiteMood: (data) => api.post('/patient/suite/mood', data),
  updateSuiteJournal: (data) => api.put('/patient/suite/journal', data),
  getSuiteEvents: () => api.get('/patient/suite/events'),
};

// Doctor APIs
export const doctorAPI = {
  getStats: () => api.get('/doctor/stats'),
  getAppointments: () => api.get('/doctor/appointments'),
  getPatients: () => api.get('/doctor/patients'),
  getPatientDetails: (patientId) => api.get(`/doctor/patients/${patientId}`),
  getPatientReports: (patientId) => api.get(`/doctor/patients/${patientId}/reports`),
  generateSoapNote: (data) => api.post('/doctor/soap-note', data),
  updateAppointment: (appointmentId, data) => api.put(`/doctor/appointments/${appointmentId}`, data),
};

// Admin APIs
export const adminAPI = {
  // Dashboard & Stats
  getDashboardStats: () => api.get('/admin/dashboard'),

  // User Management
  getAllUsers: () => api.get('/admin/users'),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  createDoctor: (data) => api.post('/admin/users/create-doctor', data),

  // Chat Sessions
  getAllSessions: () => api.get('/admin/sessions'),
  getSessionMessages: (sessionId) => api.get(`/admin/sessions/${sessionId}/messages`),
  flagSession: (sessionId) => api.put(`/admin/sessions/${sessionId}/flag`),

  // Appointments
  getAllAppointments: () => api.get('/admin/appointments'),
  updateAppointmentStatus: (appointmentId, status) =>
    api.put(`/admin/appointments/${appointmentId}/status`, { status }),
};

export default api;
