"use client";

import React from "react";
import { Play, Pause, RotateCcw, Brain, Zap, Activity } from "lucide-react";
import { Statistics } from "../../types";

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
    <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors duration-300">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Simulation Control
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
            Manage real-time transport system
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors duration-300 ${
            isRunning ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          ></span>
          {isRunning ? "Live" : "Stopped"}
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700 w-full transition-colors duration-300" />

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onStart(useTrained)}
          disabled={isRunning}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            isRunning
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg active:transform active:scale-95"
          }`}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          Start
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            !isRunning
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg active:transform active:scale-95"
          }`}
        >
          <Pause className="w-4 h-4" fill="currentColor" />
          Stop
        </button>
      </div>

      <button
        onClick={onReset}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
      >
        <RotateCcw className="w-4 h-4" />
        Reset System
      </button>

      {/* Advanced Options */}
      <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30 transition-colors duration-300">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={useTrained}
              onChange={(e) => setUseTrained(e.target.checked)}
              disabled={isRunning}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200">
            <Zap className="w-4 h-4 text-amber-500" />
            Use Trained AI Agents
          </span>
        </label>
      </div>

      {/* Training Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 transition-colors duration-300">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors duration-300">
          Model Training
        </p>
        <button
          onClick={onTrain}
          disabled={isRunning || isTraining}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isRunning || isTraining
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
          }`}
        >
          <Brain className={`w-4 h-4 ${isTraining ? "animate-pulse" : ""}`} />
          {isTraining ? "Training in Progress..." : "Train Agents (100 Eps)"}
        </button>
      </div>

      {/* Mini Stats for quick view */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors duration-300">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase transition-colors duration-300">Wait Time</div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
              {(stats.average_wait_time || 0).toFixed(1)}s
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors duration-300">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase transition-colors duration-300">Served</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400 transition-colors duration-300">
              {stats.total_passengers_served || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
