import React from 'react';
import { Circle, Popup, Tooltip } from 'react-leaflet';

const BusMarker = ({ bus }) => {
  // Color based on bus state
  const getColor = (state) => {
    switch (state) {
      case 'IN_TRANSIT':
        return '#3b82f6'; // Blue
      case 'AT_STOP':
        return '#f59e0b'; // Yellow/Orange
      case 'WAITING':
        return '#a855f7'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  const color = getColor(bus.state);

  return (
    <Circle
      center={[bus.position.lat, bus.position.lng]}
      radius={50}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 3,
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -20]} className="bus-tooltip">
        <span style={{ fontSize: '16px' }}>🚌</span>
      </Tooltip>
      
      <Popup>
        <div style={{ minWidth: '200px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: color }}>
            🚌 {bus.id}
          </h3>
          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <div><strong>State:</strong> <span style={{ color: color }}>{bus.state}</span></div>
            <div><strong>Current Stop:</strong> {bus.current_stop}</div>
            {bus.next_stop && (
              <div><strong>Next Stop:</strong> {bus.next_stop}</div>
            )}
            <div><strong>Passengers:</strong> {bus.passengers ? bus.passengers.length : 0} / {bus.capacity}</div>
            <div><strong>Occupancy:</strong> {bus.passengers ? ((bus.passengers.length / bus.capacity) * 100).toFixed(0) : 0}%</div>
            <div><strong>Total Served:</strong> {bus.total_served || 0}</div>
            {bus.queue_at_stop > 0 && (
              <div><strong>Queue:</strong> {bus.queue_at_stop} waiting</div>
            )}
          </div>
        </div>
      </Popup>
    </Circle>
  );
};

export default BusMarker;