import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const apiService = {
  getStatus: async () => (await api.get('/api/status')).data,
  getConfig: async () => (await api.get('/api/config')).data,
  getRoutes: async () => (await api.get('/api/routes')).data,
  getStops: async () => (await api.get('/api/stops')).data,
  getState: async () => (await api.get('/api/state')).data,
  getStatistics: async () => (await api.get('/api/statistics')).data,
  getBuses: async () => (await api.get('/api/buses')).data,
  startSimulation: async (useTrained = false) => (await api.post('/api/simulation/start', { use_trained_agents: useTrained })).data,
  stopSimulation: async () => (await api.post('/api/simulation/stop')).data,
  resetSimulation: async () => (await api.post('/api/simulation/reset')).data,
  addBus: async () => (await api.post('/api/buses/add')).data,
  removeBus: async (busId) => (await api.delete(`/api/buses/${busId}`)).data,
};

export default apiService;