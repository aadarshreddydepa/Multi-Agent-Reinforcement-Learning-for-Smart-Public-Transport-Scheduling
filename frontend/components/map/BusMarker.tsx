"use client";

import React from "react";
import L from "leaflet";
import { Popup, Tooltip } from "react-leaflet";
import DriftMarker from "react-leaflet-drift-marker";
import { Bus } from "../../types";

interface BusMarkerProps {
  bus: Bus;
  isHighlighted?: boolean;
}

const BusMarker: React.FC<BusMarkerProps> = ({ bus, isHighlighted }) => {
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

  const occupancyRate = bus.passengers
    ? bus.passengers.length / bus.capacity
    : 0;

  // 🎨 Multi-color occupancy logic
  let occupancyColor = "#10B981"; // Green (Low)
  if (occupancyRate > 0.8) {
    occupancyColor = "#ef4444"; // Red (High)
  } else if (occupancyRate > 0.4) {
    occupancyColor = "#f59e0b"; // Yellow (Medium)
  }

  const color = getColor(bus.state || "IDLE", bus.route_color);
  const isMoving = ["IN_TRANSIT", "MOVING"].includes(bus.state || "IDLE");

  // Dynamic scale based on occupancy
  const size = 36; // Constant base size for better alignment

  const busIcon = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    return L.divIcon({
      className: "bus-marker-icon",
      html: `
            <div class="relative flex flex-col items-center">
                <!-- Action Label -->
                <div style="
                    position: absolute;
                    top: -22px;
                    white-space: nowrap;
                    background: rgba(0,0,0,0.75);
                    color: white;
                    font-size: 9px;
                    padding: 1px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: ${bus.last_action ? 1 : 0};
                    transition: opacity 0.3s;
                    z-index: 10;
                ">
                    ${(bus.last_action || "").replace("_", " ")}
                </div>

                <!-- Highlight Ring (Priority 5) -->
                ${isHighlighted ? `
                <div class="absolute -inset-2 bg-blue-400 rounded-full animate-ping opacity-40" style="width: 48px; height: 48px; left: -8px; top: -8px;"></div>
                <div class="absolute -inset-1 border-2 border-blue-500 rounded-full" style="width: 40px; height: 40px; left: -4px; top: -4px;"></div>
                ` : ""}

                <div class="relative">
                    <!-- Progress Ring / Border -->
                    <div style="
                        position: absolute;
                        top: -3px;
                        left: -3px;
                        width: 38px;
                        height: 38px;
                        border-radius: 50%;
                        border: 3px solid ${occupancyColor}33;
                        z-index: 1;
                    "></div>
                    <div style="
                        position: absolute;
                        top: -3px;
                        left: -3px;
                        width: 38px;
                        height: 38px;
                        border-radius: 50%;
                        border: 3px solid ${occupancyColor};
                        border-bottom-color: transparent;
                        border-left-color: transparent;
                        transform: rotate(${occupancyRate * 360}deg);
                        transition: transform 0.5s ease;
                        z-index: 2;
                    "></div>

                    <!-- Main Bus Icon -->
                    <div style="
                        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                        border: 2px solid white;
                        position: relative;
                        z-index: 3;
                    ">
                        🚌
                    </div>
                </div>

                <!-- Occupancy Percentage Badge -->
                ${occupancyRate > 0 ? `
                <div class="absolute" style="
                    bottom: -10px;
                    background: ${occupancyColor};
                    color: white;
                    font-size: 8px;
                    padding: 1px 4px;
                    border-radius: 8px;
                    border: 1px solid white;
                    font-weight: 800;
                    z-index: 11;
                ">${(occupancyRate * 100).toFixed(0)}%</div>
                ` : ''}
            </div>
        `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [bus.last_action, occupancyColor, occupancyRate, color, size, isHighlighted]);

  if (!busIcon) return null;

  if (!bus.position && !bus.location) return null;

  const busPosition = bus.position || bus.location;
  if (!busPosition) return null;

  return (
    <DriftMarker
      position={[busPosition.lat, busPosition.lng]}
      duration={400}
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
