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
        multiplier = 4.0 if is_peak else 1.0 # Increased from 3.0
        
        # Calculate expected number of passengers
        arrival_rate = base_rate * multiplier
        expected_passengers = arrival_rate * delta_time
        
        # Use Poisson distribution for realistic arrivals
        num_new_passengers = np.random.poisson(expected_passengers)
        
        # Add some randomness (±20%)
        randomness = random.uniform(0.8, 1.2)
        
        # FIX: Use round() instead of int() to avoid 0.9 becoming 0
        num_new_passengers = int(round(num_new_passengers * randomness))
        
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
            env_logger.info(f"Generated {num_new_passengers} passengers at {stop_id} (peak={is_peak}, queue={len(self.stop_queues[stop_id])})")
        
        return num_new_passengers
    
    def _create_passenger(self, stop_id: str, arrival_time: str) -> Dict:
        """Create a passenger object"""
        self.passenger_id_counter += 1
        
        # Select random destination from all stops except the origin
        all_stop_ids = list(route_manager.stops.keys())
        destination = stop_id
        if len(all_stop_ids) > 1:
            possible_destinations = [s for s in all_stop_ids if s != stop_id]
            destination = random.choice(possible_destinations)
        
        return {
            'id': f'passenger_{self.passenger_id_counter}',
            'stop_id': stop_id,
            'arrival_time': arrival_time,
            'wait_time': 0,
            'destination': destination,
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
            env_logger.info(f"Boarded {len(boarded)} passengers at {stop_id}. Remaining in queue: {len(self.stop_queues[stop_id])}")
        
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
        """
        Generate passengers at all stops. Called each simulation step.
        Returns total passengers generated.
        """
        total = 0
        for stop_id in self.stop_queues.keys():
            total += self.generate_passengers(stop_id, current_time, delta_time)
        return total

# Create singleton instance
passenger_demand = PassengerDemand()