"use client";

import React, { useState } from "react";
import { Bus, Statistics } from "../../types";
import {
  Plus,
  Trash2,
  Bus as BusIcon,
  TrendingDown,
  Users,
  MapPin,
  Clock,
  Route,
} from "lucide-react";
import clsx from "clsx";

interface FleetManagerProps {
  buses: Bus[];
  onAddBus: () => void;
  onRemoveBus: (id: string) => void;
  stats: Statistics | null;
}

// All enhanced features are now in the main Bus interface

const FleetManager: React.FC<FleetManagerProps> = ({
  buses,
  onAddBus,
  onRemoveBus,
  stats,
}) => {
  const [loading, setLoading] = useState(false);

  const totalBuses = buses?.length || 0;
  const activeBuses = buses?.filter((bus) => bus.state !== "IDLE").length || 0;
  const utilization = stats
    ? (stats.average_bus_occupancy * 100).toFixed(0)
    : 0;

  const handleAddWithLoading = async () => {
    setLoading(true);
    await onAddBus();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <BusIcon className="w-4 h-4 text-white" />
          </div>
          Fleet Operations
        </h2>
        <div className="text-xs text-gray-500 font-medium">
          {totalBuses} vehicles
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-black">{totalBuses}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeBuses}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{utilization}%</div>
          <div className="text-xs text-gray-500">Utilization</div>
        </div>
      </div>

      {/* Add Bus Action */}
      <button
        onClick={handleAddWithLoading}
        disabled={loading || totalBuses >= 20}
        className={clsx(
          "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
          loading
            ? "bg-gray-100 text-gray-400 cursor-wait"
            : totalBuses >= 20
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800",
        )}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bus Details */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="glass-enhanced p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Route</div>
                  <div className="font-bold text-black" style={{ color: bus.route_color || '#000000' }}>
                    {bus.current_route_id || "N/A"}
                  </div>
                </div>
                
                <div className="glass-enhanced p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Capacity</div>
                  <div className="font-bold text-black">
                    {bus.passengers?.length || 0}/{bus.capacity || 50}
                  </div>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Occupancy</div>
                  <div className="text-xs font-bold text-black">
                    {occupancy.toFixed(1)}%
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500",
                      occupancy > 0.8
                        ? "bg-gradient-to-r from-red-400 to-red-600"
                        : occupancy > 0.5
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-green-400 to-green-600"
                    )}
                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {buses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
            <BusIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">No buses in fleet</h3>
          <p className="text-gray-500 mb-4">Add your first bus to start the simulation</p>
          <button
            onClick={onAddBus}
            className="premium-button px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Add Your First Bus
          </button>
        </div>
      )}
    </div>
  );
};

export default FleetManager;
