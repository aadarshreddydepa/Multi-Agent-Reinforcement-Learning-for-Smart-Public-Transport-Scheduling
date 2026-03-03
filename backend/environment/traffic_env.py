"""
Traffic Environment - Main simulation logic
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
from environment.passenger_demand import passenger_demand

class TrafficEnvironment:
    """Main traffic environment for bus simulation with intelligent movement"""
    
    def __init__(self):
        """Initialize traffic environment"""
        self.buses = {}
        self.simulation_time = 0.0
        self.passenger_demand = passenger_demand
        self.route_manager = route_manager
        self.bus_routes = {}  # Track each bus's route progress
        self.dynamic_buses = []  # List of dynamically added buses
        self.demand_threshold = 12  # Total passengers waiting to trigger new bus
        self.demand_threshold_per_stop = 8  # High demand at single stop
        self.max_buses = 20  # Maximum buses allowed (increased for manual addition)
        self._last_bus_add_time = -999  # Cooldown for adding buses
        self.agents = {}  # Store agents bound to buses
        self.agents_initialized = False
        self.simulation_running = False
        env_logger.info("TrafficEnvironment initialized")

    def reset(self, preserve_fleet=False):
        """Reset the environment state"""
        self.simulation_time = 0
        self.is_running = True
        self.passenger_demand.reset()
        self._last_bus_add_time = -999

        if preserve_fleet and self.buses:
            env_logger.info("Preserving current bus fleet during reset")
            # Reset existing buses to initial states
            for bus_id, bus in self.buses.items():
                route = self.route_manager.get_route(bus['route_id'])
                if not route: continue
                first_stop_id = route['stops'][0]
                first_stop = self.route_manager.get_stop(first_stop_id)
                loc = first_stop['location'] if first_stop else {'lat': 17.3850, 'lng': 78.4867}
                
                bus.update({
                    'state': 'AT_STOP',
                    'current_stop': first_stop_id,
                    'current_stop_index': 0,
                    'passengers': [],
                    'position': {'lat': loc['lat'], 'lng': loc['lng']},
                    'total_served': 0,
                    'last_departure_time': 0,
                    'route_progress': 0.0
                })
                self.bus_routes[bus_id].update({
                    'current_index': 0,
                    'target_index': 1,
                    'progress': 0.0
                })
            return self.get_state()

        # Full reset: Create buses for each defined route
        self.buses = {}
        self.bus_routes = {}
        self.dynamic_buses = []

        # Get actual defined routes from route_manager
        defined_routes = list(route_manager.routes.keys())
        if not defined_routes:
            env_logger.warning("No routes defined in route_manager")
            return self.get_state()

        # Create buses for each defined route
        bus_id = 1
        for route_id in defined_routes:
            route = route_manager.get_route(route_id)
            if not route or 'stops' not in route or len(route['stops']) == 0:
                continue
                
            first_stop_id = route['stops'][0]
            first_stop = self.route_manager.stops.get(first_stop_id, {
                'location': {'lat': 17.3850 + (bus_id * 0.01), 'lng': 78.4867 + (bus_id * 0.01)}
            })
            if isinstance(first_stop.get('location'), dict):
                loc = first_stop['location']
            else:
                loc = {'lat': 17.3850, 'lng': 78.4867}

            bus = {
                'id': f'bus_{bus_id}',
                'route_id': route_id,  # Use actual route ID
                'assigned_route': route['stops'],
                'route_color': route.get('color', '#3B82F6'),
                'current_stop_index': 0,
                'current_stop': first_stop_id,
                'capacity': Config.BUS_CAPACITY,
                'passengers': [],
                'state': 'AT_STOP',
                'position': {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)},
                'total_served': 0,
                'speed': 0.08,
                'last_departure_time': 0,
                'arrival_time': 0,
                'schedule_adherence': 0,
                'total_distance': 0,
                'average_speed': 0
            }
            self.buses[bus['id']] = bus

            self.bus_routes[bus['id']] = {
                'route': route, 
                'current_index': 0, 
                'target_index': 1, 
                'progress': 0.0,
                'direction': 1,
                'color': route.get('color', '#3B82F6')
            }
            bus_id += 1

        env_logger.info(f"Environment reset with {len(self.buses)} buses on {len(self.route_manager.stops)} stops")
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
        self.update_positions()

        # Manage dynamic buses based on demand
        self._manage_dynamic_buses()

        # Summary log every 10 steps
        if self.simulation_time % 10 == 0:
            stats = self.get_statistics()
            env_logger.info(f"SIM STATUS: Wait={stats['total_waiting']}, OnBoard={stats['total_passengers_on_buses']}, Served={stats['total_passengers_served']}")

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
        
        # Always deboard passengers reaching their destination when at a stop
        deboarded_count = 0
        if bus['state'] == 'AT_STOP':
            deboarded_count = self._deboard_passengers(bus)

        queue_before = len(self.passenger_demand.stop_queues.get(current_stop, []))
        time_at_stop = self.simulation_time - bus.get('arrival_time', self.simulation_time) if bus['state'] == 'AT_STOP' else 0
        
        boarded_count = 0
        if action in ['DEPART_NOW', 'WAIT_30', 'WAIT_60']:
            available_space = bus['capacity'] - len(bus['passengers'])
            if queue_before > 0 and available_space > 0:
                num_to_board = min(queue_before, available_space)
                boarded = self.passenger_demand.board_passengers(current_stop, num_to_board)
                bus['passengers'].extend(boarded)
                bus['total_served'] = bus.get('total_served', 0) + len(boarded)
                boarded_count = len(boarded)
            
            if action == 'DEPART_NOW':
                bus['state'] = 'IN_TRANSIT'
                self._set_next_destination(bus)
        
        elif action == 'SKIP_STOP':
            if queue_before > 0:
                env_logger.info(f"Bus {bus['id']} skipped stop {current_stop} despite {queue_before} passengers waiting")
            bus['state'] = 'IN_TRANSIT'
            self._set_next_destination(bus)

        # Calculate reward
        queue_after = len(self.passenger_demand.stop_queues.get(current_stop, []))
        occupancy = len(bus['passengers']) / max(bus['capacity'], 1)
        
        # Map wait actions to dwell times for reward calculation
        dwell_time = 0
        if action == 'WAIT_30': dwell_time = 30
        elif action == 'WAIT_60': dwell_time = 60
        elif action == 'DEPART_NOW' and time_at_stop > 0: dwell_time = time_at_stop
        
        reward = reward_calculator.calculate_reward(action, boarded_count, queue_before, queue_after, occupancy, dwell_time)

        # Log load details as requested
        env_logger.info(
            f"LOG: bus_id={bus['id']}, current_load={len(bus['passengers'])}, capacity={bus['capacity']}, "
            f"boarded={boarded_count}, deboarded={deboarded_count}, stop={current_stop}"
        )

        return reward

    def _deboard_passengers(self, bus):
        """Unload passengers whose destination is the current stop"""
        current_stop = bus['current_stop']
        passengers_before = len(bus['passengers'])
        
        # Keep passengers who haven't reached their destination
        bus['passengers'] = [p for p in bus['passengers'] if p.get('destination') != current_stop]
        
        deboarded_count = passengers_before - len(bus['passengers'])
        if deboarded_count > 0:
            env_logger.info(f"Bus {bus['id']} DEBOARDED {deboarded_count} at {current_stop}")
            
        return deboarded_count
    
    def _set_next_destination(self, bus):
        """Set next destination for bus based on its assigned route"""
        route_info = self.bus_routes[bus['id']]
        current_index = route_info['current_index']
        route = route_info['route']
        stops = route['stops']
        
        # Calculate next stop index based on direction
        if route_info['direction'] == 1:
            next_index = (current_index + 1) % len(stops)
            if next_index == 0:  # Reached end, reverse direction
                route_info['direction'] = -1
                next_index = current_index - 1
        else:
            next_index = current_index - 1
            if next_index < 0:  # Reached start, reverse direction
                route_info['direction'] = 1
                next_index = 1
        
        # Ensure next_index is valid
        next_index = max(0, min(next_index, len(stops) - 1))
        next_stop = stops[next_index]
        
        # Update route tracking
        route_info['target_index'] = next_index
        route_info['progress'] = 0.0
        
        bus['current_stop_index'] = current_index
        bus['next_stop'] = next_stop
        bus['last_departure_time'] = self.simulation_time
        
        env_logger.debug(f"Bus {bus['id']} heading from {stops[current_index]} to {next_stop}")
    
    def update_positions(self):
        """Update bus positions with smooth transitions"""
        for bus_id, bus in self.buses.items():
            if bus['state'] == 'IN_TRANSIT':
                route_info = self.bus_routes.get(bus_id)
                if route_info:
                    # Update progress towards next stop
                    base_speed = bus.get('speed', 0.08)
                    traffic_factor = np.random.uniform(0.5, 1.2)
                    
                    # Peak hour congestion
                    now_str = datetime.now().strftime("%H:%M")
                    if self.route_manager.is_peak_hour(bus['current_stop'], now_str):
                        traffic_factor *= 0.7
                        
                    distance_factor = base_speed * 0.1 * traffic_factor
                    route_info['progress'] += float(distance_factor)
                    
                    if route_info['progress'] >= 1.0:
                        # Arrived at next stop
                        route = route_info['route']
                        stops = route['stops']
                        
                        route_info['current_index'] = route_info['target_index']
                        route_info['target_index'] = (route_info['current_index'] + route_info['direction']) % len(stops)
                        
                        bus['current_stop_index'] = route_info['current_index']
                        bus['current_stop'] = stops[bus['current_stop_index']]
                        bus['state'] = 'AT_STOP'
                        bus['arrival_time'] = self.simulation_time
                        route_info['progress'] = 0.0

                        # Update position to exact stop coordinates
                        stop_data = self.route_manager.stops.get(bus['current_stop'], {})
                        loc = stop_data.get('location', {'lat': 17.3850, 'lng': 78.4867})
                        bus['position'] = {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)}
                        env_logger.debug(f"Bus {bus_id} arrived at {bus['current_stop']}")
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
        stops = route['stops']
        current_stop_id = stops[current_index]
        target_stop_id = stops[target_index]
        
        def _get_coords(stop_id, idx):
            s = self.route_manager.stops.get(stop_id, {})
            loc = s.get('location', {'lat': 17.3850 + idx * 0.01, 'lng': 78.4867 + idx * 0.01})
            return loc.get('lat', 17.3850), loc.get('lng', 78.4867)

        lat1, lng1 = _get_coords(current_stop_id, current_index)
        lat2, lng2 = _get_coords(target_stop_id, target_index)
        progress = route_info['progress']
        eased = self._ease_in_out_cubic(progress)
        bus['position'] = {
            'lat': float(lat1 + (lat2 - lat1) * eased),
            'lng': float(lng1 + (lng2 - lng1) * eased)
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
        
        # Get a random route from the defined routes
        defined_routes = list(self.route_manager.routes.keys())
        if not defined_routes:
            return
            
        import random
        route_id = random.choice(defined_routes)
        route = self.route_manager.get_route(route_id)
        
        if not route or 'stops' not in route:
            return
            
        first_stop_id = route['stops'][0]
        first_stop = self.route_manager.stops.get(first_stop_id, {})
        loc = first_stop.get('location', {'lat': 17.3850, 'lng': 78.4867})

        new_bus = {
            'id': bus_id,
            'route_id': route_id,
            'assigned_route': route['stops'],
            'route_color': route.get('color', '#ef4444'),
            'state': 'AT_STOP',
            'current_stop': first_stop_id,
            'passengers': [],
            'capacity': Config.BUS_CAPACITY,
            'position': {'lat': loc.get('lat', 17.3850), 'lng': loc.get('lng', 78.4867)},
            'arrival_time': self.simulation_time,
            'total_served': 0,
            'speed': 0.08,
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
    
    def apply_action(self, bus_id, action_name):
        """Apply individual action to a specific bus"""
        if bus_id in self.buses:
            return self._execute_bus_action(self.buses[bus_id], action_name)
        return 0

    def update_passengers(self):
        """Update passenger demand for the whole network"""
        self.passenger_demand.generate_passengers_all(delta_time=1.0)
        self.passenger_demand.update_wait_times(1.0)

    def serialize(self):
        """Serialize current state to dictionary for WebSocket/API"""
        return self.get_state()

    def get_state_for_bus(self, bus_id):
        """Get processed state/observation for an individual bus agent"""
        return self._get_observation_for_bus(bus_id)

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
# Singleton instance already imported
traffic_env = TrafficEnvironment()