"use client";

import React, { useState, useMemo } from "react";
import clsx from "clsx";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Users,
  Bus as BusIcon,
  Zap,
  Target,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface ChartData {
  time: number;
  waitTime: number;
  served: number;
  occupancy: number;
  efficiency: number;
  busesActive: number;
  demand: number;
}

interface AdvancedChartsProps {
  data: ChartData[];
  currentStats?: {
    average_wait_time: number;
    total_passengers_served: number;
    average_bus_occupancy: number;
    buses_in_transit: number;
  };
}

const COLORS = {
  primary: "var(--color-accent-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
  dark: {
    grid: "var(--color-border)",
    text: "var(--color-text-muted)",
    tooltip: "var(--color-bg-elevated)",
  },
  light: {
    grid: "var(--color-border)",
    text: "var(--color-text-secondary)",
    tooltip: "var(--color-bg-elevated)",
  },
};

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ data, currentStats }) => {
  const { theme } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'waitTime' | 'occupancy' | 'efficiency'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('1h');

  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  // Calculate trends
  const trends = useMemo(() => {
    if (data.length < 2) return { waitTime: 0, occupancy: 0, efficiency: 0 };
    
    const recent = data.slice(-10);
    const previous = data.slice(-20, -10);
    
    if (previous.length === 0) return { waitTime: 0, occupancy: 0, efficiency: 0 };
    
    const recentAvg = {
      waitTime: recent.reduce((sum, d) => sum + d.waitTime, 0) / recent.length,
      occupancy: recent.reduce((sum, d) => sum + d.occupancy, 0) / recent.length,
      efficiency: recent.reduce((sum, d) => sum + d.efficiency, 0) / recent.length,
    };
    
    const previousAvg = {
      waitTime: previous.reduce((sum, d) => sum + d.waitTime, 0) / previous.length,
      occupancy: previous.reduce((sum, d) => sum + d.occupancy, 0) / previous.length,
      efficiency: previous.reduce((sum, d) => sum + d.efficiency, 0) / previous.length,
    };
    
    return {
      waitTime: ((recentAvg.waitTime - previousAvg.waitTime) / previousAvg.waitTime) * 100,
      occupancy: ((recentAvg.occupancy - previousAvg.occupancy) / previousAvg.occupancy) * 100,
      efficiency: ((recentAvg.efficiency - previousAvg.efficiency) / previousAvg.efficiency) * 100,
    };
  }, [data]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    
    const cutoff = now - ranges[timeRange];
    return data.filter(d => d.time * 1000 >= cutoff);
  }, [data, timeRange]);

  // Pie chart data for bus utilization
  const utilizationData = useMemo(() => {
    if (!currentStats) return [];
    
    const utilization = currentStats.average_bus_occupancy * 100;
    return [
      { name: 'Utilized', value: utilization, color: COLORS.success },
      { name: 'Available', value: 100 - utilization, color: COLORS.info },
    ];
  }, [currentStats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-lg border border-border backdrop-blur-md"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
          }}
        >
          <p className="text-sm font-medium mb-2 text-foreground-secondary">
            Time: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.name === 'waitTime' && 's'}
              {entry.name === 'occupancy' && '%'}
              {entry.name === 'efficiency' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'waitTime', 'occupancy', 'efficiency'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={clsx(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                selectedMetric === metric
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-background-surface text-foreground-secondary hover:bg-background-surface/80'
              )}
            >
              {metric === 'all' && 'All Metrics'}
              {metric === 'waitTime' && 'Wait Time'}
              {metric === 'occupancy' && 'Occupancy'}
              {metric === 'efficiency' && 'Efficiency'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['1h', '6h', '24h', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                "px-2 py-1 rounded text-xs font-medium transition-all",
                timeRange === range
                  ? 'bg-accent-muted text-accent'
                  : 'bg-background-surface text-foreground-muted hover:text-foreground-secondary'
              )}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Performance Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground-primary flex items-center gap-2 font-display">
            <Activity className="w-5 h-5 text-accent" />
            Performance Metrics
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              {trends.waitTime >= 0 ? (
                <TrendingUp className="w-4 h-4 text-danger" />
              ) : (
                <TrendingDown className="w-4 h-4 text-success" />
              )}
              <span className={clsx("font-medium", trends.waitTime >= 0 ? 'text-danger' : 'text-success')}>
                Wait Time {Math.abs(trends.waitTime).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              {trends.occupancy >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-warning" />
              )}
              <span className={clsx("font-medium", trends.occupancy >= 0 ? 'text-success' : 'text-warning')}>
                Occupancy {Math.abs(trends.occupancy).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <defs>
                <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {(selectedMetric === 'all' || selectedMetric === 'waitTime') && (
                <Line
                  type="monotone"
                  dataKey="waitTime"
                  stroke="var(--color-warning)"
                  strokeWidth={2}
                  dot={false}
                  name="Wait Time"
                  animationDuration={1000}
                />
              )}

              {(selectedMetric === 'all' || selectedMetric === 'occupancy') && (
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="var(--color-accent-primary)"
                  strokeWidth={2}
                  dot={false}
                  name="Occupancy"
                  animationDuration={1200}
                />
              )}

              {(selectedMetric === 'all' || selectedMetric === 'efficiency') && (
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  dot={false}
                  name="Efficiency"
                  animationDuration={1400}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bus Utilization Pie Chart */}
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-foreground-primary flex items-center gap-2 mb-4 font-display">
            <BusIcon className="w-5 h-5 text-accent" />
            Fleet Utilization
          </h3>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            {utilizationData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-foreground-secondary">
                  {item.name}: {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demand & Service Bar Chart */}
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-foreground-primary flex items-center gap-2 mb-4 font-display">
            <Users className="w-5 h-5 text-accent" />
            Demand vs Service
          </h3>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                <Bar
                  dataKey="demand"
                  fill="var(--color-info)"
                  name="Demand"
                  animationDuration={1000}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="served"
                  fill="var(--color-success)"
                  name="Served"
                  animationDuration={1200}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCharts;
