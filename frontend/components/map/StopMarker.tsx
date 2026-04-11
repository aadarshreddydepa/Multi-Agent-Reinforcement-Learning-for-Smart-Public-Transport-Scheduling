"use client";

import React from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Stop } from "../../types";

interface StopMarkerProps {
  stop: Stop & {
    passengerCount?: number;
    description?: string;
    capacity?: number;
    peak_demand_hours?: string[];
    amenities?: string[];
  };
}

const StopMarker: React.FC<StopMarkerProps> = ({ stop }) => {
  // Determine demand level and color using CSS variables
  const passengerCount = stop.passengerCount || 0;
  let demandColor = "var(--color-success)"; // Green (Low)
  let demandOpacity = 0.1;
  let demandRadius = 0;

  if (passengerCount > 15) {
    demandColor = "var(--color-danger)"; // Red (High)
    demandOpacity = 0.4;
    demandRadius = 25 + Math.min(passengerCount, 40) * 1.5;
  } else if (passengerCount > 5) {
    demandColor = "var(--color-warning)"; // Yellow (Medium)
    demandOpacity = 0.25;
    demandRadius = 15 + passengerCount * 2;
  } else if (passengerCount > 0) {
    demandRadius = 10 + passengerCount * 3;
  }

  // Create a custom icon using DivIcon for better styling control
  const stopIcon = React.useMemo(() => {
    if (typeof window === 'undefined') return null;

    // Priority 1: Clear Demand Visuals
    let markerColor = "var(--color-success)"; // Green (0-5)
    if (passengerCount > 15) {
      markerColor = "var(--color-danger)"; // Red (15+)
    } else if (passengerCount > 5) {
      markerColor = "var(--color-warning)"; // Yellow (6-15)
    }

    return L.divIcon({
      className: "stop-marker-icon",
      html: `
            <div class="relative flex flex-col items-center justify-center">
                <!-- Demand Label "X waiting" (Priority 1) -->
                ${passengerCount > 0 ? `
                <div style="
                    position: absolute;
                    top: -24px;
                    white-space: nowrap;
                    background: rgba(0,0,0,0.85);
                    color: white;
                    font-size: 10px;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 800;
                    pointer-events: none;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    z-index: 10;
                    border: 1px solid ${markerColor};
                ">
                    ${passengerCount} waiting
                </div>
                ` : ""}

                <div class="relative flex items-center justify-center">
                    <!-- Demand Layer Circle -->
                    ${passengerCount > 0 ? `
                    <div style="
                        position: absolute;
                        width: ${demandRadius}px;
                        height: ${demandRadius}px;
                        background-color: ${markerColor};
                        opacity: ${demandOpacity};
                        border-radius: 50%;
                        transition: all 0.5s ease;
                        z-index: -1;
                    "></div>
                    ` : ""}
                    
                    <div style="
                        background-color: white;
                        border: 2px solid #000000;
                        border-radius: 50%;
                        padding: 4px;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        transition: all 0.2s ease;
                        z-index: 2;
                    ">
                        🚏
                    </div>
                </div>
            </div>
        `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [passengerCount, demandRadius, demandColor, demandOpacity]);

  if (!stopIcon) return null;

  return (
    <Marker position={[stop.location.lat, stop.location.lng]} icon={stopIcon}>
      <Popup className="premium-popup">
        <div className="p-3 min-w-[220px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <div className="w-8 h-8 bg-foreground-primary rounded-lg flex items-center justify-center">
              <span className="text-background-primary text-sm">🚏</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground-primary text-base">{stop.name}</h3>
              {stop.id && <span className="text-xs text-foreground-secondary uppercase">{stop.id}</span>}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {stop.description && (
              <div className="italic text-foreground-muted text-xs">
                {stop.description}
              </div>
            )}

            {stop.passengerCount !== undefined && stop.passengerCount > 0 && (
              <div className="flex justify-between bg-background-surface p-2 rounded-lg">
                <span className="text-foreground-secondary font-medium">Waiting:</span>
                <span className="font-bold text-danger">
                  {stop.passengerCount}
                </span>
              </div>
            )}

            {stop.amenities && stop.amenities.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold text-foreground-secondary text-xs uppercase">
                  Facilities
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {stop.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-background-surface rounded text-foreground-secondary text-xs border border-border"
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
