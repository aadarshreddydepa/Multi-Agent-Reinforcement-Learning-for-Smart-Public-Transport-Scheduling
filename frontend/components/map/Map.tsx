"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BusMarker from "./BusMarker";
import StopMarker from "./StopMarker";
import RouteVisualization from './RouteVisualization';
import AnimatedRouteVisualization from './AnimatedRouteVisualization';
import { Bus, Stop } from "../../types";
import { useDarkModeMap } from "../../hooks/useDarkModeMap";

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
  children?: React.ReactNode;
  spawnIndicator?: {
    pos: [number, number];
    visible: boolean;
  };
  highlightedBusId?: string | null;
}

// Child component to update map view when center changes (Priority 5)
const MapViewUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const Map: React.FC<MapProps> = ({ buses, stops, center, children, spawnIndicator, highlightedBusId }) => {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Spawn indicator icon (Priority 4: Depot/New Bus Visibility)
  const spawnIcon = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    return L.divIcon({
      className: "spawn-indicator",
      html: `
        <div class="relative flex flex-col items-center">
          <div style="background-color: var(--color-accent-primary); color: white; font-size: 10px; padding: 4px 12px; border-radius: 9999px; font-weight: 800; white-space: nowrap; margin-bottom: 8px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 2px solid white; animation: bounce 1s infinite;" class="animate-bounce">
            NEW BUS DISPATCHED 🚌
          </div>
          <div class="relative">
            <div style="position: absolute; inset: -16px; background-color: var(--color-accent-primary); opacity: 0.2; border-radius: 50%;" class="animate-ping"></div>
            <div style="width: 16px; height: 16px; background-color: var(--color-accent-primary); border-radius: 50%; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 10;"></div>
          </div>
        </div>
      `,
      iconSize: [120, 60],
      iconAnchor: [60, 60],
    });
  }, []);

  const defaultCenter: [number, number] = center || [17.385, 78.4867];
  const mapTileUrl = useDarkModeMap();

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
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-lg border border-border">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={mapTileUrl}
        />

        <AnimatedRouteVisualization buses={buses} stops={stops} />
        <RouteVisualization buses={buses} stops={stops} />

        {stops.map((stop) => (
          <StopMarker key={stop.id} stop={stop} />
        ))}

        {buses.map(
          (bus) => (bus.position || bus.location) && (
            <BusMarker
              key={bus.id}
              bus={bus}
              isHighlighted={bus.id === highlightedBusId}
            />
          ),
        )}

        {center && <MapViewUpdater center={center} />}

        {spawnIndicator?.visible && spawnIcon && (
          <Marker position={spawnIndicator.pos} icon={spawnIcon} />
        )}

        {children}
      </MapContainer>

      {/* Overlay controls or attribution if needed */}
    </div>
  );
};

export default Map;
