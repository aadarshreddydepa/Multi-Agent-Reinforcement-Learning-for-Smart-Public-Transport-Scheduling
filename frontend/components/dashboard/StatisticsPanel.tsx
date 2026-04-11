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
  subtext,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtext?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}) => (
  <div className="card card-hover p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-foreground-primary dark:bg-accent rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-background-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
          {label}
        </p>
        <h3 className="text-xl font-bold text-foreground-primary mt-1 font-display">{value}</h3>
        {subtext && <p className="text-xs text-foreground-muted mt-1">{subtext}</p>}
      </div>
      {trend && (
        <div className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          trend.direction === 'up'
            ? 'bg-success-muted text-success'
            : 'bg-danger-muted text-danger'
        )}>
          {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value).toFixed(0)}%
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
      <div className="card p-8 flex flex-col items-center justify-center min-h-[300px] text-foreground-muted">
        <div className="w-12 h-12 bg-foreground-primary dark:bg-accent rounded-lg flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-background-primary" />
        </div>
        <p className="text-sm">Waiting for simulation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground-primary flex items-center gap-2 font-display">
          <div className="w-8 h-8 bg-foreground-primary dark:bg-accent rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-background-primary" />
          </div>
          Performance Analytics
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-foreground-secondary font-medium">
            Live metrics
          </div>
          <div className="flex gap-1 bg-background-surface rounded-lg p-1">
            <button
              onClick={() => setViewMode('basic')}
              className={clsx(
                "px-3 py-1 rounded text-xs font-medium transition-all",
                viewMode === 'basic'
                  ? 'bg-background-elevated text-foreground-primary shadow-sm'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              )}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={clsx(
                "px-3 py-1 rounded text-xs font-medium transition-all",
                viewMode === 'advanced'
                  ? 'bg-background-elevated text-foreground-primary shadow-sm'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              )}
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
          subtext="Target: < 45s"
          trend={trends.waitTime}
        />
        <StatCard
          label="Total Served"
          value={stats.total_passengers_served || 0}
          icon={Users}
          subtext="All time"
        />
        <StatCard
          label="Fleet Use"
          value={stats.fleet_utilization !== undefined ? `${stats.fleet_utilization.toFixed(0)}%` : `${((stats.buses_with_passengers || 0) / (stats.num_buses || 1) * 100).toFixed(0)}%`}
          icon={BusIcon}
          subtext="Fleet average"
          trend={trends.occupancy}
        />
        <StatCard
          label="High Demand Stops"
          value={stats.num_high_demand_stops || 0}
          icon={AlertCircle}
          subtext="Hotspots (> 10 pax)"
        />
      </div>

      <div className="bg-background-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground-secondary uppercase">Fleet Status</span>
          <span className="text-[10px] font-mono bg-background-elevated px-2 py-0.5 rounded border border-border">
            {stats.buses_in_transit || 0}/{stats.num_buses || 0} ACTIVE
          </span>
        </div>
        <div className="w-full bg-background-surface h-2 rounded-full overflow-hidden">
          <div
            className="bg-foreground-primary dark:bg-accent h-full transition-all duration-1000"
            style={{ width: `${((stats.buses_in_transit || 0) / (stats.num_buses || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Charts Section */}
      {viewMode === 'basic' ? (
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-5 flex items-center justify-between">
            Wait Time Trends
            <span className="bg-background-surface text-foreground-secondary px-2 py-1 rounded text-xs">
              Last {history.length} ticks
            </span>
          </h4>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  unit="s"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-md)",
                    backgroundColor: "var(--color-bg-elevated)",
                  }}
                  labelStyle={{ color: "var(--color-text-secondary)", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="waitTime"
                  stroke="var(--color-accent-primary)"
                  strokeWidth={2}
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
          "rounded-lg p-4 flex items-center justify-between",
          systemHealth === "optimal"
            ? "bg-success-muted text-success border border-success/20"
            : systemHealth === "warning"
              ? "bg-warning-muted text-warning border border-warning/20"
              : "bg-danger-muted text-danger border border-danger/20"
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
