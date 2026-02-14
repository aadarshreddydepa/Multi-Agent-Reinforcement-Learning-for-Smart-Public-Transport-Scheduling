"use client";

import React, { useMemo } from "react";
import { Polyline } from "react-leaflet";
import { Bus, Stop } from "../../types";

interface RouteVisualizationProps {
  buses: Bus[];
  stops: Stop[];
}

const RouteVisualization: React.FC<RouteVisualizationProps> = ({ buses, stops }) => {
  // Group buses by route
  const routes = useMemo(() => {
    const routeMap: { [key: string]: Bus[] } = {};
    buses.forEach((bus) => {
      const routeId = bus.current_route_id || bus.assigned_route || 'default';
      if (!routeMap[routeId]) {
        routeMap[routeId] = [];
      }
      routeMap[routeId].push(bus);
    });
    return routeMap;
  }, [buses]);

  // Get route color
  const getRouteColor = (routeId: string) => {
    const bus = buses.find(b => b.current_route_id === routeId);
    return bus?.route_color || '#3B82F6';
  };

  // Create enhanced route path with road visualization
  const createRoutePath = (routeStops: string[]) => {
    const coordinates: [number, number][] = [];
    routeStops.forEach(stopId => {
      const stop = stops.find(s => s.id === stopId);
      if (stop && stop.location) {
        coordinates.push([stop.location.lat, stop.location.lng]);
      }
    });
    return coordinates;
  };

  // Create smooth curved path for better road visualization
  const createSmoothPath = (coordinates: [number, number][]) => {
    if (coordinates.length < 2) return coordinates;
    
    // Add intermediate points for smoother curves
    const smoothPath: [number, number][] = [];
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      
      // Add start point
      smoothPath.push(start);
      
      // Add intermediate points for smooth curves
      const steps = 3;
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;
        smoothPath.push([lat, lng]);
      }
    }
    
    // Add final point
    smoothPath.push(coordinates[coordinates.length - 1]);
    
    return smoothPath;
  };

  // Build stop coordinates map
  const stopCoordinates = useMemo(() => {
    const coords: Record<string, [number, number]> = {};
    stops.forEach((stop) => {
      if (stop.location) {
        coords[stop.id] = [stop.location.lat, stop.location.lng];
      }
    });
    return coords;
  }, [stops]);

  // Generate route lines - assumes bus has assigned_route (id array) and route_color
  // The Bus interface I defined earlier might need assigned_route.
  // Let me update the Bus interface in types/index.ts to include these if they are present in backend.

  // For now I will assume they are partial or passed in Bus object

  const routeLines = useMemo(() => {
    return Object.keys(routes).map(routeId => {
      const routeBuses = routes[routeId];
      if (!routeBuses || routeBuses.length === 0) {
        return null;
      }
      
      const routeStops = routeBuses[0].assigned_route as string[] | undefined;
      const color = getRouteColor(routeId);
      
      if (routeStops && Array.isArray(routeStops)) {
        const positions = createRoutePath(routeStops);
        const smoothPositions = createSmoothPath(positions);
        if (smoothPositions.length >= 2) {
          return {
            id: routeId,
            positions: smoothPositions,
            color,
          };
        }
      }
      return null;
    })
    .filter(Boolean) as {
      id: string;
      positions: [number, number][];
      color: string;
    }[];
  }, [routes, stopCoordinates, getRouteColor]);

  return (
    <>
      {routeLines.map((line) => (
        <div key={line.id}>
          {/* Main route line */}
          <Polyline
            positions={line.positions}
            pathOptions={{
              color: "#000000",
              opacity: 0.8,
              weight: 6,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          {/* Accent route line */}
          <Polyline
            positions={line.positions}
            pathOptions={{
              color: line.color || "#0081FF",
              opacity: 0.9,
              weight: 3,
              dashArray: "12, 8",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </div>
      ))}
    </>
  );
};

export default RouteVisualization;
