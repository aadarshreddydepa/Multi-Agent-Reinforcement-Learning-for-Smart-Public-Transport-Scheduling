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
    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black dark:text-gray-100 flex items-center gap-3 transition-colors duration-300">
          <div className="w-8 h-8 bg-black dark:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-300">
            <BusIcon className="w-4 h-4 text-white" />
          </div>
          Fleet Operations
        </h2>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">
          {totalBuses} vehicles
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-black dark:text-gray-100 transition-colors duration-300">{totalBuses}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">{activeBuses}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">{utilization}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">Utilization</div>
        </div>
      </div>

      {/* Add Bus Action */}
      <button
        onClick={handleAddWithLoading}
        disabled={loading || totalBuses >= 20}
        className={clsx(
          "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-200",
          loading
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-wait"
            : totalBuses >= 20
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-black dark:bg-primary-600 text-white hover:bg-gray-800 dark:hover:bg-primary-700",
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {loading ? "Adding..." : totalBuses >= 20 ? "Fleet Full" : "Add Bus"}
      </button>

      {/* Bus List */}
      <div className="space-y-3">
        {buses.map((bus) => {
          const occupancy = bus.capacity ? ((bus.passengers?.length || 0) / bus.capacity) * 100 : 0;
          
          return (
            <div key={bus.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              {/* Bus Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bus.route_color || '#000000' }}>
                    <BusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-black dark:text-gray-100 transition-colors duration-300">Bus {bus.id}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      {bus.state === 'MOVING' || bus.state === 'IN_TRANSIT' ? 'In Service' : bus.state === 'IDLE' ? 'Inactive' : bus.state}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveBus(bus.id)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bus Details */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg transition-colors duration-300">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold transition-colors duration-300">Route</div>
                  <div className="font-bold text-black dark:text-gray-100" style={{ color: bus.route_color || '#000000' }}>
                    {bus.current_route_id || "N/A"}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg transition-colors duration-300">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold transition-colors duration-300">Capacity</div>
                  <div className="font-bold text-black dark:text-gray-100 transition-colors duration-300">
                    {bus.passengers?.length || 0}/{bus.capacity || 50}
                  </div>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold transition-colors duration-300">Occupancy</div>
                  <div className="text-xs font-bold text-black dark:text-gray-100 transition-colors duration-300">
                    {occupancy.toFixed(1)}%
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-dark-600 rounded-full overflow-hidden transition-colors duration-300">
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center transition-colors duration-300">
            <BusIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
          </div>
          <h3 className="text-xl font-bold text-black dark:text-gray-100 mb-2 transition-colors duration-300">No buses in fleet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">Add your first bus to start the simulation</p>
          <button
            onClick={onAddBus}
            className="bg-black dark:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto hover:bg-gray-800 dark:hover:bg-primary-700 hover:scale-105 transition-all duration-200"
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
