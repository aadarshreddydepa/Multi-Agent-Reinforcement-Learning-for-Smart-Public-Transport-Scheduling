"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Statistics } from "../../types";
import {
  Clock,
  Users,
  Timer,
  Bus as BusIcon,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import clsx from "clsx";
import AdvancedCharts from "../charts/AdvancedCharts";

interface StatisticsPanelProps {
  stats: Statistics | null;
  history: {
    time: number;
    waitTime: number;
    served: number;
    occupancy: number;
  }[];
  systemHealth: string;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  subtext,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-black dark:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-300">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide transition-colors duration-300">
          {label}
        </p>
        <h3 className="text-xl font-bold text-black dark:text-gray-100 mt-1 transition-colors duration-300">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors duration-300">{subtext}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          trend.direction === 'up' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  </div>
);

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  stats,
  history,
  systemHealth,
}) => {
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');

  // Calculate trends
  const calculateTrends = () => {
    if (history.length < 10) return {};
    
    const recent = history.slice(-5);
    const previous = history.slice(-10, -5);
    
    if (previous.length === 0) return {};
    
    const recentAvg = {
      waitTime: recent.reduce((sum, d) => sum + d.waitTime, 0) / recent.length,
      occupancy: recent.reduce((sum, d) => sum + d.occupancy, 0) / recent.length,
    };
    
    const previousAvg = {
      waitTime: previous.reduce((sum, d) => sum + d.waitTime, 0) / previous.length,
      occupancy: previous.reduce((sum, d) => sum + d.occupancy, 0) / previous.length,
    };
    
    return {
      waitTime: {
        value: ((recentAvg.waitTime - previousAvg.waitTime) / previousAvg.waitTime) * 100,
        direction: recentAvg.waitTime > previousAvg.waitTime ? 'up' as const : 'down' as const,
      },
      occupancy: {
        value: ((recentAvg.occupancy - previousAvg.occupancy) / previousAvg.occupancy) * 100,
        direction: recentAvg.occupancy > previousAvg.occupancy ? 'up' as const : 'down' as const,
      },
    };
  };

  const trends = calculateTrends();

  // Enhanced data for advanced charts
  const enhancedHistory = history.map(h => ({
    ...h,
    efficiency: h.occupancy > 0 ? (h.served / h.occupancy) * 100 : 0,
    busesActive: stats?.buses_in_transit || 0,
    demand: Math.random() * 50 + 20, // Simulated demand data
  }));

  if (!stats) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center min-h-[300px] text-gray-400 dark:text-gray-500 transition-colors duration-300">
        <div className="w-12 h-12 bg-black dark:bg-primary-600 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm">Waiting for simulation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black dark:text-gray-100 flex items-center gap-2 transition-colors duration-300">
          <div className="w-8 h-8 bg-black dark:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-300">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          Performance Analytics
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">
            Live metrics
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 transition-colors duration-300">
            <button
              onClick={() => setViewMode('basic')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                viewMode === 'basic'
                  ? 'bg-white dark:bg-dark-700 text-black dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                viewMode === 'advanced'
                  ? 'bg-white dark:bg-dark-700 text-black dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Avg Wait Time"
          value={`${(stats.average_wait_time || 0).toFixed(0)}s`}
          icon={Timer}
          color=""
          subtext="Target: < 45s"
          trend={trends.waitTime}
        />
        <StatCard
          label="Total Served"
          value={stats.total_passengers_served || 0}
          icon={Users}
          color=""
          subtext="All time"
        />
        <StatCard
          label="Utilization"
          value={`${((stats.average_bus_occupancy || 0) * 100).toFixed(0)}%`}
          icon={BusIcon}
          color=""
          subtext="Fleet average"
          trend={trends.occupancy}
        />
        <StatCard
          label="Active Buses"
          value={stats.buses_in_transit || 0}
          icon={Clock}
          color=""
          subtext="In transit"
        />
      </div>

      {/* Charts Section */}
      {viewMode === 'basic' ? (
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6 flex items-center justify-between transition-colors duration-300">
            Wait Time Trends
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs transition-colors duration-300">
              Last {history.length} ticks
            </span>
          </h4>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  unit="s"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                  }}
                  labelStyle={{ color: "#6b7280", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="waitTime"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorWait)"
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <AdvancedCharts data={enhancedHistory} currentStats={stats} />
      )}

      {/* System Health Indicator */}
      <div
        className={clsx(
          "rounded-lg p-4 flex items-center justify-between transition-colors duration-300",
          systemHealth === "optimal"
            ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/30"
            : systemHealth === "warning"
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/30",
        )}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">
            System Health: {systemHealth.toUpperCase()}
          </span>
        </div>
        <div className="text-xs font-mono opacity-75">
          {systemHealth === "optimal"
            ? "All systems nominal"
            : "Attention required"}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
