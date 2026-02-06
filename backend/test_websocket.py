"""
Test WebSocket Client - Verify real-time updates
"""
import socketio
import time

# Create Socket.IO client
sio = socketio.Client()

# Event counters
state_updates = 0
stats_updates = 0

@sio.on('connect')
def on_connect():
    """Handle connection"""
    print("\n✓ Connected to backend WebSocket")
    print("Listening for real-time updates...")

@sio.on('disconnect')
def on_disconnect():
    """Handle disconnection"""
    print("\n✗ Disconnected from backend")

@sio.on('connection_response')
def on_connection_response(data):
    """Handle connection response"""
    print(f"\nServer response: {data['message']}")

@sio.on('state_update')
def on_state_update(data):
    """Handle state update"""
    global state_updates
    state_updates += 1
    
    if state_updates % 5 == 0:  # Print every 5th update
        print(f"\n[State Update #{state_updates}]")
        print(f"  Simulation time: {data['simulation_time']:.1f}s")
        print(f"  Active buses: {len(data['buses'])}")
        
        # Show first bus
        if data['buses']:
            bus_id = list(data['buses'].keys())[0]
            bus = data['buses'][bus_id]
            print(f"  {bus_id}: {bus['state']} at {bus['current_stop']}")

@sio.on('statistics_update')
def on_statistics_update(data):
    """Handle statistics update"""
    global stats_updates
    stats_updates += 1
    
    if stats_updates % 10 == 0:  # Print every 10th update
        print(f"\n[Statistics Update #{stats_updates}]")
        print(f"  Passengers served: {data['total_passengers_served']}")
        print(f"  Currently waiting: {data['total_waiting']}")
        print(f"  Average wait: {data['average_wait_time']:.1f}s")

@sio.on('training_complete')
def on_training_complete(data):
    """Handle training complete"""
    print(f"\n✓ {data['message']}")

@sio.on('training_error')
def on_training_error(data):
    """Handle training error"""
    print(f"\n✗ Training error: {data['message']}")

def test_websocket():
    """Test WebSocket connection"""
    print("\n" + "="*60)
    print("TESTING WEBSOCKET CONNECTION")
    print("="*60)
    
    try:
        # Connect to backend
        print("\nConnecting to http://localhost:5000...")
        sio.connect('http://localhost:5000')
        
        # Wait for initial connection
        time.sleep(1)
        
        print("\nWebSocket connected! Monitoring for 15 seconds...")
        print("(Start simulation from another terminal or via API)")
        print("-" * 60)
        
        # Monitor for 15 seconds
        start_time = time.time()
        while time.time() - start_time < 15:
            time.sleep(1)
        
        print("\n" + "-" * 60)
        print(f"\nReceived {state_updates} state updates")
        print(f"Received {stats_updates} statistics updates")
        
        if state_updates > 0 and stats_updates > 0:
            print("\n✓ WebSocket working perfectly!")
        elif state_updates == 0:
            print("\n⚠ No state updates received")
            print("  Make sure simulation is running!")
        
        # Disconnect
        sio.disconnect()
        
        print("\n" + "="*60)
        print("WebSocket test complete")
        print("="*60 + "\n")
    
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\nMake sure backend is running first!")
    print("In another terminal: cd backend && python app.py\n")
    
    input("Press Enter when backend is running...")
    
    try:
        test_websocket()
    except socketio.exceptions.ConnectionError:
        print("\n✗ ERROR: Could not connect to backend")
        print("Make sure backend is running on http://localhost:5000")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")