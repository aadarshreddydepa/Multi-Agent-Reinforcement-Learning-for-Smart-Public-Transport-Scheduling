"use client";

import React from "react";
import L from "leaflet";
import { Popup, Tooltip } from "react-leaflet";
import DriftMarker from "react-leaflet-drift-marker";
import { Bus } from "../../types";

interface BusMarkerProps {
  bus: Bus;
}

const BusMarker: React.FC<BusMarkerProps> = ({ bus }) => {
  // 🎨 Premium Colors based on State
  const getColor = (state: string, routeColor?: string) => {
    // Use route color if available, otherwise fallback to state-based colors
    if (routeColor && routeColor.startsWith('#')) {
      return routeColor;
    }
    
    switch (state) {
      case "IDLE":
        return "#6B7280";
      case "MOVING":
      case "IN_TRANSIT":
        return "#10B981";
      case "BOARDING":
      case "ALIGHTING":
        return "#F59E0B";
      case "AT_STOP":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const color = getColor(bus.state || "IDLE", bus.route_color);
  const occupancyRate = bus.passengers
    ? bus.passengers.length / bus.capacity
    : 0;
  const isMoving = ["IN_TRANSIT", "MOVING"].includes(bus.state || "IDLE");

  // Dynamic scale based on occupancy
  const radius = 40 + occupancyRate * 20; // 40px base + up to 20px extra
  const size = radius;

  // Use Tailwind classes inside HTML string is tricky as they might not be applied if not used elsewhere.
  // However, I'll use inline styles for reliability in Leaflet divIcon.

  const busIcon = L.divIcon({
    className: "bus-marker-icon bus-marker-enhanced",
    html: `
            <div class="relative group">
                <div style="
                    background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
                    border-radius: 50%;
                    padding: 4px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    box-shadow: 
                        0 4px 8px rgba(0,0,0,0.15),
                        0 2px 4px rgba(0,0,0,0.1),
                        inset 0 1px 0 rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                ">
                    🚌
                </div>
                ${occupancyRate > 0.8 ? `
                    <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" style="box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);"></div>
                ` : ''}
                ${bus.state === 'MOVING' || bus.state === 'IN_TRANSIT' ? `
                    <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                ` : ''}
                    background: ${color};
                    color: white;
                    font-size: 9px;
                    font-weight: 600;
                    padding: 2px 4px;
                    border-radius: 8px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                ">${(occupancyRate * 100).toFixed(0)}%</div>
            </div>
        `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  if (!bus.position && !bus.location) return null;

  const busPosition = bus.position || bus.location;
  if (!busPosition) return null;

  return (
    <DriftMarker
      position={[busPosition.lat, busPosition.lng]}
      duration={1000}
      icon={busIcon}
    >
      <Tooltip
        direction="top"
        offset={[0, -size / 2]}
        opacity={1}
        className="custom-tooltip"
      >
        <div className="font-bold text-sm">Bus {bus.id || 'Unknown'}</div>
      </Tooltip>

      <Popup className="premium-popup">
        <div className="p-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <span className="text-xl">🚌</span>
            <div>
              <h3 className="font-bold text-gray-800 text-base">
                Bus {bus.id || 'Unknown'}
              </h3>
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                {(bus.state || "UNKNOWN") ? String(bus.state).replace("_", " ") : "UNKNOWN"}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Route:</span>
              <span className="font-medium text-black">
                {bus.current_route_id || "N/A"}
              </span>
            </div>
            {bus.assigned_route && Array.isArray(bus.assigned_route) && (
              <div className="flex justify-between">
                <span>Path:</span>
                <span className="font-medium text-black text-xs">
                  {bus.assigned_route.slice(0, 2).join(' → ')}...
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Passengers:</span>
              <span
                className={`font-bold ${occupancyRate > 0.8 ? "text-red-500" : "text-green-600"}`}
              >
                {bus.passengers?.length || 0} / {bus.capacity}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </DriftMarker>
  );
};

export default BusMarker;
