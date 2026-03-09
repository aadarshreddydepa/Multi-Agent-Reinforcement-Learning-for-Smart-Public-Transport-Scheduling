
import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.road_pathfinder import road_pathfinder
from environment.route_manager import route_manager

def preload_road_cache():
    print("🚀 Starting road cache pre-load...")
    routes = route_manager.get_all_routes_info()
    print(f"Found {len(routes)} routes to process.")
    
    for route in routes:
        route_id = route['id']
        stops = route['stops']
        print(f"Processing {route_id} ({len(stops)} stops)...")
        
        # This will trigger OSRM calls and save to disk cache
        path = road_pathfinder.get_route_path(stops, route_manager.stops)
        print(f"✅ Finished {route_id}, path length: {len(path)}")
    
    print("✨ Road cache pre-load complete!")

if __name__ == "__main__":
    preload_road_cache()
