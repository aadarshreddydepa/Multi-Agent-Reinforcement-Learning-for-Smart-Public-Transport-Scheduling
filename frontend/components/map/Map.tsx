"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BusMarker from "./BusMarker";
import StopMarker from "./StopMarker";
import RouteVisualization from './RouteVisualization';
import { Bus, Stop } from "../../types";

// Fix Leaflet's default icon path issues
const fixLeafletIcon = () => {
  // @ts-expect-error: Leaflet internal API access needed for icon fix
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

interface MapProps {
  buses: Bus[];
  stops: Stop[];
  center?: [number, number];
}

const Map: React.FC<MapProps> = ({ buses, stops, center }) => {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const defaultCenter: [number, number] = center || [17.385, 78.4867];

  // Calculate appropriate zoom level based on stop distribution
  const calculateZoom = () => {
    if (stops.length === 0) return 15;
    
    const validStops = stops.filter(stop => stop.location);
    if (validStops.length === 0) return 15;
    
    const lats = validStops.map(stop => stop.location.lat);
    const lngs = validStops.map(stop => stop.location.lng);
    
    const maxLat = Math.max(...lats);
    const minLat = Math.min(...lats);
    const maxLng = Math.max(...lngs);
    const minLng = Math.min(...lngs);
    
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    
    // Adjust zoom based on the spread of coordinates
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 0.3) return 11;  // Very spread out
    if (maxDiff > 0.2) return 12;  // Spread out
    if (maxDiff > 0.1) return 13;  // Moderately spread
    if (maxDiff > 0.05) return 14; // Somewhat spread
    return 15; // Close together
  };

  const zoom = calculateZoom();

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false} // Custom zoom control maybe later
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          // Use a darker/cleaner map style if possible, but standard OSM is fine for now.
          // Could use CartoDB Positron for "professional" look.
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <RouteVisualization buses={buses} stops={stops} />

        {stops.map((stop) => (
          <StopMarker key={stop.id} stop={stop} />
        ))}

        {buses.map(
          (bus) => (bus.position || bus.location) && <BusMarker key={bus.id} bus={bus} />,
        )}
      </MapContainer>

      {/* Overlay controls or attribution if needed */}
    </div>
  );
};

export default Map;
