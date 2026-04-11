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
  highlightedBusId?: string | null;
}

// All enhanced features are now in the main Bus interface

const FleetManager: React.FC<FleetManagerProps> = ({
  buses,
  onAddBus,
  onRemoveBus,
  stats,
  highlightedBusId,
}) => {
  const [loading, setLoading] = useState(false);
  const busRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Error handling for scrolling (Priority 5)
  React.useEffect(() => {
    if (highlightedBusId && busRefs.current[highlightedBusId]) {
      busRefs.current[highlightedBusId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedBusId]);

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
    <div className="card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground-primary flex items-center gap-3 font-display">
          <div className="w-8 h-8 bg-foreground-primary dark:bg-accent rounded-lg flex items-center justify-center">
            <BusIcon className="w-4 h-4 text-background-primary" />
          </div>
          Fleet Operations
        </h2>
        <div className="text-xs text-foreground-secondary font-medium">
          {totalBuses} vehicles
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-background-surface rounded-lg">
          <div className="text-2xl font-bold text-foreground-primary">{totalBuses}</div>
          <div className="text-xs text-foreground-secondary">Total</div>
        </div>
        <div className="text-center p-2 bg-background-surface rounded-lg">
          <div className="text-2xl font-bold text-success">{activeBuses}</div>
          <div className="text-xs text-foreground-secondary">Active</div>
        </div>
        <div className="text-center p-2 bg-background-surface rounded-lg">
          <div className="text-2xl font-bold text-accent">{utilization}%</div>
          <div className="text-xs text-foreground-secondary">Utilization</div>
        </div>
      </div>

      {/* Add Bus Action */}
      <button
        onClick={handleAddWithLoading}
        disabled={loading || totalBuses >= 20}
        className={clsx(
          "w-full btn",
          loading
            ? "bg-background-surface text-foreground-muted cursor-wait"
            : totalBuses >= 20
              ? "bg-background-surface text-foreground-muted cursor-not-allowed"
              : "bg-foreground-primary dark:bg-accent text-background-primary hover:bg-foreground-primary/90 dark:hover:bg-accent-hover"
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {loading ? "Adding..." : totalBuses >= 20 ? "Fleet Full" : "Add Bus"}
      </button>

      {/* Bus List */}
      <div className="space-y-3">
        {buses.map((bus) => {
          const occupancy = bus.capacity ? ((bus.passengers?.length || 0) / bus.capacity) * 100 : 0;
          const isHighlighted = bus.id === highlightedBusId;

          return (
            <div key={bus.id} className="card p-4">
              {/* Bus Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bus.route_color || 'var(--color-accent-primary)' }}>
                    <BusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground-primary">Bus {bus.id}</div>
                    <div className="text-xs text-foreground-secondary">
                      {bus.state === 'MOVING' || bus.state === 'IN_TRANSIT' ? 'In Service' : bus.state === 'IDLE' ? 'Inactive' : bus.state}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveBus(bus.id)}
                  className="p-2 rounded-lg bg-danger-muted text-danger hover:bg-danger/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bus Details */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-background-surface p-3 rounded-lg">
                  <div className="text-xs text-foreground-secondary mb-1 uppercase tracking-wide font-medium">Route</div>
                  <div className="font-bold text-foreground-primary" style={{ color: bus.route_color || 'var(--color-accent-primary)' }}>
                    {bus.current_route_id || "N/A"}
                  </div>
                </div>

                <div className="bg-background-surface p-3 rounded-lg">
                  <div className="text-xs text-foreground-secondary mb-1 uppercase tracking-wide font-medium">Capacity</div>
                  <div className="font-bold text-foreground-primary">
                    {bus.passengers?.length || 0}/{bus.capacity || 50}
                  </div>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-foreground-secondary uppercase tracking-wide font-medium">Occupancy</div>
                  <div className="text-xs font-bold text-foreground-primary">
                    {occupancy.toFixed(1)}%
                  </div>
                </div>
                <div className="w-full h-2 bg-background-surface rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500",
                      occupancy > 80
                        ? "bg-danger"
                        : occupancy > 50
                          ? "bg-warning"
                          : "bg-success"
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-background-surface flex items-center justify-center">
            <BusIcon className="w-10 h-10 text-foreground-muted" />
          </div>
          <h3 className="text-xl font-bold text-foreground-primary mb-2 font-display">No buses in fleet</h3>
          <p className="text-foreground-secondary mb-4">Add your first bus to start the simulation</p>
          <button
            onClick={onAddBus}
            className="btn bg-foreground-primary dark:bg-accent text-background-primary hover:bg-foreground-primary/90 dark:hover:bg-accent-hover"
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
