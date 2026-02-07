import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import BusMarker from './BusMarker';
import StopMarker from './StopMarker';
import 'leaflet/dist/leaflet.css';

const Map = ({ buses, stops, stopPassengers, center }) => {
  const defaultCenter = center || [17.3850, 78.4867];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={15} 
      className="map-container"
      zoomControl={true}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Render all bus stops */}
      {stops && stops.map((stop) => (
        <StopMarker 
          key={stop.id} 
          stop={{
            ...stop,
            passengerCount: stopPassengers?.[stop.id] || 0
          }} 
        />
      ))}

      {/* Render all buses */}
      {buses && Object.values(buses).map((bus) => {
        // Only render if bus has valid position
        if (bus.position && bus.position.lat && bus.position.lng) {
          return <BusMarker key={bus.id} bus={bus} />;
        }
        return null;
      })}
    </MapContainer>
  );
};

export default Map;