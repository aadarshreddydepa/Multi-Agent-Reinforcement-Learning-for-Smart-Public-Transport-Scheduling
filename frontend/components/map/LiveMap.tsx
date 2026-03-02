"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-xl relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-800 dark:to-dark-900 animate-pulse transition-colors duration-300"></div>
      <div className="relative z-10 text-gray-400 dark:text-gray-500 font-medium transition-colors duration-300">
        Initializing Map Engine...
      </div>
    </div>
  ),
});

export default Map;
