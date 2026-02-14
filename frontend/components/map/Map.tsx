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

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={15}
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
