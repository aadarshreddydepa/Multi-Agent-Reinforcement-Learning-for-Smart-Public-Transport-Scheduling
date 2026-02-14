export interface Location {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  location: Location;
  passengers_waiting?: number;
}

export interface Bus {
  id: string;
  current_route_id?: string;
  current_stop_idx?: number; // Index in route
  passengers: string[] | any[]; // Passenger IDs - handle different structures
  capacity: number;
  state:
    | "IDLE"
    | "MOVING"
    | "BOARDING"
    | "ALIGHTING"
    | "IN_TRANSIT"
    | "AT_STOP"
    | "WAITING"; // Adjust based on backend
  position?: Location; // Real-time (backend uses position, not location)
  location?: Location; // For compatibility
  next_stop_id?: string;
  current_stop?: string;
  next_stop?: string;
  assigned_route?: string[];
  route_color?: string;
  total_served?: number;
  is_dynamic?: boolean;
}

export interface SimulationState {
  buses: { [key: string]: Bus };
  stops: { [key: string]: number }; // ID -> Count? Or full stop objects? API usually returns array.
  total_passengers_waiting: number;
  simulation_time: number;
}

export interface Statistics {
  average_wait_time: number;
  average_bus_occupancy: number;
  total_passengers_served: number;
  total_passengers_waiting: number;
  buses_in_transit: number;
  simulation_time: number;
}

export interface Alert {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: Date;
}
