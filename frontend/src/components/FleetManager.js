import React, { useState } from 'react';
import { Plus, Trash2, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const FleetManager = ({ buses, onAddBus, onRemoveBus, stats }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  
  const totalBuses = buses?.length || 0;
  const dynamicBuses = buses?.filter(bus => bus.is_dynamic).length || 0;
  const activeBuses = buses?.filter(bus => bus.state !== 'IDLE').length || 0;
  
  const handleAddBus = () => {
    onAddBus();
  };
  
  const handleRemoveBus = (busId) => {
    setShowConfirmDialog(busId);
  };
  
  const confirmRemoveBus = () => {
    if (showConfirmDialog) {
      onRemoveBus(showConfirmDialog);
      setShowConfirmDialog(null);
    }
  };
  
  const cancelRemove = () => {
    setShowConfirmDialog(null);
  };
  
  const getBusUtilization = () => {
    if (!stats || !stats.num_buses) return 0;
    return ((stats.average_bus_occupancy || 0) * 100).toFixed(1);
  };
  
  const getDemandLevel = () => {
    const waiting = stats?.total_passengers_waiting || 0;
    if (waiting > 40) return { level: 'High', color: '#ef4444' };
    if (waiting > 20) return { level: 'Medium', color: '#f59e0b' };
    return { level: 'Low', color: '#10b981' };
  };
  
  const demand = getDemandLevel();
  
  return (
    <div className="fleet-manager">
      <div className="fleet-card">
        <div className="fleet-header">
          <h3>
            <Users size={20} />
            Fleet Management
          </h3>
          <div className="fleet-stats">
            <span className="fleet-stat">
              {totalBuses} Total
            </span>
            {dynamicBuses > 0 && (
              <span className="fleet-stat dynamic">
                {dynamicBuses} Dynamic
              </span>
            )}
          </div>
        </div>
        
        {/* Fleet Overview */}
        <div className="fleet-overview">
          <div className="overview-item">
            <div className="overview-label">Active Buses</div>
            <div className="overview-value">{activeBuses}</div>
          </div>
          <div className="overview-item">
            <div className="overview-label">Utilization</div>
            <div className="overview-value">{getBusUtilization()}%</div>
          </div>
          <div className="overview-item">
            <div className="overview-label">Demand</div>
            <div className="overview-value" style={{ color: demand.color }}>
              {demand.level}
            </div>
          </div>
        </div>
        
        {/* Bus List */}
        <div className="bus-list-compact">
          {buses?.slice(0, 3).map(bus => (
            <div key={bus.id} className="bus-item-compact">
              <div className="bus-info">
                <span className="bus-id">{bus.id.replace('bus_', 'B')}</span>
                <span className={`bus-state-small ${bus.state.toLowerCase()}`}>
                  {bus.state.replace('_', ' ')}
                </span>
              </div>
              <div className="bus-metrics">
                <span className="bus-occupancy">
                  {bus.occupancy_rate?.toFixed(0) || 0}%
                </span>
                {bus.is_dynamic && (
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveBus(bus.id)}
                    title="Remove dynamic bus"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {totalBuses > 3 && (
            <div className="more-buses">
              +{totalBuses - 3} more buses
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="fleet-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddBus}
            disabled={totalBuses >= 10}
          >
            <Plus size={16} />
            Add Bus
          </button>
          
          {stats?.total_passengers_waiting > 30 && (
            <div className="demand-alert">
              <AlertTriangle size={14} />
              <span>High demand detected</span>
            </div>
          )}
        </div>
        
        {/* Recommendations */}
        {stats && (
          <div className="fleet-recommendations">
            <h4>AI Recommendations</h4>
            <div className="recommendation-list">
              {stats.total_passengers_waiting > 25 && totalBuses < 8 && (
                <div className="recommendation-item">
                  <span className="rec-icon">📈</span>
                  <span>Add 1-2 buses to handle demand</span>
                </div>
              )}
              {stats.average_wait_time > 60 && (
                <div className="recommendation-item">
                  <span className="rec-icon">⏱️</span>
                  <span>Consider optimizing routes</span>
                </div>
              )}
              {getBusUtilization() < 40 && totalBuses > 4 && (
                <div className="recommendation-item">
                  <span className="rec-icon">📉</span>
                  <span>Low utilization - remove excess buses</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h4>Remove Dynamic Bus</h4>
            <p>Are you sure you want to remove bus {showConfirmDialog.replace('dynamic_', 'D')}?</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={cancelRemove}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmRemoveBus}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManager;
