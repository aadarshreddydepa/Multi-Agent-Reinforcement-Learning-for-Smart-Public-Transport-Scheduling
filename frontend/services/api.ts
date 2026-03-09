import axios from 'axios';
import io from 'socket.io-client';
import { Bus, Stop, Statistics, SimulationState } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// Diagnostic Interceptors
api.interceptors.request.use(config => {
  console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ API Error Detail:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
      request: error.request ? 'Request sent but no response received' : 'Request setting error'
    });
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T; // Or sometimes directly T, need to check
}

import { Socket } from 'socket.io-client';

// Socket instance
let socket: Socket | null = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io("http://127.0.0.1:5001", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const apiService = {
  getStatus: async () => (await api.get<{ simulation_running: boolean }>('/api/status')).data,
  getConfig: async () => (await api.get<unknown>('/api/config')).data, // Type later
  getRoutes: async () => (await api.get<unknown>('/api/routes')).data,
  getRoadPaths: async () => (await api.get<unknown>('/api/routes/road-paths')).data,
  getStops: async () => (await api.get<{ stops: Stop[] }>('/api/stops')).data,
  getState: async () => (await api.get<SimulationState>('/api/state')).data,
  getStatistics: async () => (await api.get<Statistics>('/api/statistics')).data,
  getBuses: async () => (await api.get<{ buses: Bus[] }>('/api/buses')).data,

  startSimulation: async (useTrained = false) =>
    (await api.post<{ success: boolean; message: string }>('/api/simulation/start', { use_trained_agents: useTrained })).data,

  stopSimulation: async () =>
    (await api.post<{ success: boolean; message: string }>('/api/simulation/stop')).data,

  resetSimulation: async () =>
    (await api.post<{ success: boolean; message: string }>('/api/simulation/reset')).data,

  startTraining: async (numEpisodes = 100) =>
    (await api.post<{ success: boolean; message: string }>('/api/training/start', { num_episodes: numEpisodes })).data,

  addBus: async () =>
    (await api.post<{ success: boolean; message: string }>('/api/buses')).data,

  removeBus: async (busId: string) =>
    (await api.delete<{ success: boolean; message: string }>(`/api/buses/${busId}`)).data,
};

export default apiService;
