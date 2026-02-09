import React from 'react';
import { Bus, Users, TrendingUp, CheckCircle, MapPin, Clock, Route } from 'lucide-react';

const BusList = ({ buses }) => {
  if (!buses || Object.keys(buses).length === 0) {
    return (
      <div className="info-panel">
        <div className="info-card glass-card">
          <h3 className="section-title">
            <Bus size={24} className="card-icon" />
            Active Fleet
          </h3>
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem', 
            color: 'var(--gray-500)',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🚌</div>
            No buses active. Start the simulation to see the fleet in action.
          </div>
        </div>
      </div>
    );
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'IN_TRANSIT': return 'var(--primary-600)';
      case 'AT_STOP': return 'var(--accent-600)';
      case 'WAITING': return 'var(--secondary-600)';
      default: return 'var(--gray-600)';
    }
  };

  const getStateBg = (state) => {
    switch (state) {
      case 'IN_TRANSIT': return 'rgba(14, 165, 233, 0.1)';
      case 'AT_STOP': return 'rgba(245, 158, 11, 0.1)';
      case 'WAITING': return 'rgba(16, 185, 129, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  return (
    <div className="info-panel">
      <div className="info-card glass-card">
        <h3 className="section-title">
          <Bus size={24} className="card-icon" />
          Active Fleet ({Object.keys(buses).length})
        </h3>
        
        <div className="bus-list">
          {Object.values(buses).map((bus) => {
            const occupancyRate = bus.passengers ? (bus.passengers.length / bus.capacity) : 0;
            const routeColor = bus.route_color || '#0ea5e9';
            
            return (
              <div key={bus.id} className="bus-item">
                <div className="bus-item-header">
                  <div className="bus-name-section">
                    <div 
                      className="bus-name" 
                      style={{ 
                        borderLeft: `4px solid ${routeColor}`,
                        paddingLeft: '12px'
                      }}
                    >
                      {bus.id.replace('bus_', 'Bus ').replace('dynamic_', 'Dynamic Bus ')}
                    </div>
                    <div className="bus-route">
                      <Route size={12} style={{ marginRight: '4px' }} />
                      {bus.assigned_route ? bus.assigned_route.join(' → ') : 'Route Active'}
                    </div>
                  </div>
                  <span 
                    className={`bus-state ${bus.state.toLowerCase()}`}
                    style={{
                      backgroundColor: getStateBg(bus.state),
                      color: getStateColor(bus.state),
                      border: `1px solid ${getStateColor(bus.state)}20`
                    }}
                  >
                    {bus.state.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="bus-details">
                  <div className="bus-detail-item" title="Current Location">
                    <MapPin size={14} style={{ color: routeColor }} />
                    <span>{bus.current_stop}</span>
                  </div>
                  <div className="bus-detail-item" title="Passengers on Board">
                    <Users size={14} style={{ color: occupancyRate > 0.8 ? '#dc2626' : occupancyRate > 0.5 ? '#d97706' : '#059669' }} />
                    <span>{bus.passengers ? bus.passengers.length : 0}/{bus.capacity}</span>
                  </div>
                  <div className="bus-detail-item" title="Bus Occupancy">
                    <TrendingUp size={14} style={{ color: occupancyRate > 0.8 ? '#dc2626' : occupancyRate > 0.5 ? '#d97706' : '#059669' }} />
                    <span>{(occupancyRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="bus-detail-item" title="Total Passengers Served">
                    <CheckCircle size={14} style={{ color: '#059669' }} />
                    <span>{bus.total_served || 0}</span>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div style={{ margin: '12px 0' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--gray-600)', 
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Occupancy Level
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${occupancyRate * 100}%`,
                      height: '100%',
                      background: occupancyRate > 0.8 
                        ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                        : occupancyRate > 0.5 
                        ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                        : 'linear-gradient(90deg, #059669, #10b981)',
                      borderRadius: '3px',
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Additional info if available */}
                {bus.next_stop && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px 12px',
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${routeColor}`,
                    fontSize: '12px',
                    color: 'var(--gray-700)',
                    fontWeight: '500'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} style={{ color: routeColor }} />
                      <span>Next Stop: {bus.next_stop}</span>
                    </div>
                  </div>
                )}

                {/* Route Progress */}
                {bus.current_stop_index !== undefined && bus.assigned_route && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--gray-600)', 
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      Route Progress
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center'
                    }}>
                      {bus.assigned_route.map((stop, index) => (
                        <div
                          key={index}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: index <= bus.current_stop_index ? routeColor : 'rgba(0,0,0,0.1)',
                            border: index === bus.current_stop_index ? `2px solid ${routeColor}` : 'none',
                            transform: index === bus.current_stop_index ? 'scale(1.3)' : 'scale(1)',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusList;