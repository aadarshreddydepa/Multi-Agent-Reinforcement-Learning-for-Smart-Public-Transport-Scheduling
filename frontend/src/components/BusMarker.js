import React, { useState, useEffect } from 'react';
import { Circle, Popup, Tooltip } from 'react-leaflet';

const BusMarker = ({ bus }) => {
  const [animatedPosition, setAnimatedPosition] = useState({
    lat: bus.position.lat,
    lng: bus.position.lng
  });
  const [isMoving, setIsMoving] = useState(false);

  // Smooth position animation
  useEffect(() => {
    const startLat = animatedPosition.lat;
    const startLng = animatedPosition.lng;
    const endLat = bus.position.lat;
    const endLng = bus.position.lng;
    
    // Only animate if position changed significantly
    const distance = Math.sqrt(
      Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
    );
    
    if (distance > 0.0001) {
      setIsMoving(true);
      
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in-out animation
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const newLat = startLat + (endLat - startLat) * easeProgress;
        const newLng = startLng + (endLng - startLng) * easeProgress;
        
        setAnimatedPosition({ lat: newLat, lng: newLng });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsMoving(false);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setAnimatedPosition({ lat: endLat, lng: endLng });
    }
  }, [bus.position]);

  // Color based on bus state
  const getColor = (state) => {
    switch (state) {
      case 'IN_TRANSIT':
        return '#0ea5e9'; // Premium blue
      case 'AT_STOP':
        return '#f59e0b'; // Amber
      case 'WAITING':
        return '#a855f7'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  const color = getColor(bus.state);
  const occupancyRate = bus.passengers ? (bus.passengers.length / bus.capacity) : 0;
  
  // Dynamic radius based on occupancy
  const radius = 40 + (occupancyRate * 30); // 40-70px based on occupancy

  return (
    <Circle
      center={[animatedPosition.lat, animatedPosition.lng]}
      radius={radius}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: isMoving ? 4 : 3,
        className: isMoving ? 'bus-moving' : 'bus-stationary',
        dashArray: isMoving ? '10, 5' : null,
        dashOffset: isMoving ? '0' : null,
      }}
      style={{
        animation: isMoving ? 'pulse 1s infinite' : 'none',
        filter: isMoving ? 'drop-shadow(0 0 10px rgba(14, 165, 233, 0.5))' : 'none',
      }}
    >
      <Tooltip 
        permanent 
        direction="top" 
        offset={[0, -20]} 
        className="bus-tooltip"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        <span style={{ 
          fontSize: '16px',
          filter: isMoving ? 'drop-shadow(0 0 5px rgba(14, 165, 233, 0.8))' : 'none',
          animation: isMoving ? 'bounce 1s infinite' : 'none'
        }}>🚌</span>
      </Tooltip>
      
      <Popup
        style={{
          borderRadius: '12px',
          border: `2px solid ${color}`,
        }}
      >
        <div style={{ 
          minWidth: '220px',
          padding: '8px',
          borderRadius: '8px',
          background: `linear-gradient(135deg, ${color}10, transparent)`,
        }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: color,
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ 
              fontSize: '20px',
              animation: isMoving ? 'float 2s ease-in-out infinite' : 'none'
            }}>🚌</span>
            {bus.id.replace('bus_', 'Bus ').replace('dynamic_', 'Dynamic Bus ')}
          </h3>
          
          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '4px 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span><strong>State:</strong></span>
              <span style={{ 
                color: color, 
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: `${color}20`,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {bus.state.replace('_', ' ')}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span><strong>Current Stop:</strong></span>
              <span style={{ fontWeight: '500' }}>{bus.current_stop}</span>
            </div>
            
            {bus.next_stop && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span><strong>Next Stop:</strong></span>
                <span style={{ fontWeight: '500' }}>{bus.next_stop}</span>
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '4px 0',
              backgroundColor: occupancyRate > 0.8 ? '#fef2f2' : occupancyRate > 0.5 ? '#fffbeb' : '#f0fdf4',
              borderRadius: '6px',
              margin: '4px 0'
            }}>
              <span><strong>Passengers:</strong></span>
              <span style={{ 
                fontWeight: '700',
                color: occupancyRate > 0.8 ? '#dc2626' : occupancyRate > 0.5 ? '#d97706' : '#059669'
              }}>
                {bus.passengers ? bus.passengers.length : 0} / {bus.capacity}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span><strong>Occupancy:</strong></span>
              <span style={{ 
                fontWeight: '600',
                color: occupancyRate > 0.8 ? '#dc2626' : occupancyRate > 0.5 ? '#d97706' : '#059669'
              }}>
                {occupancyRate > 0 ? (occupancyRate * 100).toFixed(0) : 0}%
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span><strong>Total Served:</strong></span>
              <span style={{ fontWeight: '600', color: '#059669' }}>
                {bus.total_served || 0}
              </span>
            </div>
            
            {bus.queue_at_stop > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                marginTop: '4px'
              }}>
                <span><strong>Queue:</strong></span>
                <span style={{ fontWeight: '600', color: '#d97706' }}>
                  {bus.queue_at_stop} waiting
                </span>
              </div>
            )}
            
            {isMoving && (
              <div style={{ 
                textAlign: 'center', 
                padding: '6px',
                backgroundColor: '#e0f2fe',
                borderRadius: '6px',
                marginTop: '8px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#0284c7',
                animation: 'pulse 1s infinite'
              }}>
                🚀 In Transit
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Circle>
  );
};

export default BusMarker;