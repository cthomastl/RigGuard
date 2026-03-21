import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const PRED_URL = import.meta.env.VITE_PREDICTION_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL });
export const predApi = axios.create({ baseURL: PRED_URL });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
};

// Equipment
export const equipmentApi = {
  list: (params?: Record<string, string>) => api.get("/api/equipment", { params }),
  get: (id: number) => api.get(`/api/equipment/${id}`),
  stats: () => api.get("/api/equipment/stats"),
  create: (data: any) => api.post("/api/equipment", data),
  update: (id: number, data: any) => api.put(`/api/equipment/${id}`, data),
  delete: (id: number) => api.delete(`/api/equipment/${id}`),
};

// Sensors
export const sensorsApi = {
  list: (equipmentId?: number) => api.get("/api/sensors", { params: equipmentId ? { equipmentId } : {} }),
  readings: (sensorId: number, hours = 24) => api.get(`/api/sensors/${sensorId}/readings`, { params: { hours } }),
  latest: (sensorId: number) => api.get(`/api/sensors/${sensorId}/latest`),
  ingest: (sensorId: number, value: number) => api.post(`/api/sensors/${sensorId}/readings`, { value }),
};

// Alerts
export const alertsApi = {
  list: (params?: Record<string, string>) => api.get("/api/alerts", { params }),
  acknowledge: (id: number) => api.post(`/api/alerts/${id}/acknowledge`),
  resolve: (id: number) => api.post(`/api/alerts/${id}/resolve`),
};

// Inspections
export const inspectionsApi = {
  list: (params?: Record<string, string>) => api.get("/api/inspections", { params }),
  get: (id: number) => api.get(`/api/inspections/${id}`),
  create: (data: any) => api.post("/api/inspections", data),
  update: (id: number, data: any) => api.put(`/api/inspections/${id}`, data),
  cancel: (id: number) => api.delete(`/api/inspections/${id}`),
};

// Work Orders
export const workOrdersApi = {
  list: (params?: Record<string, string>) => api.get("/api/work-orders", { params }),
  get: (id: number) => api.get(`/api/work-orders/${id}`),
  create: (data: any) => api.post("/api/work-orders", data),
  update: (id: number, data: any) => api.put(`/api/work-orders/${id}`, data),
};

// Dashboard
export const dashboardApi = {
  summary: () => api.get("/api/dashboard/summary"),
  healthTrend: () => api.get("/api/dashboard/equipment-health-trend"),
};

// Users
export const usersApi = {
  list: () => api.get("/api/users"),
  create: (data: any) => api.post("/api/users", data),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
};

// Prediction
export const predictionApi = {
  equipmentPrediction: (equipmentId: number) => predApi.get(`/predict/equipment/${equipmentId}`),
  maintenanceSchedule: (equipmentId: number) => predApi.get(`/predict/maintenance-schedule/${equipmentId}`),
  anomaly: (sensorId: number, readings: { value: number }[]) =>
    predApi.post("/predict/anomaly", { sensor_id: sensorId, readings }),
  rul: (sensorId: number, currentValue: number, maxThreshold: number) =>
    predApi.post("/predict/rul", { sensor_id: sensorId, current_value: currentValue, max_threshold: maxThreshold }),
};
