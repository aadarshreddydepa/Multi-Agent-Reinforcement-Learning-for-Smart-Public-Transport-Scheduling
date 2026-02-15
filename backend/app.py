"""
Flask Backend API for Smart Bus MARL
Real-time communication via REST API and WebSocket
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import os
import sys

# Add paths for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.config import Config
from utils.logger import system_logger
from environment.traffic_env import traffic_env
from environment.route_manager import route_manager
from environment.passenger_demand import passenger_demand
from agents.bus_agent import BusAgent, coordinator
from models.training import trainer

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'smart-bus-marl-secret-key'

# Enable CORS
CORS(app, resources={r"/*": {"origins": Config.CORS_ORIGINS}})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS, async_mode='threading')

# Global state
simulation_running = False
simulation_thread = None
agents_initialized = False

# Statistics tracking
stats_history = []

system_logger.info("Flask app initialized")

# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'Smart Bus MARL Backend API',
        'version': '1.0.0'
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status"""
    return jsonify({
        'simulation_running': simulation_running,
        'agents_initialized': agents_initialized,
        'num_buses': len(traffic_env.buses),
        'num_agents': len(coordinator.agents),
        'simulation_time': traffic_env.simulation_time
    })

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get system configuration"""
    return jsonify({
        'num_buses': Config.NUM_BUSES,
        'num_routes': Config.NUM_ROUTES,
        'bus_capacity': Config.BUS_CAPACITY,
        'simulation_speed': Config.SIMULATION_SPEED,
        'update_interval': Config.UPDATE_INTERVAL,
        'actions': Config.ACTIONS,
        'map_center': Config.MAP_CENTER
    })

@app.route('/api/routes', methods=['GET'])
def get_routes():
    """Get all route information"""
    return jsonify({
        'routes': route_manager.get_all_routes_info()
    })

@app.route('/api/routes/road-paths', methods=['GET'])
def get_road_paths():
    """Get road-based route paths with real coordinates"""
    try:
        routes = route_manager.get_all_routes_info()
        road_paths = {}
        
        for route in routes:
            route_id = route['id']
            stops = route['stops']
            
            # Get road path using the pathfinder
            road_path = route_manager.get_road_path(route_id)
            if road_path:
                road_paths[route_id] = {
                    'stops': stops,
                    'path': road_path,
                    'color': route.get('color', '#3B82F6')
                }
        
        return jsonify({
            'success': True,
            'road_paths': road_paths
        })
        
    except Exception as e:
        system_logger.error(f"Error getting road paths: {e}")
        return jsonify({
            'success': False,
            'message': f'Error getting road paths: {str(e)}'
        }), 500

@app.route('/api/stops', methods=['GET'])
def get_stops():
    """Get all stop information"""
    return jsonify({
        'stops': route_manager.get_all_stops_info()
    })

@app.route('/api/state', methods=['GET'])
def get_state():
    """Get complete current state"""
    state = traffic_env.get_state()
    return jsonify(state)

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get current statistics"""
    stats = traffic_env.get_statistics()
    
    # Add agent statistics if initialized
    if agents_initialized:
        agent_stats = coordinator.get_statistics()
        stats['agents'] = agent_stats
    
    return jsonify(stats)

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """Start the simulation"""
    global simulation_running, simulation_thread, agents_initialized
    
    if simulation_running:
        return jsonify({
            'success': False,
            'message': 'Simulation already running'
        }), 400
    
    try:
        # Get optional parameters
        data = request.get_json() or {}
        use_trained_agents = data.get('use_trained_agents', False)
        
        # Initialize agents if not already done
        if not agents_initialized:
            initialize_agents(use_trained=use_trained_agents)
        
        # Reset environment
        traffic_env.reset()
        
        # Start simulation thread
        simulation_running = True
        simulation_thread = threading.Thread(target=simulation_loop, daemon=True)
        simulation_thread.start()
        
        system_logger.info("Simulation started")
        
        return jsonify({
            'success': True,
            'message': 'Simulation started',
            'use_trained_agents': use_trained_agents
        })
    
    except Exception as e:
        system_logger.error(f"Error starting simulation: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/simulation/stop', methods=['POST'])
def stop_simulation():
    """Stop the simulation"""
    global simulation_running
    
    if not simulation_running:
        return jsonify({
            'success': False,
            'message': 'Simulation not running'
        }), 400
    
    simulation_running = False
    
    system_logger.info("Simulation stopped")
    
    return jsonify({
        'success': True,
        'message': 'Simulation stopped'
    })

@app.route('/api/simulation/reset', methods=['POST'])
def reset_simulation():
    """Reset the simulation"""
    global simulation_running
    
    # Stop if running
    was_running = simulation_running
    simulation_running = False
    
    # Wait for simulation thread to stop
    if simulation_thread and simulation_thread.is_alive():
        time.sleep(0.5)
    
    # Reset environment and agents
    traffic_env.reset()
    
    if agents_initialized:
        for agent in coordinator.agents.values():
            agent.reset()
    
    system_logger.info("Simulation reset")
    
    return jsonify({
        'success': True,
        'message': 'Simulation reset',
        'was_running': was_running
    })

@app.route('/api/buses/add', methods=['POST'])
def add_bus():
    """Add a new bus to handle increased demand"""
    try:
        success = traffic_env.add_bus_on_demand()
        
        if success:
            system_logger.info("Manual bus added via API")
            return jsonify({
                'success': True,
                'message': 'Bus added successfully',
                'total_buses': len(traffic_env.buses)
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Maximum bus limit reached or insufficient demand'
            }), 400
            
    except Exception as e:
        system_logger.error(f"Error adding bus: {e}")
        return jsonify({
            'success': False,
            'message': f'Error adding bus: {str(e)}'
        }), 500

@app.route('/api/buses/<bus_id>/remove', methods=['DELETE'])
def remove_bus(bus_id):
    """Remove a dynamic bus"""
    try:
        success = traffic_env.remove_bus_on_demand(bus_id)
        
        if success:
            system_logger.info(f"Manual bus removal via API: {bus_id}")
            return jsonify({
                'success': True,
                'message': f'Bus {bus_id} removed successfully',
                'total_buses': len(traffic_env.buses)
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Cannot remove bus {bus_id}. Only dynamic buses can be removed.'
            }), 400
            
    except Exception as e:
        system_logger.error(f"Error removing bus: {e}")
        return jsonify({
            'success': False,
            'message': f'Error removing bus: {str(e)}'
        }), 500

@app.route('/api/buses', methods=['GET'])
def get_buses():
    """Get detailed information about all buses"""
    try:
        buses_info = []
        for bus_id, bus in traffic_env.buses.items():
            occupancy_rate = len(bus.get('passengers', [])) / bus.get('capacity', 50) * 100
            buses_info.append({
                'id': bus['id'],
                'route_id': bus['route_id'],
                'current_route_id': bus['route_id'],  # Add this for frontend compatibility
                'state': bus['state'],
                'current_stop': bus['current_stop'],
                'target_stop': bus.get('target_stop'),
                'position': bus.get('position'),
                'passengers': bus.get('passengers', []),
                'capacity': bus.get('capacity', 50),
                'route_color': bus.get('route_color', '#3B82F6'),
                'occupancy_rate': occupancy_rate,
                'is_dynamic': bus.get('is_dynamic', False)
            })
        
        return jsonify({
            'success': True,
            'buses': buses_info,
            'total_buses': len(buses_info),
            'dynamic_buses': len([b for b in buses_info if b['is_dynamic']])
        })
        
    except Exception as e:
        system_logger.error(f"Error getting buses: {e}")
        return jsonify({
            'success': False,
            'message': f'Error getting buses: {str(e)}'
        }), 500

@app.route('/api/agent/<agent_id>/decision', methods=['GET'])
def get_agent_decision(agent_id):
    """Get explanation for agent's decision"""
    if not agents_initialized or agent_id not in coordinator.agents:
        return jsonify({
            'success': False,
            'message': f'Agent {agent_id} not found'
        }), 404
    
    agent = coordinator.agents[agent_id]
    
    # Get current observation
    observations = traffic_env.get_observations()
    if agent_id not in observations:
        return jsonify({
            'success': False,
            'message': 'No observation available for agent'
        }), 404
    
    observation = observations[agent_id]
    explanation = agent.explain_decision(observation)
    
    return jsonify({
        'success': True,
        'agent_id': agent_id,
        'explanation': explanation
    })

@app.route('/api/training/start', methods=['POST'])
def start_training():
    """Start training agents (background task)"""
    data = request.get_json() or {}
    num_episodes = data.get('num_episodes', 100)
    
    # Initialize trainer if needed
    if not agents_initialized:
        initialize_agents(use_trained=False)
    
    # Start training in background thread
    training_thread = threading.Thread(
        target=run_training,
        args=(num_episodes,),
        daemon=True
    )
    training_thread.start()
    
    return jsonify({
        'success': True,
        'message': f'Training started for {num_episodes} episodes'
    })

@app.route('/api/passenger/generate', methods=['POST'])
def generate_passengers():
    """Manually generate passengers at a stop (for testing)"""
    data = request.get_json()
    stop_id = data.get('stop_id')
    num_passengers = data.get('num_passengers', 10)
    
    if not stop_id:
        return jsonify({
            'success': False,
            'message': 'stop_id required'
        }), 400
    
    # Simulate rush hour
    passenger_demand.simulate_rush_hour(stop_id, duration_seconds=1)
    
    return jsonify({
        'success': True,
        'message': f'Generated passengers at {stop_id}'
    })

# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    system_logger.info(f"Client connected: {request.sid}")
    emit('connection_response', {
        'status': 'connected',
        'message': 'Connected to Smart Bus MARL backend'
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    system_logger.info(f"Client disconnected: {request.sid}")

@socketio.on('request_state')
def handle_state_request():
    """Handle request for current state"""
    state = traffic_env.get_state()
    emit('state_update', state)

@socketio.on('request_statistics')
def handle_statistics_request():
    """Handle request for statistics"""
    stats = traffic_env.get_statistics()
    
    if agents_initialized:
        agent_stats = coordinator.get_statistics()
        stats['agents'] = agent_stats
    
    emit('statistics_update', stats)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def initialize_agents(use_trained=False):
    """Initialize RL agents"""
    global agents_initialized
    
    system_logger.info("Initializing agents...")
    
    # Reset environment to get bus information
    state = traffic_env.reset()
    
    # Create agents for all buses
    for bus_id in state['buses'].keys():
        route_id = state['buses'][bus_id]['route_id']
        agent = BusAgent(bus_id, route_id)
        coordinator.add_agent(agent)
    
    # Load trained models if requested
    if use_trained:
        loaded = coordinator.load_all_models()
        system_logger.info(f"Loaded {loaded} trained models")
    
    agents_initialized = True
    system_logger.info(f"Initialized {len(coordinator.agents)} agents")

def simulation_loop():
    """Main simulation loop (runs in separate thread)"""
    global simulation_running
    
    system_logger.info("Simulation loop started")
    
    try:
        while simulation_running:
            loop_start = time.time()
            
            # Get observations
            observations = traffic_env.get_observations()
            
            # Get actions from agents (no training during real-time simulation)
            if agents_initialized:
                action_indices = coordinator.get_actions(observations, training=False)
                actions = {
                    bus_id: Config.ACTIONS[action_idx]
                    for bus_id, action_idx in action_indices.items()
                }
            else:
                # Random actions if no agents
                import random
                actions = {
                    bus_id: random.choice(Config.ACTIONS)
                    for bus_id in traffic_env.buses.keys()
                }
            
            # Step simulation
            next_observations, rewards, done = traffic_env.step(actions)
            
            # Get current state
            state = traffic_env.get_state()
            stats = traffic_env.get_statistics()
            
            # Add agent info if available
            if agents_initialized:
                agent_stats = coordinator.get_statistics()
                stats['agents'] = agent_stats
            
            # Broadcast updates via WebSocket
            socketio.emit('state_update', state)
            socketio.emit('statistics_update', stats)
            
            # Control simulation speed
            elapsed = time.time() - loop_start
            sleep_time = Config.UPDATE_INTERVAL - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
    
    except Exception as e:
        system_logger.error(f"Error in simulation loop: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        simulation_running = False
        system_logger.info("Simulation loop ended")

def run_training(num_episodes):
    """Run training in background"""
    try:
        system_logger.info(f"Starting training for {num_episodes} episodes")
        trainer.initialize_agents()
        trainer.train(num_episodes=num_episodes, max_steps_per_episode=500)
        
        # Broadcast training complete
        socketio.emit('training_complete', {
            'message': 'Training completed',
            'episodes': num_episodes
        })
        
        system_logger.info("Training completed")
    
    except Exception as e:
        system_logger.error(f"Error during training: {e}")
        socketio.emit('training_error', {
            'message': str(e)
        })

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*70)
    print("SMART BUS MARL - BACKEND SERVER")
    print("="*70)
    print(f"\nServer starting on {Config.HOST}:{Config.PORT}")
    print(f"CORS enabled for: {Config.CORS_ORIGINS}")
    print("\nAPI Endpoints:")
    print("  GET  /api/status          - System status")
    print("  GET  /api/routes          - Route information")
    print("  GET  /api/stops           - Stop information")
    print("  GET  /api/state           - Current state")
    print("  GET  /api/statistics      - Performance stats")
    print("  POST /api/simulation/start - Start simulation")
    print("  POST /api/simulation/stop  - Stop simulation")
    print("  POST /api/simulation/reset - Reset simulation")
    print("\nWebSocket Events:")
    print("  state_update       - Real-time state updates")
    print("  statistics_update  - Real-time statistics")
    print("\nPress Ctrl+C to stop the server")
    print("="*70 + "\n")
    
    # Run server
    socketio.run(
        app,
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
        allow_unsafe_werkzeug=True
    )