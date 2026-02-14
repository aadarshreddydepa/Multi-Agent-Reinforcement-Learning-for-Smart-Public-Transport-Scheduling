"use client";

import React from "react";
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
} from "lucide-react";
import clsx from "clsx";

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
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <h3 className="text-xl font-bold text-black mt-1">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  </div>
);

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  stats,
  history,
  systemHealth,
}) => {
  if (!stats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[300px] text-gray-400">
        <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm">Waiting for simulation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          Performance Analytics
        </h3>
        <div className="text-xs text-gray-500 font-medium">
          Live metrics
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6 flex items-center justify-between">
          Wait Time Trends
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
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

      {/* System Health Indicator */}
      <div
        className={clsx(
          "rounded-lg p-4 flex items-center justify-between transition-colors",
          systemHealth === "optimal"
            ? "bg-green-50 text-green-800 border border-green-200"
            : systemHealth === "warning"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-red-50 text-red-800 border border-red-200",
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
