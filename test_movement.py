import requests
import time
import json

BASE_URL = 'http://localhost:5001/api'

def main():
    print("Starting movement verification...")
    
    # 1. Start Simulation
    try:
        print("Starting simulation...")
        requests.post(f'{BASE_URL}/simulation/start', json={'use_trained': False}, timeout=5)
    except Exception as e:
        print(f"Failed to start simulation: {e}")
        return

    # 2. Poll for movement
    print("Polling for movement (10 seconds)...")
    initial_positions = {}
    
    for i in range(10):
        try:
            response = requests.get(f'{BASE_URL}/buses', timeout=2)
            data = response.json()
            buses = data.get('buses', [])
            
            print(f"\nTick {i+1}: Found {len(buses)} buses")
            
            for bus in buses:
                bus_id = bus['id']
                pos = bus.get('position', {})
                lat = pos.get('lat')
                lng = pos.get('lng')
                state = bus.get('state')
                
                prev = initial_positions.get(bus_id)
                
                if prev:
                    if float(lat) != float(prev['lat']) or float(lng) != float(prev['lng']):
                        print(f"  Bus {bus_id} MOVED! {prev['lat']},{prev['lng']} -> {lat},{lng} ({state})")
                    else:
                        print(f"  Bus {bus_id} static at {lat},{lng} ({state})")
                else:
                    print(f"  Bus {bus_id} initial at {lat},{lng} ({state})")
                
                initial_positions[bus_id] = {'lat': lat, 'lng': lng}
                
        except Exception as e:
            print(f"Error polling: {e}")
            
        time.sleep(1)

    # 3. Stop Simulation
    try:
        print("\nStopping simulation...")
        requests.post(f'{BASE_URL}/simulation/stop', timeout=5)
    except Exception as e:
        print(f"Failed to stop: {e}")

if __name__ == "__main__":
    main()
