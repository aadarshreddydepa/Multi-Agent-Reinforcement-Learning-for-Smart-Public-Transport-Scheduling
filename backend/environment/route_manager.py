"""
Route Manager - Handles bus routes, stops, and navigation
"""
import json
import math
from typing import List, Dict, Tuple
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import env_logger

class RouteManager:
    """Manages bus routes and stops"""
    
    def __init__(self):
        """Initialize route manager with stops and routes data"""
        self.stops = self._load_stops()
        self.routes = self._load_routes()
        env_logger.info(f"RouteManager initialized with {len(self.stops)} stops and {len(self.routes)} routes")
    
    def _load_stops(self) -> Dict:
        """Load stops from JSON file"""
        try:
            with open(Config.STOPS_FILE, 'r') as f:
                data = json.load(f)
                stops_dict = {stop['id']: stop for stop in data['stops']}
                env_logger.info(f"Loaded {len(stops_dict)} stops")
                return stops_dict
        except FileNotFoundError:
            env_logger.error(f"Stops file not found: {Config.STOPS_FILE}")
            return {}
        except Exception as e:
            env_logger.error(f"Error loading stops: {e}")
            return {}
    
    def _load_routes(self) -> Dict:
        """Load routes from JSON file"""
        try:
            with open(Config.ROUTES_FILE, 'r') as f:
                data = json.load(f)
                routes_dict = {route['id']: route for route in data['routes']}
                env_logger.info(f"Loaded {len(routes_dict)} routes")
                return routes_dict
        except FileNotFoundError:
            env_logger.error(f"Routes file not found: {Config.ROUTES_FILE}")
            return {}
        except Exception as e:
            env_logger.error(f"Error loading routes: {e}")
            return {}
    
    def get_stop(self, stop_id: str) -> Dict:
        """Get stop information by ID"""
        return self.stops.get(stop_id, None)
    
    def get_route(self, route_id: str) -> Dict:
        """Get route information by ID"""
        return self.routes.get(route_id, None)
    
    def get_stop_location(self, stop_id: str) -> Tuple[float, float]:
        """Get stop GPS coordinates (lat, lng)"""
        stop = self.get_stop(stop_id)
        if stop:
            return stop['location']['lat'], stop['location']['lng']
        return None, None
    
    def get_next_stop(self, route_id: str, current_stop_id: str) -> str:
        """Get the next stop in the route"""
        route = self.get_route(route_id)
        if not route:
            return None
        
        stops = route['stops']
        try:
            current_index = stops.index(current_stop_id)
            next_index = (current_index + 1) % len(stops)  # Circular route
            return stops[next_index]
        except ValueError:
            env_logger.error(f"Stop {current_stop_id} not found in route {route_id}")
            return None
    
    def get_route_stops(self, route_id: str) -> List[str]:
        """Get all stops in a route"""
        route = self.get_route(route_id)
        return route['stops'] if route else []
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        # Haversine formula
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        distance = R * c
        return distance
    
    def calculate_travel_time(self, from_stop_id: str, to_stop_id: str) -> float:
        """
        Calculate travel time between two stops in seconds
        Based on distance and average speed
        """
        lat1, lng1 = self.get_stop_location(from_stop_id)
        lat2, lng2 = self.get_stop_location(to_stop_id)
        
        if None in [lat1, lng1, lat2, lng2]:
            return 0
        
        distance_km = self.calculate_distance(lat1, lng1, lat2, lng2)
        
        # Convert average speed from km/h to km/s, then calculate time
        speed_km_per_second = Config.AVERAGE_SPEED / 3600
        travel_time_seconds = distance_km / speed_km_per_second
        
        return travel_time_seconds
    
    def get_stop_capacity(self, stop_id: str) -> int:
        """Get maximum passenger capacity for a stop"""
        stop = self.get_stop(stop_id)
        return stop['capacity'] if stop else 0
    
    def is_peak_hour(self, stop_id: str, current_time: str) -> bool:
        """
        Check if current time is peak hour for a stop
        current_time format: "HH:MM"
        """
        stop = self.get_stop(stop_id)
        if not stop or 'peak_demand_hours' not in stop:
            return False
        
        # Parse current time
        try:
            current_hour, current_minute = map(int, current_time.split(':'))
            current_total_minutes = current_hour * 60 + current_minute
            
            # Check each peak period
            for period in stop['peak_demand_hours']:
                start_time, end_time = period.split('-')
                start_hour, start_minute = map(int, start_time.split(':'))
                end_hour, end_minute = map(int, end_time.split(':'))
                
                start_total = start_hour * 60 + start_minute
                end_total = end_hour * 60 + end_minute
                
                if start_total <= current_total_minutes <= end_total:
                    return True
            
            return False
        except Exception as e:
            env_logger.error(f"Error checking peak hour: {e}")
            return False
    
    def get_all_stops_info(self) -> List[Dict]:
        """Get information for all stops (for frontend)"""
        return list(self.stops.values())
    
    def get_all_routes_info(self) -> List[Dict]:
        """Get information for all routes (for frontend)"""
        return list(self.routes.values())
    
    def interpolate_position(self, from_stop_id: str, to_stop_id: str, progress: float) -> Tuple[float, float]:
        """
        Calculate intermediate GPS position between two stops
        progress: 0.0 to 1.0 (0 = at from_stop, 1 = at to_stop)
        Returns: (lat, lng)
        """
        lat1, lng1 = self.get_stop_location(from_stop_id)
        lat2, lng2 = self.get_stop_location(to_stop_id)
        
        if None in [lat1, lng1, lat2, lng2]:
            return None, None
        
        # Linear interpolation
        lat = lat1 + (lat2 - lat1) * progress
        lng = lng1 + (lng2 - lng1) * progress
        
        return lat, lng

# Create singleton instance
route_manager = RouteManager()