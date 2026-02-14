import axios from 'axios';
import io from 'socket.io-client';
import { Bus, Stop, Statistics, SimulationState } from '../types';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
    socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const apiService = {
  getStatus: async () => (await api.get<{ simulation_running: boolean }>('/api/status')).data,
  getConfig: async () => (await api.get<unknown>('/api/config')).data, // Type later
  getRoutes: async () => (await api.get<unknown>('/api/routes')).data,
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
    (await api.post<{ success: boolean; message: string }>('/api/buses/add')).data,
  
  removeBus: async (busId: string) => 
    (await api.delete<{ success: boolean; message: string }>(`/api/buses/${busId}/remove`)).data,
};

export default apiService;
