import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import Map from './components/Map';
import ControlPanel from './components/ControlPanel';
import BusList from './components/BusList';
import Statistics from './components/Statistics';
import FleetManager from './components/FleetManager';
import { apiService, initializeSocket } from './services/api';

// Fix Leaflet icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function App() {
  const [state, setState] = useState(null);
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsHistory, setStatsHistory] = useState([]);
  const [stopsData, setStopsData] = useState([]);
  const [busesData, setBusesData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState('optimal');

  useEffect(() => {
    // Load initial data
    loadInitialData();
    
    // Setup WebSocket
    const socket = initializeSocket();
    
    socket.on('connect', () => {
      console.log('✓ Connected to backend WebSocket');
      addAlert('System connected', 'success');
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from backend');
      addAlert('System disconnected', 'error');
    });
    
    socket.on('state_update', (newState) => {
      setState(newState);
      analyzeSystemHealth(newState, stats);
    });
    
    socket.on('statistics_update', (newStats) => {
      setStats(newStats);
      
      // Update history for charts (keep last 50 data points)
      setStatsHistory(prev => {
        const newHistory = [
          ...prev,
          {
            time: newStats.simulation_time || prev.length,
            waitTime: newStats.average_wait_time || 0,
            served: newStats.total_passengers_served || 0,
            occupancy: (newStats.average_bus_occupancy || 0) * 100
          }
        ];
        return newHistory.slice(-50); // Keep last 50 points
      });

      // Check for alerts
      checkForAlerts(newStats);
    });

    socket.on('training_complete', (data) => {
      setIsTraining(false);
      addAlert(`Training complete! ${data.episodes || 100} episodes finished.`, 'success');
    });

    socket.on('training_error', (data) => {
      setIsTraining(false);
      addAlert(`Training error: ${data.message || 'Unknown'}`, 'error');
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state_update');
      socket.off('statistics_update');
      socket.off('training_complete');
      socket.off('training_error');
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [status, stops, buses] = await Promise.all([
        apiService.getStatus(),
        apiService.getStops(),
        apiService.getBuses()
      ]);
      
      setIsRunning(status.simulation_running);
      setStopsData(stops.stops || []);
      setBusesData(buses.buses || []);
      
      if (status.simulation_running) {
        const [currentState, currentStats] = await Promise.all([
          apiService.getState(),
          apiService.getStatistics()
        ]);
        setState(currentState);
        setStats(currentStats);
      }
      
      setLoading(false);
      addAlert('System initialized successfully', 'success');
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setLoading(false);
      addAlert('Cannot connect to backend. Make sure the server is running on http://localhost:5001', 'error');
    }
  };

  const addAlert = (message, type = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep only 5 most recent
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
    }, 5000);
  };

  const analyzeSystemHealth = (newState, newStats) => {
    if (!newState || !newStats) return;
    
    const totalWaiting = newState.total_passengers_waiting || 0;
    const avgWaitTime = newStats.average_wait_time || 0;
    const occupancy = newStats.average_bus_occupancy || 0;
    
    if (totalWaiting > 50 || avgWaitTime > 120) {
      setSystemHealth('critical');
    } else if (totalWaiting > 25 || avgWaitTime > 60) {
      setSystemHealth('warning');
    } else if (occupancy > 0.8) {
      setSystemHealth('optimal');
    } else {
      setSystemHealth('good');
    }
  };

  const checkForAlerts = (newStats) => {
    if (!newStats) return;
    
    const avgWaitTime = newStats.average_wait_time || 0;
    const totalWaiting = newStats.total_passengers_waiting || 0;
    
    if (avgWaitTime > 90) {
      addAlert(`High wait time detected: ${avgWaitTime.toFixed(1)}s`, 'warning');
    }
    
    if (totalWaiting > 40) {
      addAlert(`High passenger demand: ${totalWaiting} passengers waiting`, 'warning');
    }
    
    if (newStats.total_passengers_served > 0 && newStats.total_passengers_served % 100 === 0) {
      addAlert(`Milestone: ${newStats.total_passengers_served} passengers served!`, 'success');
    }
  };

  const handleStart = async (useTrained = false) => {
    try {
      await apiService.startSimulation(useTrained);
      setIsRunning(true);
      setStatsHistory([]);
      addAlert(useTrained ? 'Simulation started with trained agents!' : 'Simulation started successfully', 'success');
    } catch (error) {
      console.error('Failed to start simulation:', error);
      addAlert('Failed to start simulation. Make sure backend is running!', 'error');
    }
  };

  const handleTrain = async () => {
    try {
      setIsTraining(true);
      await apiService.startTraining(100);
      addAlert('Training started (100 episodes). This runs in background.', 'info');
    } catch (error) {
      console.error('Failed to start training:', error);
      setIsTraining(false);
      addAlert('Failed to start training. Make sure backend is running!', 'error');
    }
  };

  const handleStop = async () => {
    try {
      await apiService.stopSimulation();
      setIsRunning(false);
      addAlert('Simulation stopped', 'info');
    } catch (error) {
      console.error('Failed to stop simulation:', error);
      addAlert('Failed to stop simulation', 'error');
    }
  };

  const handleReset = async () => {
    try {
      await apiService.resetSimulation();
      setState(null);
      setStats(null);
      setStatsHistory([]);
      setIsRunning(false);
      setSystemHealth('optimal');
      addAlert('Simulation reset successfully', 'info');
    } catch (error) {
      console.error('Failed to reset simulation:', error);
      addAlert('Failed to reset simulation', 'error');
    }
  };

  const handleAddBus = async () => {
    try {
      const response = await apiService.addBus();
      if (response.success) {
        addAlert(response.message, 'success');
        // Refresh buses data
        const buses = await apiService.getBuses();
        setBusesData(buses.buses || []);
      } else {
        addAlert(response.message, 'warning');
      }
    } catch (error) {
      console.error('Failed to add bus:', error);
      addAlert('Failed to add bus', 'error');
    }
  };

  const handleRemoveBus = async (busId) => {
    try {
      const response = await apiService.removeBus(busId);
      if (response.success) {
        addAlert(response.message, 'success');
        // Refresh buses data
        const buses = await apiService.getBuses();
        setBusesData(buses.buses || []);
      } else {
        addAlert(response.message, 'warning');
      }
    } catch (error) {
      console.error('Failed to remove bus:', error);
      addAlert('Failed to remove bus', 'error');
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-logo">
              <div className="bus-icon">🚌</div>
              <h1>Smart Bus MARL</h1>
            </div>
            <div className="loading-spinner"></div>
            <p>Initializing intelligent transport system...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get map center from first stop or use default
  const center = stopsData?.[0]?.location 
    ? [stopsData[0].location.lat, stopsData[0].location.lng]
    : [17.3850, 78.4867];

  return (
    <div className={`app-container ${systemHealth}`}>
      {/* Alert System */}
      <div className="alert-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            <span className="alert-icon">
              {alert.type === 'success' && '✓'}
              {alert.type === 'error' && '✗'}
              {alert.type === 'warning' && '⚠'}
              {alert.type === 'info' && 'ℹ'}
            </span>
            <span className="alert-message">{alert.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-logo">
              <div className="logo-icon">🚌</div>
              <div>
                <h1>Smart Bus MARL</h1>
                <p>Intelligent Transport Management System</p>
              </div>
            </div>
          </div>
          
          <div className="header-status">
            <div className={`system-status ${systemHealth}`}>
              <div className="status-indicator"></div>
              <span>System {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}</span>
            </div>
            <div className={`simulation-status ${isRunning ? 'running' : 'stopped'}`}>
              <div className="status-dot"></div>
              <span>{isRunning ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Control Panel */}
          <ControlPanel
            isRunning={isRunning}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            onTrain={handleTrain}
            isTraining={isTraining}
            stats={stats}
            systemHealth={systemHealth}
          />

          {/* Fleet Manager */}
          <FleetManager
            buses={busesData}
            onAddBus={handleAddBus}
            onRemoveBus={handleRemoveBus}
            stats={stats}
          />

          {/* Bus List */}
          {state?.buses && <BusList buses={state.buses} />}
        </aside>

        {/* Map Container */}
        <section className="map-section">
          <div className="map-header">
            <h2>Real-Time Fleet Tracking</h2>
            <div className="map-controls">
              <div className="map-legend">
                <div className="legend-item">
                  <div className="legend-bus in-transit"></div>
                  <span>In Transit</span>
                </div>
                <div className="legend-item">
                  <div className="legend-bus at-stop"></div>
                  <span>At Stop</span>
                </div>
                <div className="legend-item">
                  <div className="legend-stop"></div>
                  <span>Bus Stop</span>
                </div>
              </div>
            </div>
          </div>
          
          <Map 
            buses={state?.buses} 
            stops={stopsData}
            stopPassengers={state?.stops}
            center={center}
          />
        </section>

        {/* Right Sidebar */}
        <aside className="sidebar-right">
          {/* Statistics Panel */}
          {stats && (
            <Statistics 
              stats={stats} 
              history={statsHistory}
              systemHealth={systemHealth}
            />
          )}

          {/* Performance Metrics */}
          {stats && (
            <div className="metrics-card">
              <h3>Performance Metrics</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-value">{(stats.average_bus_occupancy * 100).toFixed(1)}%</div>
                  <div className="metric-label">Fleet Utilization</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{stats.buses_in_transit || 0}</div>
                  <div className="metric-label">Active Buses</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{(stats.average_wait_time || 0).toFixed(1)}s</div>
                  <div className="metric-label">Avg Wait Time</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{stats.total_passengers_served || 0}</div>
                  <div className="metric-label">Total Served</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;