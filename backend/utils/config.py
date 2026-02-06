"""
Configuration settings for Smart Bus MARL System
"""
import os

class Config:
    """Main configuration class"""
    
    # Application Settings
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5001
    
    # CORS Settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    # Simulation Parameters
    SIMULATION_SPEED = 1.0  # 1.0 = real-time, 2.0 = 2x faster
    UPDATE_INTERVAL = 1.0  # seconds between updates
    
    # Map Settings (College Campus - You can modify these coordinates)
    MAP_CENTER = {
        'lat': 17.3850,  # Default: Hyderabad, India
        'lng': 78.4867
    }
    MAP_ZOOM = 15
    
    # Route Settings
    NUM_BUSES = 3  # Number of buses per route
    NUM_ROUTES = 1  # Number of routes (start with 1)
    AVERAGE_SPEED = 30  # km/h
    
    # Passenger Settings
    MIN_PASSENGERS_PER_STOP = 0
    MAX_PASSENGERS_PER_STOP = 20
    PASSENGER_ARRIVAL_RATE = 0.5  # passengers per second (average)
    BUS_CAPACITY = 50  # maximum passengers per bus
    
    # RL Agent Settings
    LEARNING_RATE = 0.1
    DISCOUNT_FACTOR = 0.95
    EPSILON = 0.2  # exploration rate
    EPSILON_DECAY = 0.995
    MIN_EPSILON = 0.01
    
    # Action Space (what buses can do)
    ACTIONS = [
        'DEPART_NOW',      # Leave immediately
        'WAIT_30',         # Wait 30 seconds
        'WAIT_60',         # Wait 60 seconds
        'SKIP_STOP'        # Skip if no passengers
    ]
    
    # Reward Parameters
    REWARD_PASSENGER_PICKUP = 10
    PENALTY_WAIT_TIME = -1  # per passenger per second
    PENALTY_FUEL = -5
    REWARD_OPTIMAL_OCCUPANCY = 20  # 80-100% full
    PENALTY_OVERCROWDING = -15  # >100% capacity
    
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