"""
Passenger Demand Generator - Simulates realistic passenger arrivals
"""
import random
import numpy as np
from datetime import datetime, time
from typing import Dict, List
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import env_logger
from environment.route_manager import route_manager
from agents.reward_system import reward_calculator

class PassengerDemand:
    """Generates and manages passenger demand at bus stops"""
    
    def __init__(self):
        """Initialize passenger demand generator"""
        self.stop_queues = {}  # {stop_id: [passenger1, passenger2, ...]}
        self.passenger_id_counter = 0
        self.total_passengers_generated = 0
        self.total_passengers_served = 0
        
        # Initialize queues for all stops
        for stop_id in route_manager.stops.keys():
            self.stop_queues[stop_id] = []
        
        env_logger.info("PassengerDemand initialized")
    
    def generate_passengers(self, stop_id: str, current_time: str = None, delta_time: float = 1.0) -> int:
        """
        Generate new passengers at a stop based on time and demand patterns
        
        Args:
            stop_id: ID of the bus stop
            current_time: Current time in "HH:MM" format (None = use random)
            delta_time: Time elapsed since last generation (seconds)
        
        Returns:
            Number of new passengers generated
        """
        if current_time is None:
            current_time = self._get_current_time_string()
        
        # Base arrival rate (passengers per second)
        base_rate = Config.PASSENGER_ARRIVAL_RATE
        
        # Check if peak hour - increase rate
        is_peak = route_manager.is_peak_hour(stop_id, current_time)
        multiplier = 3.0 if is_peak else 1.0
        
        # Calculate expected number of passengers
        arrival_rate = base_rate * multiplier
        expected_passengers = arrival_rate * delta_time
        
        # Use Poisson distribution for realistic arrivals
        num_new_passengers = np.random.poisson(expected_passengers)
        
        # Add some randomness (±20%)
        randomness = random.uniform(0.8, 1.2)
        num_new_passengers = int(num_new_passengers * randomness)
        
        # Don't exceed stop capacity
        current_queue = len(self.stop_queues[stop_id])
        stop_capacity = route_manager.get_stop_capacity(stop_id)
        
        if current_queue >= stop_capacity:
            num_new_passengers = 0  # Stop is full
        elif current_queue + num_new_passengers > stop_capacity:
            num_new_passengers = stop_capacity - current_queue
        
        # Create passenger objects
        for _ in range(num_new_passengers):
            passenger = self._create_passenger(stop_id, current_time)
            self.stop_queues[stop_id].append(passenger)
            self.total_passengers_generated += 1
        
        if num_new_passengers > 0:
            env_logger.debug(f"Generated {num_new_passengers} passengers at {stop_id} (peak={is_peak})")
        
        return num_new_passengers
    
    def _create_passenger(self, stop_id: str, arrival_time: str) -> Dict:
        """Create a passenger object"""
        self.passenger_id_counter += 1
        
        return {
            'id': f'passenger_{self.passenger_id_counter}',
            'stop_id': stop_id,
            'arrival_time': arrival_time,
            'wait_time': 0,  # Updated each simulation step
            'destination': None,  # Could add destination logic later
            'boarded': False
        }
    
    def get_queue_length(self, stop_id: str) -> int:
        """Get number of passengers waiting at a stop"""
        return len(self.stop_queues.get(stop_id, []))
    
    def get_passengers_at_stop(self, stop_id: str) -> List[Dict]:
        """Get all passengers waiting at a stop"""
        return self.stop_queues.get(stop_id, [])
    
    def board_passengers(self, stop_id: str, num_passengers: int) -> List[Dict]:
        """
        Board passengers onto a bus
        
        Args:
            stop_id: Stop where bus is located
            num_passengers: Maximum number of passengers to board
        
        Returns:
            List of boarded passengers
        """
        queue = self.stop_queues.get(stop_id, [])
        
        # Take first N passengers (FIFO)
        boarded = queue[:num_passengers]
        self.stop_queues[stop_id] = queue[num_passengers:]
        
        # Mark as boarded
        for passenger in boarded:
            passenger['boarded'] = True
        
        self.total_passengers_served += len(boarded)
        
        if len(boarded) > 0:
            env_logger.debug(f"Boarded {len(boarded)} passengers at {stop_id}")
        
        return boarded
    
    def update_wait_times(self, delta_time: float):
        """
        Update wait times for all passengers
        
        Args:
            delta_time: Time elapsed (seconds)
        """
        for stop_id, queue in self.stop_queues.items():
            for passenger in queue:
                passenger['wait_time'] += delta_time
    
    def get_average_wait_time(self, stop_id: str = None) -> float:
        """
        Calculate average wait time
        
        Args:
            stop_id: Specific stop (None = all stops)
        
        Returns:
            Average wait time in seconds
        """
        if stop_id:
            queue = self.stop_queues.get(stop_id, [])
            if not queue:
                return 0
            return sum(p['wait_time'] for p in queue) / len(queue)
        else:
            # Average across all stops
            all_passengers = []
            for queue in self.stop_queues.values():
                all_passengers.extend(queue)
            
            if not all_passengers:
                return 0
            
            return sum(p['wait_time'] for p in all_passengers) / len(all_passengers)
    
    def get_total_waiting(self) -> int:
        """Get total number of passengers waiting across all stops"""
        return sum(len(queue) for queue in self.stop_queues.values())
    
    def get_statistics(self) -> Dict:
        """Get comprehensive statistics about passenger demand"""
        total_waiting = self.get_total_waiting()
        avg_wait = self.get_average_wait_time()
        
        # Per-stop statistics
        stop_stats = {}
        for stop_id, queue in self.stop_queues.items():
            stop_stats[stop_id] = {
                'waiting': len(queue),
                'avg_wait_time': self.get_average_wait_time(stop_id)
            }
        
        return {
            'total_generated': self.total_passengers_generated,
            'total_served': self.total_passengers_served,
            'total_waiting': total_waiting,
            'average_wait_time': avg_wait,
            'stops': stop_stats
        }
    
    def reset(self):
        """Reset all passenger queues and statistics"""
        for stop_id in self.stop_queues.keys():
            self.stop_queues[stop_id] = []
        
        self.passenger_id_counter = 0
        self.total_passengers_generated = 0
        self.total_passengers_served = 0
        
        env_logger.info("PassengerDemand reset")
    
    def _get_current_time_string(self) -> str:
        """Get current time as HH:MM string"""
        now = datetime.now()
        return now.strftime("%H:%M")
    
    def simulate_rush_hour(self, stop_id: str, duration_seconds: float = 60):
        """
        Simulate a rush hour burst at a specific stop
        Useful for testing agent behavior under stress
        """
        num_passengers = random.randint(10, 20)
        current_time = self._get_current_time_string()
        
        for _ in range(num_passengers):
            passenger = self._create_passenger(stop_id, current_time)
            self.stop_queues[stop_id].append(passenger)
            self.total_passengers_generated += 1
        
        env_logger.info(f"Rush hour simulated at {stop_id}: {num_passengers} passengers")

    def generate_passengers_all(self, current_time: str = None, delta_time: float = 1.0) -> int:
        """Generate passengers at all stops. Returns total generated."""
        total = 0
        for stop_id in self.stop_queues.keys():
            total += self.generate_passengers(stop_id, current_time, delta_time)
        return total

class TrafficEnvironment:
    """Main traffic environment for bus simulation with intelligent movement"""
    
    def __init__(self):
        """Initialize traffic environment"""
        self.buses = {}
        self.simulation_time = 0.0
        self.passenger_demand = PassengerDemand()
        self.route_manager = route_manager
        self.bus_routes = {}  # Track each bus's route progress
        self.dynamic_buses = []  # List of dynamically added buses
        self.demand_threshold = 12  # Total passengers waiting to trigger new bus
        self.demand_threshold_per_stop = 8  # High demand at single stop
        self.max_buses = 8  # Maximum buses allowed
        self._last_bus_add_time = -999  # Cooldown for adding buses
        env_logger.info("TrafficEnvironment initialized")

    def reset(self):
        """Reset the environment with routes from route_manager (routes.json, stops.json)"""
        self.simulation_time = 0
        self.is_running = True
        self.buses = {}
        self.bus_routes = {}
        self.dynamic_buses = []
        self._last_bus_add_time = -999

        # Reset passenger demand
        self.passenger_demand.reset()

        # Get stops from route_manager (main_gate, library, canteen, hostel_block_a, sports_complex)
        route_1 = self.route_manager.get_route('route_1')
        base_stops = route_1['stops'] if route_1 else list(self.route_manager.stops.keys())
        # Remove duplicate main_gate at end for circular route
        if base_stops and base_stops[0] == base_stops[-1]:
            base_stops = base_stops[:-1]

        # Create route variations: forward, reverse, and alternate (skip pattern)
        n = len(base_stops)
        alternate_route = base_stops + [base_stops[0]]  # Default to forward
        if n >= 5:
            alternate_route = [base_stops[0], base_stops[2 % n], base_stops[4 % n], base_stops[1], base_stops[3], base_stops[0]]
        bus_routes_config = [
            {'route': base_stops + [base_stops[0]], 'color': '#0ea5e9'},
            {'route': list(reversed(base_stops)) + [base_stops[-1]], 'color': '#10b981'},
            {'route': alternate_route, 'color': '#f59e0b'},
        ]

        bus_id = 1
        for route_config in bus_routes_config:
            first_stop_id = route_config['route'][0]
            first_stop = self.route_manager.stops.get(first_stop_id, {
                'location': {'lat': 17.3850 + (bus_id * 0.01), 'lng': 78.4867 + (bus_id * 0.01)}
            })
            if isinstance(first_stop.get('location'), dict):
                loc = first_stop['location']
            else:
                loc = {'lat': 17.3850, 'lng': 78.4867}

            bus = {
                'id': f'bus_{bus_id}',
                'route_id': f'route_{bus_id}',
                'assigned_route': route_config['route'],
                'route_color': route_config['color'],
                'current_stop_index': 0,
                'current_stop': first_stop_id,
                'capacity': Config.BUS_CAPACITY,
                'passengers': [],
                'state': 'AT_STOP',
                'position': {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)},
                'total_served': 0,
                'speed': 0.025,
                'last_departure_time': 0,
                'arrival_time': 0,
                'schedule_adherence': 0,
                'total_distance': 0,
                'average_speed': 0
            }
            self.buses[bus['id']] = bus

            self.bus_routes[bus['id']] = {
                'route': route_config['route'],
                'current_index': 0,
                'target_index': 1,
                'progress': 0.0,
                'direction': 1,
                'color': route_config['color']
            }
            bus_id += 1

        env_logger.info(f"Environment reset with {len(self.buses)} buses on {len(base_stops)} stops")
        return self.get_state()

    def step(self, actions: dict = None):
        """
        Execute one simulation step. Uses agent actions when provided, else fallback logic.
        Args:
            actions: {bus_id: action_name} from RL agents (e.g. DEPART_NOW, WAIT_30, etc.)
        Returns:
            (next_observations, rewards, done)
        """
        if not self.is_running:
            return {}, {}, False

        self.simulation_time += 1

        # Generate passengers at all stops
        self.passenger_demand.generate_passengers_all(delta_time=1.0)
        self.passenger_demand.update_wait_times(1.0)

        # Execute actions for all buses (use agent actions when provided)
        rewards = {}
        for bus_id, bus in self.buses.items():
            if actions and bus_id in actions:
                action = actions[bus_id]
            else:
                action = self._make_intelligent_decision(bus)
            rewards[bus_id] = self._execute_bus_action(bus, action)
            env_logger.debug(f"Bus {bus_id} action: {action}, reward: {rewards[bus_id]}")

        # Update bus positions
        self._update_bus_positions()

        # Manage dynamic buses based on demand
        self._manage_dynamic_buses()

        # Get observations AFTER step (next state for RL)
        next_observations = self.get_observations()
        done = self.simulation_time >= 1800

        return next_observations, rewards, done
    
    def get_observations(self):
        """Get observations for all buses"""
        observations = {}
        for bus_id in self.buses.keys():
            observations[bus_id] = self._get_observation_for_bus(bus_id)
        return observations
    
    def _execute_bus_action(self, bus, action):
        """Execute bus action using reward system for effective learning"""
        current_stop = bus['current_stop']
        queue_before = len(self.passenger_demand.stop_queues.get(current_stop, []))
        time_at_stop = self.simulation_time - bus.get('arrival_time', self.simulation_time) if bus['state'] == 'AT_STOP' else 0

        if action == 'DEPART_NOW':
            boarded = []
            available_space = bus['capacity'] - len(bus['passengers'])
            if queue_before > 0 and available_space > 0:
                boarded = self.passenger_demand.board_passengers(current_stop, min(queue_before, available_space))
                bus['passengers'].extend(boarded)
                bus['total_served'] = bus.get('total_served', 0) + len(boarded)
            queue_after = len(self.passenger_demand.stop_queues.get(current_stop, []))
            occupancy = len(bus['passengers']) / max(bus['capacity'], 1)
            reward = reward_calculator.calculate_reward(action, len(boarded), queue_before, queue_after, occupancy, time_at_stop)
            bus['state'] = 'IN_TRANSIT'
            self._set_next_destination(bus)

        elif action == 'WAIT_30':
            available_space = bus['capacity'] - len(bus['passengers'])
            queue_now = len(self.passenger_demand.stop_queues.get(current_stop, []))
            boarded = []
            if queue_now > 0 and available_space > 0:
                boarded = self.passenger_demand.board_passengers(current_stop, min(queue_now, available_space))
                bus['passengers'].extend(boarded)
                bus['total_served'] = bus.get('total_served', 0) + len(boarded)
            queue_after = len(self.passenger_demand.stop_queues.get(current_stop, []))
            occupancy = len(bus['passengers']) / max(bus['capacity'], 1)
            reward = reward_calculator.calculate_reward(action, len(boarded), queue_before, queue_after, occupancy, 30)

        elif action == 'WAIT_60':
            available_space = bus['capacity'] - len(bus['passengers'])
            queue_now = len(self.passenger_demand.stop_queues.get(current_stop, []))
            boarded = []
            if queue_now > 0 and available_space > 0:
                boarded = self.passenger_demand.board_passengers(current_stop, min(queue_now, available_space))
                bus['passengers'].extend(boarded)
                bus['total_served'] = bus.get('total_served', 0) + len(boarded)
            queue_after = len(self.passenger_demand.stop_queues.get(current_stop, []))
            occupancy = len(bus['passengers']) / max(bus['capacity'], 1)
            reward = reward_calculator.calculate_reward(action, len(boarded), queue_before, queue_after, occupancy, 60)

        elif action == 'SKIP_STOP':
            reward = reward_calculator.calculate_reward(action, 0, queue_before, queue_before, len(bus['passengers']) / max(bus['capacity'], 1), 0)
            bus['state'] = 'IN_TRANSIT'
            self._set_next_destination(bus)

        elif action == 'CONTINUE':
            reward = 0.1 if bus['state'] == 'IN_TRANSIT' else 0.0

        else:
            reward = 0.0

        return reward
    
    def _set_next_destination(self, bus):
        """Set next destination for bus based on its assigned route"""
        route_info = self.bus_routes[bus['id']]
        current_index = route_info['current_index']
        route = route_info['route']
        
        # Calculate next stop index based on direction
        if route_info['direction'] == 1:
            next_index = (current_index + 1) % len(route)
            if next_index == 0:  # Reached end, reverse direction
                route_info['direction'] = -1
                next_index = current_index - 1
        else:
            next_index = current_index - 1
            if next_index < 0:  # Reached start, reverse direction
                route_info['direction'] = 1
                next_index = 1
        
        next_stop = route[next_index]
        
        # Update route tracking
        route_info['current_index'] = current_index
        route_info['target_index'] = next_index
        route_info['progress'] = 0.0
        
        bus['current_stop_index'] = current_index
        bus['next_stop'] = next_stop
        bus['last_departure_time'] = self.simulation_time
        
        env_logger.debug(f"Bus {bus['id']} heading from {route[current_index]} to {next_stop}")
    
    def _update_bus_positions(self):
        """Update bus positions with smooth transitions"""
        for bus_id, bus in self.buses.items():
            if bus['state'] == 'IN_TRANSIT':
                route_info = self.bus_routes.get(bus_id)
                if route_info:
                    # Update progress towards next stop with realistic speed
                    # Calculate distance-based movement
                    distance_factor = bus['speed'] * 0.1  # Adjust for realistic movement
                    route_info['progress'] += distance_factor
                    
                    if route_info['progress'] >= 1.0:
                        # Arrived at next stop
                        route_info['current_index'] = route_info['target_index']
                        bus['current_stop_index'] = route_info['current_index']
                        bus['current_stop'] = route_info['route'][route_info['current_index']]
                        bus['state'] = 'AT_STOP'
                        bus['arrival_time'] = self.simulation_time
                        route_info['progress'] = 0.0

                        # Update position to exact stop coordinates
                        stop_data = self.route_manager.stops.get(bus['current_stop'], {})
                        loc = stop_data.get('location', {'lat': 17.3850, 'lng': 78.4867})
                        bus['position'] = {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)}
                        env_logger.debug(f"Bus {bus_id} arrived at {bus['current_stop']} (stop {route_info['current_index']})")
                    else:
                        # Interpolate position between stops
                        self._interpolate_bus_position(bus)
            elif bus['state'] == 'AT_STOP':
                stop_data = self.route_manager.stops.get(bus['current_stop'], {})
                loc = stop_data.get('location', {'lat': 17.3850, 'lng': 78.4867})
                bus['position'] = {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)}
    
    def _interpolate_bus_position(self, bus):
        """Interpolate bus position between stops for smooth movement"""
        route_info = self.bus_routes[bus['id']]
        route = route_info['route']
        current_index = route_info['current_index']
        target_index = route_info['target_index']
        
        # Get stop coordinates
        current_stop_id = route[current_index]
        target_stop_id = route[target_index]
        
        def _get_coords(stop_id, idx):
            s = self.route_manager.stops.get(stop_id, {})
            loc = s.get('location', {'lat': 17.3850 + idx * 0.01, 'lng': 78.4867 + idx * 0.01})
            return loc.get('lat', 17.3850), loc.get('lng', 78.4867)

        lat1, lng1 = _get_coords(current_stop_id, current_index)
        lat2, lng2 = _get_coords(target_stop_id, target_index)
        progress = route_info['progress']
        eased = self._ease_in_out_cubic(progress)
        bus['position'] = {
            'lat': lat1 + (lat2 - lat1) * eased,
            'lng': lng1 + (lng2 - lng1) * eased
        }
    
    def _ease_in_out_cubic(self, t):
        """Cubic easing function for smooth animation"""
        if t < 0.5:
            return 4 * t * t * t
        else:
            return 1 - pow(-2 * t + 2, 3) / 2
    
    def _manage_dynamic_buses(self):
        """Add or remove buses based on passenger demand"""
        total_waiting = self.passenger_demand.get_total_waiting()
        current_buses = len(self.buses)
        dynamic_count = len(self.dynamic_buses)
        
        # Check for high demand at any single stop
        max_stop_queue = max(
            len(q) for q in self.passenger_demand.stop_queues.values()
        ) if self.passenger_demand.stop_queues else 0
        
        # Add bus if total demand or single-stop demand is high (with cooldown)
        if current_buses < self.max_buses:
            if (total_waiting > self.demand_threshold or max_stop_queue > self.demand_threshold_per_stop):
                if self.simulation_time - self._last_bus_add_time > 60:  # 60s cooldown
                    self._add_dynamic_bus()
                    self._last_bus_add_time = self.simulation_time
        
        # Remove dynamic buses if demand is low (keep at least base fleet)
        elif total_waiting < 4 and dynamic_count > 0:
            dynamic_buses = [bid for bid in self.buses.keys() if bid.startswith('dynamic_')]
            if dynamic_buses:
                self._remove_dynamic_bus(dynamic_buses[0])
    
    def _add_dynamic_bus(self):
        """Add a new bus to handle high demand"""
        bus_id = f'dynamic_{len(self.dynamic_buses)}'
        route_1 = self.route_manager.get_route('route_1')
        base_stops = route_1['stops'] if route_1 else list(self.route_manager.stops.keys())
        if base_stops and base_stops[0] == base_stops[-1]:
            base_stops = base_stops[:-1]
        route = base_stops + [base_stops[0]]
        first_stop_id = route[0]
        first_stop = self.route_manager.stops.get(first_stop_id, {})
        loc = first_stop.get('location', {'lat': 17.3850, 'lng': 78.4867})

        new_bus = {
            'id': bus_id,
            'route_id': 'route_1',
            'assigned_route': route,
            'route_color': '#ef4444',
            'state': 'AT_STOP',
            'current_stop': first_stop_id,
            'passengers': [],
            'capacity': Config.BUS_CAPACITY,
            'position': {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)},
            'arrival_time': self.simulation_time,
            'total_served': 0,
            'speed': 0.025,
            'last_departure_time': 0,
            'is_dynamic': True
        }

        self.buses[bus_id] = new_bus
        self.bus_routes[bus_id] = {'route': route, 'current_index': 0, 'target_index': 1, 'progress': 0.0, 'direction': 1, 'color': '#ef4444'}
        self.dynamic_buses.append(bus_id)

        env_logger.info(f"Added dynamic bus {bus_id} to handle high demand")
    
    def _remove_dynamic_bus(self, bus_id):
        """Remove a dynamic bus when demand is low"""
        if bus_id in self.buses and self.buses[bus_id].get('is_dynamic'):
            del self.buses[bus_id]
            self.dynamic_buses.remove(bus_id)
            if bus_id in self.bus_routes:
                del self.bus_routes[bus_id]
            
            env_logger.info(f"Removed dynamic bus {bus_id} due to low demand")
    
    def add_bus_on_demand(self):
        """Manually add a bus (for frontend control)"""
        if len(self.buses) < self.max_buses:
            self._add_dynamic_bus()
            return True
        return False
    
    def remove_bus_on_demand(self, bus_id):
        """Manually remove a bus (for frontend control)"""
        if bus_id in self.buses and self.buses[bus_id].get('is_dynamic'):
            self._remove_dynamic_bus(bus_id)
            return True
        return False
    
    def _make_intelligent_decision(self, bus):
        """Make intelligent decision for bus based on current situation and schedule"""
        current_stop = bus['current_stop']
        queue_length = len(self.passenger_demand.stop_queues.get(current_stop, []))
        occupancy_rate = len(bus['passengers']) / bus['capacity']
        
        # Calculate schedule adherence
        time_at_stop = self.simulation_time - bus.get('last_departure_time', 0)
        scheduled_wait_time = 30  # 30 seconds scheduled wait time
        
        if bus['state'] == 'AT_STOP':
            # Enhanced decision logic with schedule consideration
            if queue_length > 15:
                # Very high demand - board and depart immediately
                return 'DEPART_NOW'
            elif queue_length > 8 and occupancy_rate < 0.9:
                # High demand - board and depart quickly
                return 'DEPART_NOW'
            elif queue_length > 3 and occupancy_rate < 0.7:
                # Moderate demand - consider schedule
                if time_at_stop >= scheduled_wait_time:
                    return 'DEPART_NOW'
                else:
                    return 'WAIT_30'
            elif queue_length > 0 and occupancy_rate < 0.5:
                # Some demand - wait for more passengers or schedule
                if time_at_stop >= scheduled_wait_time * 1.5:
                    return 'DEPART_NOW'  # Don't wait too long
                else:
                    return 'WAIT_30'
            elif queue_length == 0 and time_at_stop >= scheduled_wait_time:
                # No demand but schedule says depart
                return 'DEPART_NOW'
            elif queue_length == 0 and occupancy_rate < 0.3:
                # No demand and low occupancy - wait for passengers
                return 'WAIT_30'
            else:
                # Default - depart if waited long enough
                return 'DEPART_NOW' if time_at_stop >= scheduled_wait_time else 'WAIT_30'
        else:
            # In transit - continue to destination
            return 'CONTINUE'
    
    def _get_observation_for_bus(self, bus_id):
        """
        Get observation for RL agent. Returns tuple format expected by Q-table:
        (queue_length, occupancy, time_since_last_bus, traffic_level)
        """
        bus = self.buses[bus_id]
        current_stop = bus['current_stop']

        queue_length = len(self.passenger_demand.stop_queues.get(current_stop, []))
        occupancy = len(bus['passengers']) / max(bus['capacity'], 1)

        # Time at current stop (proxy for time since last bus served this stop)
        if bus['state'] == 'AT_STOP':
            time_at_stop = self.simulation_time - bus.get('arrival_time', self.simulation_time)
        else:
            time_at_stop = 0

        # Traffic level: more buses in transit = busier roads
        buses_in_transit = sum(1 for b in self.buses.values() if b['state'] == 'IN_TRANSIT')
        traffic_level = min(1.0, 0.2 + 0.6 * (buses_in_transit / max(len(self.buses), 1)))

        return (queue_length, occupancy, time_at_stop, traffic_level)
    
    def get_state(self):
        """Get complete environment state"""
        return {
            'simulation_time': self.simulation_time,
            'buses': {bus_id: dict(bus) for bus_id, bus in self.buses.items()},
            'stops': {stop_id: len(queue) for stop_id, queue in self.passenger_demand.stop_queues.items()},
            'total_passengers_waiting': sum(len(queue) for queue in self.passenger_demand.stop_queues.values())
        }
    
    def get_statistics(self):
        """Get environment statistics"""
        total_passengers_on_buses = sum(len(bus['passengers']) for bus in self.buses.values())
        total_passengers_waiting = sum(len(queue) for queue in self.passenger_demand.stop_queues.values())
        total_capacity = sum(bus['capacity'] for bus in self.buses.values())
        
        # Calculate average occupancy
        average_occupancy = total_passengers_on_buses / total_capacity if total_capacity > 0 else 0
        
        return {
            'simulation_time': self.simulation_time,
            'total_passengers_served': self.passenger_demand.total_passengers_served,
            'total_waiting': total_passengers_waiting,  # Added for test compatibility
            'total_passengers_waiting': total_passengers_waiting,
            'total_passengers_on_buses': total_passengers_on_buses,
            'average_wait_time': self.passenger_demand.get_average_wait_time(),
            'average_bus_occupancy': average_occupancy,  # Added for test compatibility
            'num_buses': len(self.buses),
            'buses_at_stop': sum(1 for bus in self.buses.values() if bus['state'] == 'AT_STOP'),
            'buses_in_transit': sum(1 for bus in self.buses.values() if bus['state'] == 'IN_TRANSIT')
        }

# Create singleton instance
passenger_demand = PassengerDemand()
traffic_env = TrafficEnvironment()