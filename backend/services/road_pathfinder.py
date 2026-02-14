"""
Road Pathfinder Service - Provides road-based routing for buses
Uses OpenStreetMap data and realistic road networks
"""
import requests
import json
import math
from typing import List, Tuple, Dict, Optional
from utils.logger import env_logger

class RoadPathfinder:
    """Service for finding road-based paths between bus stops"""
    
    def __init__(self):
        self.base_url = "https://router.project-osrm.org"
        self.cache = {}  # Cache for route calculations
        
    def calculate_road_distance(self, start_lat: float, start_lng: float, 
                              end_lat: float, end_lng: float) -> Dict:
        """
        Calculate road-based distance and path between two points using OSRM
        """
        cache_key = f"{start_lat},{start_lng}_{end_lat},{end_lng}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # OSRM API call for routing
            url = f"{self.base_url}/route/v1/driving/{start_lng},{start_lat};{end_lng},{end_lat}"
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'alternatives': 'false'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data['routes'] and len(data['routes']) > 0:
                    route = data['routes'][0]
                    result = {
                        'distance': route['distance'],  # meters
                        'duration': route['duration'],  # seconds
                        'geometry': route['geometry'],  # path coordinates
                        'coordinates': route['geometry']['coordinates']
                    }
                    self.cache[cache_key] = result
                    return result
            else:
                env_logger.error(f"OSRM API error: {response.status_code}")
                
        except Exception as e:
            env_logger.error(f"Error calculating road distance: {e}")
        
        # Fallback to straight-line distance
        return self._calculate_straight_line_distance(start_lat, start_lng, end_lat, end_lng)
    
    def _calculate_straight_line_distance(self, start_lat: float, start_lng: float,
                                        end_lat: float, end_lng: float) -> Dict:
        """Calculate straight-line distance as fallback"""
        distance = self._haversine_distance(start_lat, start_lng, end_lat, end_lng)
        return {
            'distance': distance,
            'duration': distance / 8.33 * 1000,  # Assuming 30 km/h average speed
            'geometry': {
                'type': 'LineString',
                'coordinates': [[start_lng, start_lat], [end_lng, end_lat]]
            },
            'coordinates': [[start_lng, start_lat], [end_lng, end_lat]]
        }
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance between two points"""
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def get_route_path(self, stop_ids: List[str], stops_data: Dict) -> List[Tuple[float, float]]:
        """
        Get complete route path with intermediate road coordinates
        """
        full_path = []
        
        for i in range(len(stop_ids) - 1):
            start_stop = stops_data.get(stop_ids[i])
            end_stop = stops_data.get(stop_ids[i + 1])
            
            if not start_stop or not end_stop:
                continue
            
            start_loc = start_stop.get('location', {})
            end_loc = end_stop.get('location', {})
            
            if not start_loc or not end_loc:
                continue
            
            # Get road path between stops
            route_info = self.calculate_road_distance(
                start_loc['lat'], start_loc['lng'],
                end_loc['lat'], end_loc['lng']
            )
            
            # Add coordinates (convert from [lng, lat] to [lat, lng])
            coordinates = route_info.get('coordinates', [])
            for coord in coordinates:
                full_path.append((coord[1], coord[0]))  # Convert to lat, lng
        
        return full_path
    
    def interpolate_path_points(self, path: List[Tuple[float, float]], 
                             num_points: int = 50) -> List[Tuple[float, float]]:
        """
        Interpolate additional points along the path for smooth bus movement
        """
        if len(path) < 2:
            return path
        
        interpolated = []
        total_segments = len(path) - 1
        points_per_segment = max(1, num_points // total_segments)
        
        for i in range(total_segments):
            start = path[i]
            end = path[i + 1]
            
            # Add start point (except for first segment)
            if i == 0:
                interpolated.append(start)
            
            # Interpolate points between start and end
            for j in range(1, points_per_segment):
                t = j / points_per_segment
                lat = start[0] + t * (end[0] - start[0])
                lng = start[1] + t * (end[1] - start[1])
                interpolated.append((lat, lng))
        
        # Add final point
        interpolated.append(path[-1])
        
        return interpolated

# Global instance
road_pathfinder = RoadPathfinder()
