"use client";

import React, { useEffect, useRef, useState } from "react";
import { Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Bus, Stop } from "../../types";

interface AnimatedRouteVisualizationProps {
  buses: Bus[];
  stops: Stop[];
}

interface RouteSegment {
  id: string;
  from: [number, number];
  to: [number, number];
  color: string;
  progress: number;
  direction: 'forward' | 'backward';
  active: boolean;
}

const AnimatedRouteVisualization: React.FC<AnimatedRouteVisualizationProps> = ({
  buses,
  stops,
}) => {
  const map = useMap();
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Create route segments from bus routes
  useEffect(() => {
    const segments: RouteSegment[] = [];
    
    buses.forEach((bus: Bus) => {
      if (bus.assigned_route && Array.isArray(bus.assigned_route) && bus.assigned_route.length > 1) {
        const routeColor = bus.route_color || "#3b82f6";
        
        // Create segments between consecutive stops
        for (let i = 0; i < bus.assigned_route.length - 1; i++) {
          const fromStopId = bus.assigned_route[i];
          const toStopId = bus.assigned_route[i + 1];
          
          const fromStop = stops.find((s: Stop) => s.id === fromStopId);
          const toStop = stops.find((s: Stop) => s.id === toStopId);
          
          if (fromStop?.location && toStop?.location) {
            segments.push({
              id: `${bus.id}_${fromStopId}_${toStopId}`,
              from: [fromStop.location.lat, fromStop.location.lng],
              to: [toStop.location.lat, toStop.location.lng],
              color: routeColor,
              progress: 0,
              direction: 'forward',
              active: bus.state === 'MOVING' || bus.state === 'IN_TRANSIT',
            });
          }
        }
      }
    });
    
    setRouteSegments(segments);
  }, [buses, stops]);

  // Animation loop for flowing effect
  useEffect(() => {
    const animate = () => {
      setRouteSegments(prevSegments =>
        prevSegments.map(segment => ({
          ...segment,
          progress: segment.active ? (segment.progress + 0.02) % 1 : segment.progress,
        }))
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Create flowing dashed line pattern
  const createFlowingPattern = (color: string, progress: number) => {
    const dashArray = "10, 10";
    const dashOffset = `${progress * 20}`; // Convert to string for Leaflet
    return { color, dashArray, dashOffset, weight: selectedRoute ? 4 : 3 };
  };

  return (
    <>
      {routeSegments.map((segment) => (
        <Polyline
          key={segment.id}
          positions={[segment.from, segment.to]}
          pathOptions={{
            ...createFlowingPattern(segment.color, segment.progress),
            opacity: segment.active ? 0.8 : 0.4,
            className: segment.active ? 'route-active' : 'route-inactive',
          }}
          eventHandlers={{
            click: () => {
              setSelectedRoute(segment.id === selectedRoute ? null : segment.id);
            },
            mouseover: (e: any) => {
              const target = e.target;
              if (target.setStyle) {
                target.setStyle({ weight: 5, opacity: 1 });
              }
            },
            mouseout: (e: any) => {
              const target = e.target;
              if (target.setStyle) {
                target.setStyle({ 
                  weight: selectedRoute === segment.id ? 4 : 3, 
                  opacity: segment.active ? 0.8 : 0.4 
                });
              }
            },
          }}
        />
      ))}
      
      {/* Direction arrows along routes */}
      {routeSegments
        .filter(segment => segment.active && selectedRoute === segment.id)
        .map((segment) => {
          const midPoint: [number, number] = [
            (segment.from[0] + segment.to[0]) / 2,
            (segment.from[1] + segment.to[1]) / 2,
          ];
          
          // Calculate angle for arrow rotation
          const angle = Math.atan2(
            segment.to[1] - segment.from[1],
            segment.to[0] - segment.from[0]
          ) * (180 / Math.PI);
          
          return (
            <DirectionArrow
              key={`arrow-${segment.id}`}
              position={midPoint}
              angle={angle}
              color={segment.color}
            />
          );
        })}
    </>
  );
};

// Direction Arrow Component
interface DirectionArrowProps {
  position: [number, number];
  angle: number;
  color: string;
}

const DirectionArrow: React.FC<DirectionArrowProps> = ({ position, angle, color }) => {
  const [icon, setIcon] = useState<L.DivIcon | null>(null);
  
  useEffect(() => {
    const arrowIcon = L.divIcon({
      className: 'direction-arrow',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          position: relative;
          transform: rotate(${angle}deg);
          animation: pulse-arrow 2s infinite;
        ">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2 L16 10 L12 10 L12 18 L8 18 L8 10 L4 10 Z"
              fill="${color}"
              stroke="white"
              stroke-width="1"
            />
          </svg>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    
    setIcon(arrowIcon);
  }, [angle, color]);
  
  if (!icon) return null;
  
  return <Polyline positions={[position, position]} pathOptions={{}} />;
};

export default AnimatedRouteVisualization;
