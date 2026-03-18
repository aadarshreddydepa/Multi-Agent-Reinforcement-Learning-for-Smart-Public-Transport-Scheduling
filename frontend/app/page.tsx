"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Bus, Stop, Statistics, SimulationState, Alert } from "../types";
import apiService, { initializeSocket } from "../services/api";
import ControlPanel from "../components/dashboard/ControlPanel";
import FleetManager from "../components/dashboard/FleetManager";
import StatisticsPanel from "../components/dashboard/StatisticsPanel";
import EventLog, { LogEntry } from "../components/dashboard/EventLog";
import clsx from "clsx";

const LiveMap = dynamic<any>(
  () => import("../components/map/LiveMap"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
  }
);
export default function Home() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsHistory, setStatsHistory] = useState<
    { time: number; waitTime: number; served: number; occupancy: number }[]
  >([]);
  const [stopsData, setStopsData] = useState<Stop[]>([]);
  const [busesData, setBusesData] = useState<Bus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<
    "optimal" | "good" | "warning" | "critical"
  >("optimal");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [spawnIndicator, setSpawnIndicator] = useState<{
    pos: [number, number];
    visible: boolean;
  }>({ pos: [0, 0], visible: false });
  const [useTrainedAgents, setUseTrainedAgents] = useState(false);
  const [highlightedBusId, setHighlightedBusId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  const stateRef = useRef(state);
  const fleetListRef = useRef<HTMLDivElement>(null);

  // Calculate center relative to stops if available
  const center: [number, number] = useMemo(() => {
    if (stopsData.length > 0 && stopsData[0].location) {
      // Calculate the actual center point of all stops
      const validStops = stopsData.filter(stop => stop.location);
      if (validStops.length > 0) {
        const avgLat = validStops.reduce((sum, stop) => sum + stop.location.lat, 0) / validStops.length;
        const avgLng = validStops.reduce((sum, stop) => sum + stop.location.lng, 0) / validStops.length;
        return [avgLat, avgLng];
      }
    }
    return [17.385, 78.4867]; // Default Hyderabad center
  }, [stopsData]);

  const addAlert = useCallback(
    (
      message: string,
      type: "success" | "error" | "warning" | "info" = "info",
    ) => {
      setAlerts((prev) => {
        if (prev.some((a) => a.message === message)) return prev;
        const newAlert: Alert = {
          id: crypto.randomUUID(),
          message,
          type,
          timestamp: new Date(),
        };
        const updatedAlerts = [newAlert, ...prev.slice(0, 4)];
        setTimeout(() => {
          setAlerts((current) => current.filter((alert) => alert.id !== newAlert.id));
        }, 5000); // Priority 4: 5s duration
        return updatedAlerts;
      });
    },
    [],
  );

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => {
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        message,
        type,
        timestamp: new Date(),
      };
      return [newLog, ...prev.slice(0, 9)];
    });
  }, []);

  const analyzeSystemHealth = useCallback(
    (newState: SimulationState | null, newStats: Statistics | null) => {
      if (!newState || !newStats) return;
      const totalWaiting = newState.total_passengers_waiting || 0;
      const avgWaitTime = newStats.average_wait_time || 0;
      const occupancy = newStats.average_bus_occupancy || 0;

      if (totalWaiting > 50 || avgWaitTime > 120) {
        setSystemHealth("critical");
      } else if (totalWaiting > 25 || avgWaitTime > 60) {
        setSystemHealth("warning");
      } else if (occupancy > 0.8) {
        setSystemHealth("optimal"); // High utilization is good? Maybe depending on wait time.
      } else {
        setSystemHealth("good");
      }
    },
    [],
  );

  const checkForAlerts = useCallback(
    (newStats: Statistics) => {
      if (!newStats) return;

      // Only show critical alerts - make it professional
      const avgWaitTime = newStats.average_wait_time || 0;

      // Only show critical alerts
      if (avgWaitTime > 180) { // Only if very high wait time
        addAlert(
          `Service delay: ${avgWaitTime.toFixed(0)}s average wait time`,
          "warning",
        );
      }
    },
    [addAlert],
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [status, stops, buses] = await Promise.all([
        apiService.getStatus(),
        apiService.getStops(),
        apiService.getBuses(),
      ]);
      setIsRunning(status.simulation_running);
      setStopsData(Array.isArray(stops) ? stops : (stops.stops || []));
      setBusesData(Array.isArray(buses) ? buses : (buses.buses || []));

      if (status.simulation_running) {
        const [currentState, currentStats] = await Promise.all([
          apiService.getState(),
          apiService.getStatistics(),
        ]);
        setState(currentState);
        setStats(currentStats);
      }
      setLoading(false);
      addLog("System initialized successfully", "success");
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setLoading(false);
      addLog("Cannot connect to backend. Data source offline.", "warning");
    }
  }, [addLog]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Dedicated listener for boarding events
  useEffect(() => {
    const socket = initializeSocket();
    const handler = (data: { bus_id: string; count: number; stop: string }) => {
      addLog(`Bus ${data.bus_id} boarded ${data.count} passengers at ${data.stop}`, "success");
    };

    socket.on("passengers_served", handler);
    return () => {
      socket.off("passengers_served", handler);
    };
  }, [addLog]);

  useEffect(() => {
    void loadInitialData();

    const socket = initializeSocket();

    socket.on('connect', () => {
      console.log('✓ Connected to backend WebSocket');
      addLog("Connection established with simulation engine", "success");
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from backend');
      addLog("Signal lost. Attempting to reconnect...", "warning");
    });

    socket.on('simulation_update', (newState: SimulationState) => {
      setState(newState);
      stateRef.current = newState;
    });

    socket.on('bus_position_update', (positionData: any) => {
      // Real-time bus position updates
      const { bus_id, position, route_progress, current_stop, state } = positionData;
      setState(prevState => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          buses: {
            ...prevState.buses,
            [bus_id]: {
              ...prevState.buses[bus_id],
              position,
              route_progress,
              current_stop,
              state,
              last_updated: Date.now()
            }
          }
        };
      });
    });

    socket.on('bus_route_update', (routeData: any) => {
      // Update bus route information
      const { bus_id, assigned_route, route_color, current_route_id } = routeData;
      setState(prevState => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          buses: {
            ...prevState.buses,
            [bus_id]: {
              ...prevState.buses[bus_id],
              assigned_route,
              route_color,
              current_route_id
            }
          }
        };
      });
    });

    socket.on('statistics_update', (newStats: Statistics) => {
      setStats(newStats);
      analyzeSystemHealth(stateRef.current, newStats);

      setStatsHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: newStats.simulation_time || prev.length,
            waitTime: newStats.average_wait_time || 0,
            served: newStats.total_passengers_served || 0,
            occupancy: (newStats.average_bus_occupancy || 0) * 100,
          },
        ];
        return newHistory.slice(-50);
      });

      checkForAlerts(newStats);
    });

    socket.on("training_complete", (data: any) => {
      setIsTraining(false);
      addAlert(
        `Training complete! ${data.episodes || 100} episodes finished.`,
        "success",
      );
    });

    socket.on("training_started", (data: any) => {
      addLog(`Agent training phase started (${data.episodes || 100} episodes)`, "info");
    });

    socket.on("training_error", (data: any) => {
      setIsTraining(false);
      addLog(`Training error: ${data.message || "Unknown"}`, "warning");
    });

    socket.on("passengers_served", (data: { bus_id: string; count: number; stop: string }) => {
      // Priority 3 & 4: Event Log instead of toasts + Flow Synchronization
      addLog(`Bus ${data.bus_id} served ${data.count} passengers at Stop ${data.stop}`, "success");

      // Update stop demand locally for immediate feedback
      setStopsData(currentStops =>
        currentStops.map(stop =>
          stop.id === data.stop
            ? { ...stop, passengerCount: Math.max(0, (stop.passengerCount || 0) - data.count) }
            : stop
        )
      );
    });

    socket.on("stop_skipped", (data: { bus_id: string; stop: string; demand: number }) => {
      addLog(`Bus ${data.bus_id} skipped Stop ${data.stop} (demand ${data.demand || 0})`, "info");
    });

    socket.on("stop_demand_update", (demandUpdates: any[]) => {
      setStopsData(currentStops => {
        const stopsMap = new Map(currentStops.map(s => [s.id, s]));
        demandUpdates.forEach(update => {
          const stop = stopsMap.get(update.stop_id);
          if (stop) {
            stopsMap.set(update.stop_id, {
              ...stop,
              passengerCount: update.passengers_waiting
            });
          }
        });
        return Array.from(stopsMap.values());
      });
    });

    return () => {
      socket.off("disconnect");
      socket.off("state_update");
      socket.off("bus_position_update");
      socket.off("bus_route_update");
      socket.off("statistics_update");
      socket.off("training_complete");
      socket.off("training_started");
      socket.off("training_error");
      socket.off("high_demand");
      socket.off("stop_skipped");
      socket.off("stop_demand_update");
    };
  }, [loadInitialData, addAlert, checkForAlerts, analyzeSystemHealth]);

  const handleStart = async (useTrained = false) => {
    console.log(`🚀 Clicked Start Simulation (AI: ${useTrained})`);
    console.log(`📡 Targeting API: ${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"}`);
    try {
      await apiService.startSimulation(useTrained);
      setIsRunning(true);
      setUseTrainedAgents(useTrained);
      setStatsHistory([]);
      addLog(
        useTrained
          ? "Simulation started [AI MODE ACTIVE]"
          : "Simulation started [BASELINE MODE]",
        "success"
      );
    } catch (error: any) {
      console.error("Failed to start simulation:", error);
      const errorMessage = error.response?.data?.message || "Check server status";
      addAlert(
        `Failed to start simulation: ${errorMessage}`,
        "error",
      );
    }
  };

  const handleTrain = async () => {
    try {
      setIsTraining(true);
      await apiService.startTraining(100);
      addAlert(
        "Training started (100 episodes). This runs in background.",
        "info",
      );
    } catch (error) {
      console.error("Failed to start training:", error);
      setIsTraining(false);
      addAlert(
        "Failed to start training. Make sure backend is running!",
        "error",
      );
    }
  };

  const handleStop = async () => {
    try {
      await apiService.stopSimulation();
      setIsRunning(false);
      addLog("Simulation halted by user", "info");
    } catch (error) {
      console.error("Failed to stop simulation:", error);
      addAlert("Failed to stop simulation", "error");
    }
  };

  const handleReset = async () => {
    try {
      await apiService.resetSimulation();
      setIsRunning(false);
      setSystemHealth("optimal");

      // Clear local states
      setState(null);
      setStats(null);
      setBusesData([]);
      addLog("Environment and metrics reset to default", "info");

      // Force refresh data
      await loadInitialData();
    } catch (error) {
      console.error("Failed to reset simulation:", error);
      addAlert("Failed to reset simulation", "error");
    }
  };

  const handleAddBus = async () => {
    try {
      const response = await apiService.addBus();
      if (response.success) {
        addLog("New bus dispatched to fleet", "action");

        // Auto-focus map on spawn/depot location (Priority 5)
        if (stopsData.length > 0) {
          const spawnPos = stopsData[0].location;
          setSpawnIndicator({ pos: [spawnPos.lat, spawnPos.lng], visible: true });
          setMapCenter([spawnPos.lat, spawnPos.lng]);
          setTimeout(() => setSpawnIndicator(prev => ({ ...prev, visible: false })), 5000);
        }

        const buses = await apiService.getBuses();
        const updatedBuses = buses.buses || [];
        setBusesData(updatedBuses);

        // Highlight the new bus and scroll fleet list (Priority 5)
        const newBus = updatedBuses[updatedBuses.length - 1];
        if (newBus) {
          setHighlightedBusId(newBus.id);
          setTimeout(() => setHighlightedBusId(null), 5000);
          addLog(`Focusing on New Bus ${newBus.id}`, "action");
        }
      } else {
        addLog(response.message || "Fleet expansion limit reached", "warning");
      }
    } catch (error) {
      console.error("Failed to add bus:", error);
      addAlert("Failed to add bus", "error");
    }
  };

  const handleRemoveBus = async (busId: string) => {
    try {
      const response = await apiService.removeBus(busId);
      if (response.success) {
        addAlert(response.message || "Bus removed", "success");
        // Refresh buses data
        const buses = await apiService.getBuses();
        setBusesData(buses.buses || []);
      } else {
        addAlert(response.message || "Could not remove bus", "warning");
      }
    } catch (error) {
      console.error("Failed to remove bus:", error);
      addAlert("Failed to remove bus", "error");
    }
  };

  const displayBuses = state?.buses ? Object.values(state.buses) : busesData;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">
        Loading Smart Bus MARL System...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black font-sans overflow-hidden flex flex-col">
      {/* Professional Notification System */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={clsx(
              "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white animate-slide-in-right duration-300",
              "border-gray-100"
            )}
          >
            <div className={clsx(
              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
              alert.type === "success" && "bg-green-500",
              alert.type === "error" && "bg-red-500",
              alert.type === "warning" && "bg-amber-500",
              alert.type === "info" && "bg-blue-500"
            )} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Professional Uber-Style Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Professional Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-black tracking-tight">
                SwiftBus
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Intelligent Transport Network
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex items-center gap-6">
          <button className="text-gray-700 hover:text-black font-medium text-sm transition-colors">
            Dashboard
          </button>
          <button className="text-gray-700 hover:text-black font-medium text-sm transition-colors">
            Fleet
          </button>
          <button className="text-gray-700 hover:text-black font-medium text-sm transition-colors">
            Analytics
          </button>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </nav>
      </header>

      {/* Full-Screen Map Layout */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Left Control Panel */}
        <aside className="w-80 border-r border-gray-200 bg-white p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar z-20">
          <ControlPanel
            isRunning={isRunning}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            onTrain={handleTrain}
            isTraining={isTraining}
            stats={stats}
          />

          <FleetManager
            buses={displayBuses}
            onAddBus={handleAddBus}
            onRemoveBus={handleRemoveBus}
            stats={stats}
            highlightedBusId={highlightedBusId}
          />

          <StatisticsPanel
            stats={stats}
            history={statsHistory}
            systemHealth={systemHealth}
          />

          <EventLog logs={logs} />
        </aside>

        {/* Full-Screen Map */}
        <div className="flex-1 relative bg-white">
          <div className="absolute inset-0 overflow-hidden z-10">
            <LiveMap
              buses={displayBuses}
              stops={stopsData}
              center={mapCenter || center}
              spawnIndicator={spawnIndicator}
              highlightedBusId={highlightedBusId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
