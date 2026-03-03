"""
Flask Backend API for Smart Bus MARL
Real-time communication via REST API and WebSocket
"""
import os
import sys

# Windows DLL Path Fix for Torch
if os.name == 'nt':
    import sys
    # Paths where torch DLLs are known to be located
    potential_libs = [
        r'C:\Python312\Lib\site-packages\torch\lib',
        r'C:\Python312\Library\bin',
        os.path.join(sys.prefix, 'Lib', 'site-packages', 'torch', 'lib'),
        os.path.join(sys.prefix, 'Library', 'bin'),
    ]

    for lib_path in potential_libs:
        if os.path.exists(lib_path):
            try:
                os.add_dll_directory(lib_path)
                os.environ["PATH"] = lib_path + os.pathsep + os.environ["PATH"]
            except Exception:
                pass
    
    # Pre-import torch to lock dependencies
    try:
        import torch
    except ImportError:
        try:
            import ctypes
            for lib_path in potential_libs:
                dll_path = os.path.join(lib_path, 'libiomp5md.dll')
                if os.path.exists(dll_path):
                    ctypes.WinDLL(dll_path)
            import torch
        except:
            pass

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
from agents.marl_agents import initialize_agents
from models.training import trainer

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'smart-bus-marl-secret-key'

# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO with manual override settings
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    logger=True,
    engineio_logger=True,
    allow_upgrades=True,
    ping_timeout=60,
    ping_interval=25
)

# Global state
# Note: most state is now inside traffic_env
simulation_thread = None

# Statistics tracking
stats_history = []

system_logger.info("Flask app initialized")

@app.before_request
def log_request_info():
    system_logger.info(f"[API] Request: {request.method} {request.url}")

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
        'simulation_running': traffic_env.simulation_running,
        'agents_initialized': traffic_env.agents_initialized,
        'num_buses': len(traffic_env.buses),
        'num_agents': len(traffic_env.agents),
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
    system_logger.info("ROAD-PATHS: Request received")
    try:
        routes = route_manager.get_all_routes_info()
        system_logger.info(f"ROAD-PATHS: Found {len(routes)} routes to process")
        road_paths = {}
        
        for route in routes:
            route_id = route['id']
            stops = route['stops']
            system_logger.info(f"ROAD-PATHS: Processing route {route_id} ({len(stops)} stops)")
            
            # Get road path using the pathfinder
            road_path = route_manager.get_road_path(route_id)
            if road_path:
                road_paths[route_id] = {
                    'stops': stops,
                    'path': road_path,
                    'color': route.get('color', '#3B82F6')
                }
            system_logger.info(f"ROAD-PATHS: Finished route {route_id}")
        
        system_logger.info("ROAD-PATHS: Success, sending response")
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
    if traffic_env.agents_initialized:
        agent_stats = coordinator.get_statistics()
        stats['agents'] = agent_stats
    
    return jsonify(stats)

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    """Start the simulation"""
    global simulation_thread
    
    system_logger.info("SIM-START: Request received")
    
    if traffic_env.simulation_running:
        system_logger.info("SIM-START: Already running")
        return jsonify({
            'success': False,
            'message': 'Simulation already running'
        }), 400
    
    if len(traffic_env.buses) == 0:
        system_logger.info("Initializing default fleet on simulation start")
        traffic_env.reset()

    try:
        # Get optional parameters
        data = request.get_json(silent=True) or {}
        use_trained_agents = data.get('use_trained_agents', False)
        
        # Initialize MARL agents per bus
        initialize_agents(traffic_env)
        
        if use_trained_agents:
            coordinator.load_all_models()
        
        # Start simulation loop
        traffic_env.simulation_running = True
        simulation_thread = threading.Thread(target=simulation_loop, args=(use_trained_agents,), daemon=True)
        simulation_thread.start()
        
        system_logger.info("Simulation activated with PPO agents")
        
        return jsonify({
            'success': True,
            'message': 'Simulation started',
            'num_agents': len(traffic_env.agents)
        })
    
    except Exception as e:
        system_logger.error(f"Error starting simulation: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/simulation/stop', methods=['POST'])
def stop_simulation():
    """Stop the simulation loop"""
    traffic_env.simulation_running = False
    system_logger.info("Simulation stopping request received")
    return jsonify({
        'success': True,
        'message': 'Simulation stopping'
    })

@app.route('/api/simulation/reset', methods=['POST'])
def reset_simulation():
    """Reset the simulation"""
    
    # Stop if running
    was_running = traffic_env.simulation_running
    traffic_env.simulation_running = False
    
    # Wait for simulation thread to stop
    if simulation_thread and simulation_thread.is_alive():
        time.sleep(0.5)
    
    # Reset environment and agents
    traffic_env.reset()
    
    # reset agents
    if traffic_env.agents_initialized:
        coordinator.agents = {}
        traffic_env.agents_initialized = False

    
    system_logger.info("Simulation reset")
    
    return jsonify({
        'success': True,
        'message': 'Simulation reset',
        'was_running': was_running
    })

@app.route('/api/buses', methods=['POST'])
def add_bus():
    """Add a new bus to handle increased demand"""
    try:
        success = traffic_env.add_bus_on_demand()
        
        if success:
            # If agents are already initialized, we need to add an agent for the new bus
            if traffic_env.agents_initialized:
                # Get the newly added bus (it will be the last one or we can find it)
                # For safety, let's just make sure all buses have agents
                all_bus_ids = traffic_env.buses.keys()
                for b_id in all_bus_ids:
                    if b_id not in coordinator.agents:
                        bus_info = traffic_env.buses[b_id]
                        new_agent = BusAgent(b_id, bus_info['route_id'])
                        coordinator.add_agent(new_agent)
                        system_logger.info(f"Dynamically added agent for bus {b_id}")
            
            system_logger.info("Manual bus added via API")
            return jsonify({
                'success': True,
                'message': 'Bus added successfully',
                'total_buses': len(traffic_env.buses),
                'agents_initialized': traffic_env.agents_initialized
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

@app.route('/api/buses/<bus_id>', methods=['DELETE'])
def remove_bus(bus_id):
    """Remove a dynamic bus"""
    try:
        success = traffic_env.remove_bus_on_demand(bus_id)
        
        if success:
            # If agents are initialized, remove the agent too
            if traffic_env.agents_initialized and bus_id in coordinator.agents:
                del coordinator.agents[bus_id]
                system_logger.info(f"Dynamically removed agent for bus {bus_id}")
                
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
    if not traffic_env.agents_initialized or agent_id not in coordinator.agents:
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
    if not traffic_env.agents_initialized:
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
    print("Client connected")
    system_logger.info(f"Client connected: {request.sid}")
    emit('connection_response', {
        'status': 'connected',
        'message': 'Connected to Smart Bus MARL backend'
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print("Client disconnected")
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
    
    if traffic_env.agents_initialized:
        agent_stats = coordinator.get_statistics()
        stats['agents'] = agent_stats
    
    emit('statistics_update', stats)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def initialize_agents(use_trained=False):
    """Initialize RL agents"""
    system_logger.info("Initializing agents...")
    
    # Reset environment to get bus information
    # If simulation is NOT running, we use the current fleet
    state = traffic_env.get_state()
    
    # Clear existing agents
    coordinator.agents = {}
    
    # Create agents for all buses
    for bus_id in state['buses'].keys():
        route_id = state['buses'][bus_id]['route_id']
        agent = BusAgent(bus_id, route_id)
        coordinator.add_agent(agent)
    
    # Load trained models if requested
    if use_trained:
        loaded = coordinator.load_all_models()
        system_logger.info(f"Loaded {loaded} trained models")
    
    traffic_env.agents_initialized = True
    system_logger.info(f"Initialized {len(coordinator.agents)} agents")

def simulation_loop(use_ai=True):
    """
    Continuous simulation loop as per production requirements
    """
    system_logger.info(f"Engine Loop: Starting (AI={use_ai})")
    print(f"DEBUG: Engine Loop Entered with use_ai={use_ai}")
    update_interval = Config.UPDATE_INTERVAL
    
    try:
        while traffic_env.simulation_running:
            loop_start = time.time()
            
            # Step 1: For each bus, select action using its PPO agent
            for bus_id in list(traffic_env.buses.keys()):
                # Get observation for this specific bus
                state = traffic_env.get_state_for_bus(bus_id)
                
                # Select action via agent
                if use_ai and traffic_env.agents_initialized and bus_id in traffic_env.agents:
                    action_idx = traffic_env.agents[bus_id].select_action(state, training=False)
                    action_name = Config.ACTIONS[action_idx]
                else:
                    # Fallback to heuristic if agent not ready
                    action_name = traffic_env._make_intelligent_decision(traffic_env.buses[bus_id])
                
                # Apply action to environment
                traffic_env.apply_action(bus_id, action_name)
            
            # Step 2: Update physics and demand
            traffic_env.update_positions()
            traffic_env.update_passengers()
            
            # Step 3: Increment time
            traffic_env.simulation_time += 1.0
            
            # Step 4: Broadcast state update via WebSocket
            try:
                state_data = traffic_env.serialize()
                system_logger.debug(f"Loop: Serialized state at t={traffic_env.simulation_time}")
                
                socketio.emit('state_update', state_data)
                system_logger.debug("Loop: Emitted state_update")
            except Exception as emit_err:
                system_logger.error(f"Loop: Socket emission failure: {emit_err}")

            # Send statistics update periodically
            if int(traffic_env.simulation_time) % 5 == 0:
                try:
                    stats = traffic_env.get_statistics()
                    socketio.emit('statistics_update', stats)
                except Exception as stats_err:
                    system_logger.error(f"Loop: Stats emission failure: {stats_err}")
            
            # Heartbeat log every 5 steps (increased frequency for debugging)
            if int(traffic_env.simulation_time) % 5 == 0:
                system_logger.info(f"SIM-HEARTBEAT: Time={traffic_env.simulation_time}, Buses={len(traffic_env.buses)}")

            # Control timing
            elapsed = time.time() - loop_start
            sleep_time = update_interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
                
    except Exception as e:
        system_logger.error(f"CRITICAL: Simulation loop failure: {e}")
        import traceback
        traceback.print_exc()
    finally:
        traffic_env.simulation_running = False
        system_logger.info("Engine Loop: Terminated")

def run_training(num_episodes):
    """Run training in background"""
    try:
        system_logger.info(f"Starting training for {num_episodes} episodes")
        
        # Ensure models directory exists
        os.makedirs(Config.MODELS_DIR, exist_ok=True)
        
        trainer.initialize_agents()
        
        # Emit training start notification
        socketio.emit('training_started', {
            'message': f'Training started for {num_episodes} episodes',
            'episodes': num_episodes
        })
        
        trainer.train(num_episodes=num_episodes, max_steps_per_episode=500)
        
        # Save all trained models
        coordinator.save_all_models()
        
        # Broadcast training complete
        socketio.emit('training_complete', {
            'message': 'Training completed and models saved',
            'episodes': num_episodes
        })
        
        system_logger.info("Training completed and models saved")
    
    except Exception as e:
        system_logger.error(f"Error during training: {e}")
        socketio.emit('training_error', {
            'message': str(e)
        })

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5001,
        debug=False
    )