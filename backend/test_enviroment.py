"""
Test script for environment simulation
Run this to verify everything is working
"""
import sys
import os
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from environment.traffic_env import traffic_env
from environment.route_manager import route_manager
from environment.passenger_demand import passenger_demand
from utils.config import Config

def test_route_manager():
    """Test route manager functionality"""
    print("\n=== Testing Route Manager ===")
    
    # Test loading routes and stops
    print(f"Loaded {len(route_manager.routes)} routes")
    print(f"Loaded {len(route_manager.stops)} stops")
    
    # Test route navigation
    # Test route navigation
    route_id = "route_15"
    stops = route_manager.get_route_stops(route_id)
    print(f"\nRoute 15 stops: {stops}")
    
    # Test next stop calculation
    if stops:
        current_stop = stops[0]
        next_stop = route_manager.get_next_stop(route_id, current_stop)
        print(f"Next stop after {current_stop}: {next_stop}")
    
    # Test distance calculation
    if len(stops) >= 2:
        lat1, lng1 = route_manager.get_stop_location(stops[0])
        lat2, lng2 = route_manager.get_stop_location(stops[1])
        distance = route_manager.calculate_distance(lat1, lng1, lat2, lng2)
        travel_time = route_manager.calculate_travel_time(stops[0], stops[1])
        print(f"\nDistance {stops[0]} → {stops[1]}: {distance:.3f} km")
        print(f"Travel time: {travel_time:.1f} seconds")
    
    print("Route Manager working!")

def test_passenger_demand():
    """Test passenger demand generation"""
    print("\n=== Testing Passenger Demand ===")
    
    # Reset
    passenger_demand.reset()
    
    # Generate passengers
    stop_id = "uppal_depot" # Changed from main_gate
    num_generated = passenger_demand.generate_passengers(stop_id, "08:00", delta_time=10)
    print(f"\nGenerated {num_generated} passengers at {stop_id} (rush hour)")
    
    num_generated = passenger_demand.generate_passengers(stop_id, "14:00", delta_time=10)
    print(f"Generated {num_generated} passengers at {stop_id} (off-peak)")
    
    # Check queue
    queue_length = passenger_demand.get_queue_length(stop_id)
    print(f"Queue length at {stop_id}: {queue_length}")
    
    # Board some passengers
    boarded = passenger_demand.board_passengers(stop_id, 5)
    print(f"Boarded {len(boarded)} passengers")
    
    # Check statistics
    stats = passenger_demand.get_statistics()
    print(f"\nPassenger Statistics:")
    print(f"  Total generated: {stats['total_generated']}")
    print(f"  Total served: {stats['total_served']}")
    print(f"  Total waiting: {stats['total_waiting']}")
    
    print("Passenger Demand working!")

def test_traffic_environment():
    """Test complete traffic environment"""
    print("\n=== Testing Traffic Environment ===")
    
    # Reset environment
    state = traffic_env.reset()
    print(f"\nEnvironment reset with {len(state['buses'])} buses")
    
    # Print initial bus positions
    for bus_id, bus_info in state['buses'].items():
        print(f"\n{bus_id}:")
        print(f"  Position: {bus_info['current_stop']}")
        print(f"  GPS: ({bus_info['position']['lat']:.4f}, {bus_info['position']['lng']:.4f})")
    
    # Simulate a few steps
    print("\n=== Simulating 5 steps ===")
    for i in range(5):
        # All buses take DEPART_NOW action
        actions = {bus_id: 'DEPART_NOW' for bus_id in traffic_env.buses.keys()}
        
        observations, rewards, done = traffic_env.step(actions)
        
        print(f"\nStep {i+1}:")
        for bus_id, reward in rewards.items():
            bus = traffic_env.buses[bus_id]
            print(f"  {bus_id}: {bus['state']} | Reward: {reward:.1f} | Passengers: {len(bus['passengers'])}")
        
        # Small delay to see movement
        time.sleep(0.5)
    
    # Get final statistics
    stats = traffic_env.get_statistics()
    print(f"\n=== Final Statistics ===")
    print(f"Simulation time: {stats['simulation_time']:.1f}s")
    print(f"Total passengers served: {stats['total_passengers_served']}")
    print(f"Total waiting: {stats['total_waiting']}")
    print(f"Average wait time: {stats['average_wait_time']:.1f}s")
    print(f"Average bus occupancy: {stats['average_bus_occupancy']:.1%}")
    
    print("\nTraffic Environment working!")

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*50)
    print("SMART BUS MARL - ENVIRONMENT TEST SUITE")
    print("="*50)
    
    try:
        test_route_manager()
        test_passenger_demand()
        test_traffic_environment()
        
        print("\n" + "="*50)
        print("ALL TESTS PASSED!")
        print("="*50)
        print("\nEnvironment is ready for RL agent integration!")
        
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()