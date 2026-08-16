import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost/construction-v1/backend'
    : window.location.origin + '/backend'
);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

// Projects
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Clients
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Employees
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// Attendance
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  save: (data) => api.post('/attendance', data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

// Materials
export const materialsAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getOne: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Suppliers
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Work Orders
export const workOrdersAPI = {
  getAll: (params) => api.get('/workorders', { params }),
  getOne: (id) => api.get(`/workorders/${id}`),
  create: (data) => api.post('/workorders', data),
  update: (id, data) => api.put(`/workorders/${id}`, data),
  delete: (id) => api.delete(`/workorders/${id}`),
};

// Expenses
export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Invoices
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
};

// Salary
export const salaryAPI = {
  getAll: (params) => api.get('/salary', { params }),
  create: (data) => api.post('/salary', data),
  update: (id, data) => api.put(`/salary/${id}`, data),
};

// Documents
export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Reports
export const reportsAPI = {
  get: (params) => api.get('/reports', { params }),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Settings
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Project Payments
export const projectPaymentsAPI = {
  getAll: (params) => api.get('/project-payments', { params }),
  getOne: (id) => api.get(`/project-payments/${id}`),
  create: (data) => api.post('/project-payments', data),
  update: (id, data) => api.put(`/project-payments/${id}`, data),
  delete: (id) => api.delete(`/project-payments/${id}`),
};

// Security Deposits
export const securityDepositsAPI = {
  getAll: (params) => api.get('/security-deposits', { params }),
  getOne: (id) => api.get(`/security-deposits/${id}`),
  create: (data) => api.post('/security-deposits', data),
  update: (id, data) => api.put(`/security-deposits/${id}`, data),
  delete: (id) => api.delete(`/security-deposits/${id}`),
};

// BOQ
export const boqAPI = {
  getAll: (params) => api.get('/boq', { params }),
  getOne: (id) => api.get(`/boq/${id}`),
  create: (data) => api.post('/boq', data),
  update: (id, data) => api.put(`/boq/${id}`, data),
  delete: (id) => api.delete(`/boq/${id}`),
};

// Project Schedule
export const projectScheduleAPI = {
  getAll: (params) => api.get('/project-schedule', { params }),
  getOne: (id) => api.get(`/project-schedule/${id}`),
  create: (data) => api.post('/project-schedule', data),
  update: (id, data) => api.put(`/project-schedule/${id}`, data),
  delete: (id) => api.delete(`/project-schedule/${id}`),
};

// Purchases
export const purchasesAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getOne: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

// Stock
export const stockAPI = {
  getAll: (params) => api.get('/stock', { params }),
  getOne: (id) => api.get(`/stock/${id}`),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  delete: (id) => api.delete(`/stock/${id}`),
};

// Labour Wages
export const labourWagesAPI = {
  getAll: (params) => api.get('/labour-wages', { params }),
  getOne: (id) => api.get(`/labour-wages/${id}`),
  create: (data) => api.post('/labour-wages', data),
  update: (id, data) => api.put(`/labour-wages/${id}`, data),
  delete: (id) => api.delete(`/labour-wages/${id}`),
};

// Tools
export const toolsAPI = {
  getAll: (params) => api.get('/tools', { params }),
  getOne: (id) => api.get(`/tools/${id}`),
  create: (data) => api.post('/tools', data),
  update: (id, data) => api.put(`/tools/${id}`, data),
  delete: (id) => api.delete(`/tools/${id}`),
};

// Vehicles
export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getOne: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export default api;
