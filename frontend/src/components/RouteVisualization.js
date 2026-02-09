import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';

const RouteVisualization = ({ buses, stops }) => {
  // Build stop coordinates from stops array (main_gate, library, canteen, etc.)
  const stopCoordinates = useMemo(() => {
    const coords = {};
    const stopList = Array.isArray(stops) ? stops : Object.values(stops || {});
    stopList.forEach(stop => {
      const loc = stop.location || stop;
      if (stop.id && loc) {
        coords[stop.id] = [loc.lat ?? 17.3850, loc.lng ?? 78.4867];
      }
    });
    return coords;
  }, [stops]);

  // Generate route polylines for each bus
  const routeLines = useMemo(() => {
    const lines = [];
    
    buses.forEach(bus => {
      if (bus.assigned_route && bus.route_color) {
        const routeCoords = bus.assigned_route.map(stopId => stopCoordinates[stopId]).filter(Boolean);
        
        if (routeCoords.length >= 2) {
          lines.push({
            id: bus.id,
            positions: routeCoords,
            color: bus.route_color,
            opacity: 0.6,
            weight: 3
          });
        }
      }
    });
    
    return lines;
  }, [buses, stopCoordinates]);

  return (
    <>
      {routeLines.map(line => (
        <Polyline
          key={line.id}
          positions={line.positions}
          color={line.color}
          opacity={line.opacity}
          weight={line.weight}
          dashArray="10, 5"
          className="bus-route-line"
        />
      ))}
    </>
  );
};

export default RouteVisualization;
