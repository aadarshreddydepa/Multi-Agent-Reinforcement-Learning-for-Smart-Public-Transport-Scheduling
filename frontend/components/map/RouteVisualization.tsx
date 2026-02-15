"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Polyline } from "react-leaflet";
import { Bus, Stop } from "../../types";
import apiService from "../../services/api";

interface RouteVisualizationProps {
  buses: Bus[];
  stops: Stop[];
}

const RouteVisualization: React.FC<RouteVisualizationProps> = ({ buses, stops }) => {
  const [roadPaths, setRoadPaths] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch road paths on component mount
  useEffect(() => {
    const fetchRoadPaths = async () => {
      try {
        const response = await apiService.getRoadPaths() as any;
        if (response.success) {
          setRoadPaths(response.road_paths || {});
        }
      } catch (error) {
        console.error('Error fetching road paths:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadPaths();
  }, []);

  // Group buses by route
  const routes = useMemo(() => {
    const routeMap: { [key: string]: Bus[] } = {};
    buses.forEach((bus) => {
      let routeId: string;
      if (bus.current_route_id) {
        routeId = bus.current_route_id;
      } else if (bus.assigned_route) {
        // Handle assigned_route as either string or array
        routeId = Array.isArray(bus.assigned_route) 
          ? bus.assigned_route.join('-') 
          : bus.assigned_route;
      } else {
        routeId = 'default';
      }
      
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

  // Create route path using real road data when available, fallback to straight lines
  const createRoutePath = (routeId: string, routeStops: string[]) => {
    // Try to use road paths first
    if (roadPaths[routeId] && roadPaths[routeId].path) {
      return roadPaths[routeId].path;
    }
    
    // Fallback to straight-line paths
    const coordinates: [number, number][] = [];
    routeStops.forEach(stopId => {
      const stop = stops.find(s => s.id === stopId);
      if (stop && stop.location) {
        coordinates.push([stop.location.lat, stop.location.lng]);
      }
    });
    return coordinates;
  };

  // Generate route lines using road paths
  const routeLines = useMemo(() => {
    if (loading) return [];
    
    return Object.keys(routes).map(routeId => {
      const routeBuses = routes[routeId];
      if (!routeBuses || routeBuses.length === 0) {
        return null;
      }
      
      const routeStops = routeBuses[0].assigned_route as string[] | undefined;
      const color = getRouteColor(routeId);
      
      if (routeStops && Array.isArray(routeStops)) {
        const positions = createRoutePath(routeId, routeStops);
        if (positions.length >= 2) {
          return {
            id: routeId,
            positions,
            color: roadPaths[routeId]?.color || color,
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
  }, [routes, roadPaths, loading, getRouteColor]);

  if (loading) {
    return null; // Don't render anything while loading
  }

  return (
    <>
      {routeLines.map((line) => (
        <Polyline
          key={line.id}
          positions={line.positions}
          pathOptions={{
            color: line.color || "#3B82F6",
            opacity: 0.8,
            weight: 3,
            dashArray: "10, 5",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
    </>
  );
};

export default RouteVisualization;
