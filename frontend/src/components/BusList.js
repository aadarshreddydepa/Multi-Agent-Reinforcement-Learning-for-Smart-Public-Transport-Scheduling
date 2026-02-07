import React from 'react';
import { Bus, Users, TrendingUp, CheckCircle } from 'lucide-react';

const BusList = ({ buses }) => {
  if (!buses || Object.keys(buses).length === 0) {
    return (
      <div className="info-panel">
        <div className="info-card glass-card">
          <h3 className="section-title">
            <Bus size={20} />
            Active Buses
          </h3>
          <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
            No buses active. Start the simulation to see buses.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <div className="info-card glass-card">
        <h3 className="section-title">
          <Bus size={20} />
          Active Buses ({Object.keys(buses).length})
        </h3>
        
        <div className="bus-list">
          {Object.values(buses).map((bus) => (
            <div key={bus.id} className="bus-item">
              <div className="bus-item-header">
                <span className="bus-name">
                  {bus.id.replace('bus_', 'Bus ')}
                </span>
                <span className={`bus-state ${bus.state.toLowerCase()}`}>
                  {bus.state}
                </span>
              </div>
              
              <div className="bus-details">
                <div title="Current Location">
                  📍 {bus.current_stop}
                </div>
                <div title="Passengers on Board">
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {bus.passengers ? bus.passengers.length : 0}
                </div>
                <div title="Bus Occupancy">
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {bus.passengers ? ((bus.passengers.length / bus.capacity) * 100).toFixed(0) : 0}%
                </div>
                <div title="Total Passengers Served">
                  <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {bus.total_served || 0}
                </div>
              </div>

              {/* Additional info if available */}
              {bus.next_stop && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '11px', 
                  color: '#9ca3af',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '8px'
                }}>
                  Next: {bus.next_stop}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusList;