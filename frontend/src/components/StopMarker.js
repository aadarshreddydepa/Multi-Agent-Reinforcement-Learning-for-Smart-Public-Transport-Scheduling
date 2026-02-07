import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom icon for bus stops
const stopIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const StopMarker = ({ stop }) => {
  return (
    <Marker 
      position={[stop.location.lat, stop.location.lng]}
      icon={stopIcon}
    >
      <Popup>
        <div style={{ minWidth: '200px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>
            🚏 {stop.name}
          </h3>
          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <div><strong>Description:</strong> {stop.description}</div>
            <div><strong>Capacity:</strong> {stop.capacity} people</div>
            {stop.passengerCount !== undefined && (
              <div><strong>Passengers Waiting:</strong> {stop.passengerCount}</div>
            )}
            {stop.peak_demand_hours && stop.peak_demand_hours.length > 0 && (
              <div>
                <strong>Peak Hours:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {stop.peak_demand_hours.map((hour, idx) => (
                    <li key={idx}>{hour}</li>
                  ))}
                </ul>
              </div>
            )}
            {stop.amenities && stop.amenities.length > 0 && (
              <div>
                <strong>Amenities:</strong>
                <div style={{ marginTop: '5px' }}>
                  {stop.amenities.map((amenity, idx) => (
                    <span 
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        marginRight: '5px',
                        marginBottom: '5px'
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default StopMarker;