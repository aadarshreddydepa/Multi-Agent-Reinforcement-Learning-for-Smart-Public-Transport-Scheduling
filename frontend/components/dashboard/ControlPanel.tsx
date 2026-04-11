"use client";

import React from "react";
import { Play, Pause, RotateCcw, Brain, Zap, Activity } from "lucide-react";
import { Statistics } from "../../types";
import clsx from "clsx";

interface ControlPanelProps {
  isRunning: boolean;
  onStart: (useTrained: boolean) => void;
  onStop: () => void;
  onReset: () => void;
  onTrain: () => void;
  isTraining: boolean;
  stats: Statistics | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onStart,
  onStop,
  onReset,
  onTrain,
  isTraining,
  stats,
}) => {
  const [useTrained, setUseTrained] = React.useState(false);

  return (
    <div className="card card-hover p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-foreground-primary flex items-center gap-2 font-display">
            <Activity className="w-5 h-5 text-accent" />
            Simulation Control
          </h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage real-time transport system
          </p>
        </div>
        <div
          className={clsx(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2",
            isRunning ? "badge-success" : "bg-background-surface text-foreground-muted"
          )}
        >
          <span
            className={clsx("w-2 h-2 rounded-full", isRunning ? "bg-success animate-pulse" : "bg-foreground-muted")}
          />
          {isRunning ? "Live" : "Stopped"}
        </div>
      </div>

      <div className="h-px bg-border w-full" />

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onStart(useTrained)}
          disabled={isRunning}
          className={clsx(
            "btn btn-compact",
            isRunning
              ? "bg-background-surface text-foreground-muted cursor-not-allowed"
              : "bg-success hover:bg-success/90 text-white shadow-md hover:shadow-lg"
          )}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          Start
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning}
          className={clsx(
            "btn btn-compact",
            !isRunning
              ? "bg-background-surface text-foreground-muted cursor-not-allowed"
              : "bg-danger hover:bg-danger/90 text-white shadow-md hover:shadow-lg"
          )}
        >
          <Pause className="w-4 h-4" fill="currentColor" />
          Stop
        </button>
      </div>

      <button
        onClick={onReset}
        className="btn btn-secondary btn-compact"
      >
        <RotateCcw className="w-4 h-4" />
        Reset System
      </button>

      {/* Advanced Options */}
      <div className="bg-accent-muted rounded-lg p-4 border border-accent/10">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={useTrained}
              onChange={(e) => setUseTrained(e.target.checked)}
              disabled={isRunning}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-background-surface peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
          </div>
          <span className="text-sm font-medium text-foreground-primary flex items-center gap-2 group-hover:text-accent transition-colors">
            <Zap className="w-4 h-4 text-warning" />
            Use Trained AI Agents
          </span>
        </label>
      </div>

      {/* Training Section */}
      <div className="border-t border-border pt-4 mt-2">
        <p className="text-xs font-bold text-foreground-primary uppercase tracking-wider mb-3">
          Model Training
        </p>
        <button
          onClick={onTrain}
          disabled={isRunning || isTraining}
          className={clsx(
            "w-full btn",
            isRunning || isTraining
              ? "bg-background-surface text-foreground-muted cursor-not-allowed"
              : "bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg"
          )}
        >
          <Brain className={clsx("w-4 h-4", isTraining && "animate-pulse")} />
          {isTraining ? "Training in Progress..." : "Train Agents (100 Eps)"}
        </button>
      </div>

      {/* Mini Stats for quick view */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-border">
          <div className="text-center p-3 bg-background-surface rounded-lg">
            <div className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">Wait Time</div>
            <div className="text-lg font-bold text-foreground-primary">
              {(stats.average_wait_time || 0).toFixed(1)}s
            </div>
          </div>
          <div className="text-center p-3 bg-background-surface rounded-lg">
            <div className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">Served</div>
            <div className="text-lg font-bold text-success">
              {stats.total_passengers_served || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
