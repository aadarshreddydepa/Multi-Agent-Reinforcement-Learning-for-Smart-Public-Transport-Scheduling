import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Brain, Zap } from 'lucide-react';

const ControlPanel = ({ 
  isRunning, 
  onStart, 
  onStop, 
  onReset, 
  onTrain,
  isTraining,
  stats 
}) => {
  const [useTrained, setUseTrained] = useState(false);

  return (
    <div className="control-panel">
      <div className="control-card glass-card">
        {/* Header */}
        <div className="app-header">
          <div>
            <h1 className="app-title">🚌 Smart Bus MARL</h1>
            <p className="app-subtitle">Real-Time AI Tracking</p>
          </div>
          <div className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
            <span className="status-dot"></span>
            {isRunning ? 'LIVE' : 'STOPPED'}
          </div>
        </div>

        <div className="divider"></div>

        {/* Control Buttons */}
        <div className="btn-group">
          <button 
            className="btn btn-success" 
            onClick={() => onStart(useTrained)}
            disabled={isRunning}
          >
            <Play size={16} />
            Start
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onStop}
            disabled={!isRunning}
          >
            <Pause size={16} />
            Stop
          </button>
          <button 
            className="btn btn-outline" 
            onClick={onReset}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Use Trained Agents */}
        <div className="train-options" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input 
              type="checkbox" 
              checked={useTrained} 
              onChange={(e) => setUseTrained(e.target.checked)}
              disabled={isRunning}
            />
            <Zap size={14} />
            Use trained agents
          </label>
        </div>

        {/* Train Agents */}
        <div className="divider"></div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Agent Training</div>
        <button 
          className="btn btn-outline" 
          onClick={onTrain}
          disabled={isRunning || isTraining}
          style={{ width: '100%' }}
        >
          <Brain size={16} />
          {isTraining ? 'Training...' : 'Train Agents (100 eps)'}
        </button>

        {/* Statistics */}
        {stats && (
          <>
            <div className="divider"></div>
            <div className="stats-container">
              <div className="stat-box">
                <div className="stat-label">Passengers Served</div>
                <div className="stat-value">
                  {stats.total_passengers_served || 0}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Waiting</div>
                <div className="stat-value">
                  {stats.total_waiting || 0}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Avg Wait</div>
                <div className="stat-value">
                  {(stats.average_wait_time || 0).toFixed(1)}
                  <span className="stat-unit">s</span>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Occupancy</div>
                <div className="stat-value">
                  {((stats.average_bus_occupancy || 0) * 100).toFixed(0)}
                  <span className="stat-unit">%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Simulation Info */}
        {stats && stats.simulation_time !== undefined && (
          <>
            <div className="divider"></div>
            <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              Simulation Time: {stats.simulation_time.toFixed(1)}s
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;