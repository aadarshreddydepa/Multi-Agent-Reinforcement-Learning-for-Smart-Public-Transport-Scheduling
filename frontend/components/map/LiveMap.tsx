"use client";

import dynamic from "next/dynamic";
import { Bus, Stop } from "../../types";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background-secondary rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background-secondary to-background-surface animate-pulse"></div>
      <div className="relative z-10 text-foreground-muted font-medium">
        Initializing Map Engine...
      </div>
    </div>
  ),
  }
);

export default Map;
