"""
Configuration settings for Smart Bus MARL System
"""
import os

class Config:
    """Main configuration class"""
    
    # Application Settings
    DEBUG = True
    HOST = '127.0.0.1'
    PORT = 5001
    
    # CORS Settings
    CORS_ORIGINS = '*'
    
    # Simulation Parameters
    SIMULATION_SPEED = 1.0  # 1.0 = real-time, 2.0 = 2x faster
    UPDATE_INTERVAL = 0.3  # seconds between updates (faster simulation)
    
    # Map Settings (College Campus - You can modify these coordinates)
    MAP_CENTER = {
        'lat': 17.3850,  # Default: Hyderabad, India
        'lng': 78.4867
    }
    MAP_ZOOM = 15
    
    # Route Settings
    NUM_BUSES = 3  # Number of buses per route
    NUM_ROUTES = 2  # From Bus route details PDF (route_15 UPPAL, route_59 ESI-YG)
    AVERAGE_SPEED = 60  # km/h (increased for faster movement)
    
    # Passenger Settings
    MIN_PASSENGERS_PER_STOP = 0
    MAX_PASSENGERS_PER_STOP = 20
    PASSENGER_ARRIVAL_RATE = 1.0  # Balanced value after verification (originally 0.8)
    BUS_CAPACITY = 50  # maximum passengers per bus
    
    # RL Agent Settings (tuned for effective learning)
    LEARNING_RATE = 0.15  # Slightly higher for faster adaptation
    DISCOUNT_FACTOR = 0.95
    EPSILON = 0.3  # Start with more exploration
    EPSILON_DECAY = 0.9985  # Slower decay = more exploration before convergence
    MIN_EPSILON = 0.02  # Small exploration in deployment
    
    # Action Space (what buses can do)
    ACTIONS = [
        'DEPART_NOW',      # Leave immediately
        'WAIT_30',         # Wait 30 seconds
        'WAIT_60',         # Wait 60 seconds
        'SKIP_STOP'        # Skip if no passengers
    ]
    
    # Reward Parameters (balanced for effective learning)
    REWARD_PASSENGER_PICKUP = 12  # Strong signal for serving passengers
    PENALTY_WAIT_TIME = -0.5  # Per passenger left waiting (moderate penalty)
    PENALTY_FUEL = -3  # Reduced - idling is sometimes necessary
    REWARD_OPTIMAL_OCCUPANCY = 15  # 80-100% full
    REWARD_GOOD_OCCUPANCY = 8  # 60-80% - efficient utilization
    PENALTY_OVERCROWDING = -20  # >100% capacity - stronger penalty
    
    # File Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
    ROUTES_FILE = os.path.join(DATA_DIR, 'routes.json')
    STOPS_FILE = os.path.join(DATA_DIR, 'stops.json')
    MODELS_DIR = os.path.join(DATA_DIR, 'trained_models')
    LOGS_DIR = os.path.join(DATA_DIR, 'logs')
    
    # Training Settings
    TRAINING_EPISODES = 1000
    SAVE_INTERVAL = 100  # Save model every N episodes
    
    @classmethod
    def get_action_index(cls, action_name):
        """Get index of action by name"""
        return cls.ACTIONS.index(action_name)
    
    @classmethod
    def get_action_name(cls, action_index):
        """Get action name by index"""
        return cls.ACTIONS[action_index]