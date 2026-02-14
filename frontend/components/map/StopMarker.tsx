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
  // Create a custom icon using DivIcon for better styling control
  const stopIcon = L.divIcon({
    className: "stop-marker-icon",
    html: `
            <div class="relative group">
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
                ">
                    🚏
                </div>
                ${
                  stop.passengerCount && stop.passengerCount > 0
                    ? `
                <div style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background-color: #ef4444;
                    color: white;
                    font-size: 10px;
                    padding: 1px 4px;
                    border-radius: 4px;
                    font-weight: bold;
                ">
                    ${stop.passengerCount}
                </div>`
                    : ""
                }
            </div>
        `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <Marker position={[stop.location.lat, stop.location.lng]} icon={stopIcon}>
      <Popup className="premium-popup">
        <div className="p-2 min-w-[220px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🚏</span>
            </div>
            <div>
              <h3 className="font-bold text-black text-base">{stop.name}</h3>
              {stop.id && <span className="text-xs text-gray-500 uppercase">{stop.id}</span>}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {stop.description && (
              <div className="italic text-gray-500 text-xs">
                {stop.description}
              </div>
            )}

            {stop.passengerCount !== undefined && stop.passengerCount > 0 && (
              <div className="flex justify-between bg-gray-50 p-2 rounded-lg">
                <span className="text-gray-700 font-medium">Waiting:</span>
                <span className="font-bold text-red-600">
                  {stop.passengerCount}
                </span>
              </div>
            )}

            {stop.amenities && stop.amenities.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold text-gray-500 text-xs uppercase">
                  Facilities
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {stop.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs border border-gray-200"
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
