"""
Q-Table - Q-Learning implementation for bus agents
"""
import numpy as np
import pickle
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import agent_logger

class QTable:
    """Q-Learning table for a single bus agent"""
    
    def __init__(self, agent_id: str, learning_rate: float = None, discount_factor: float = None):
        """
        Initialize Q-Table
        
        Args:
            agent_id: Unique identifier for this agent
            learning_rate: Alpha (None = use config default)
            discount_factor: Gamma (None = use config default)
        """
        self.agent_id = agent_id
        self.learning_rate = learning_rate or Config.LEARNING_RATE
        self.discount_factor = discount_factor or Config.DISCOUNT_FACTOR
        
        # Q-table: {state_hash: [Q-values for each action]}
        self.q_table = {}
        
        # Statistics
        self.total_updates = 0
        self.states_explored = 0
        
        agent_logger.info(f"QTable initialized for {agent_id} (α={self.learning_rate}, γ={self.discount_factor})")
    
    def discretize_state(self, observation: tuple) -> str:
        """
        Convert continuous observation to discrete state
        
        Args:
            observation: (queue_length, occupancy, time_since_last_bus, traffic_level)
        
        Returns:
            State hash string
        """
        queue_length, occupancy, time_since_last_bus, traffic_level = observation
        
        # Discretize queue length into bins
        if queue_length == 0:
            queue_bin = 0
        elif queue_length <= 5:
            queue_bin = 1
        elif queue_length <= 10:
            queue_bin = 2
        elif queue_length <= 20:
            queue_bin = 3
        else:
            queue_bin = 4
        
        # Discretize occupancy (percentage of bus capacity)
        if occupancy < 0.3:
            occupancy_bin = 0  # Low
        elif occupancy < 0.6:
            occupancy_bin = 1  # Medium
        elif occupancy < 0.9:
            occupancy_bin = 2  # High
        else:
            occupancy_bin = 3  # Very High/Full
        
        # Discretize time since last bus
        if time_since_last_bus < 300:  # < 5 minutes
            time_bin = 0
        elif time_since_last_bus < 600:  # < 10 minutes
            time_bin = 1
        else:
            time_bin = 2
        
        # Discretize traffic level
        if traffic_level < 0.4:
            traffic_bin = 0  # Low
        elif traffic_level < 0.7:
            traffic_bin = 1  # Medium
        else:
            traffic_bin = 2  # High
        
        # Create state hash
        state_hash = f"{queue_bin}_{occupancy_bin}_{time_bin}_{traffic_bin}"
        
        return state_hash
    
    def get_q_values(self, state_hash: str) -> np.ndarray:
        """
        Get Q-values for a state
        
        Args:
            state_hash: Discretized state
        
        Returns:
            Array of Q-values for each action
        """
        if state_hash not in self.q_table:
            # Initialize new state with zeros
            self.q_table[state_hash] = np.zeros(len(Config.ACTIONS))
            self.states_explored += 1
        
        return self.q_table[state_hash]
    
    def get_best_action(self, state_hash: str) -> int:
        """
        Get best action for a state (greedy)
        
        Args:
            state_hash: Discretized state
        
        Returns:
            Action index
        """
        q_values = self.get_q_values(state_hash)
        return int(np.argmax(q_values))
    
    def get_action(self, observation: tuple, epsilon: float) -> int:
        """
        Get action using epsilon-greedy policy
        
        Args:
            observation: Current observation
            epsilon: Exploration rate (0.0 to 1.0)
        
        Returns:
            Action index
        """
        state_hash = self.discretize_state(observation)
        
        # Epsilon-greedy exploration
        if np.random.random() < epsilon:
            # Explore: random action
            action = np.random.randint(len(Config.ACTIONS))
        else:
            # Exploit: best known action
            action = self.get_best_action(state_hash)
        
        return action
    
    def update(self, state: tuple, action: int, reward: float, next_state: tuple, done: bool = False):
        """
        Update Q-value using Q-learning algorithm
        
        Q(s,a) ← Q(s,a) + α[r + γ·max(Q(s',a')) - Q(s,a)]
        
        Args:
            state: Current state observation
            action: Action taken
            reward: Reward received
            next_state: Next state observation
            done: Whether episode is complete
        """
        # Discretize states
        state_hash = self.discretize_state(state)
        next_state_hash = self.discretize_state(next_state)
        
        # Get current Q-value
        current_q = self.get_q_values(state_hash)[action]
        
        # Get max Q-value for next state
        if done:
            max_next_q = 0
        else:
            max_next_q = np.max(self.get_q_values(next_state_hash))
        
        # Calculate new Q-value
        new_q = current_q + self.learning_rate * (reward + self.discount_factor * max_next_q - current_q)
        
        # Update Q-table
        self.q_table[state_hash][action] = new_q
        
        self.total_updates += 1
        
        agent_logger.debug(f"{self.agent_id} Q-update: state={state_hash}, action={action}, Q={current_q:.2f}→{new_q:.2f}, reward={reward:.2f}")
    
    def save(self, filepath: str = None):
        """
        Save Q-table to file
        
        Args:
            filepath: Path to save file (None = auto-generate)
        """
        if filepath is None:
            os.makedirs(Config.MODELS_DIR, exist_ok=True)
            filepath = os.path.join(Config.MODELS_DIR, f"{self.agent_id}_qtable.pkl")
        
        data = {
            'q_table': self.q_table,
            'agent_id': self.agent_id,
            'learning_rate': self.learning_rate,
            'discount_factor': self.discount_factor,
            'total_updates': self.total_updates,
            'states_explored': self.states_explored
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(data, f)
        
        agent_logger.info(f"Saved Q-table for {self.agent_id} to {filepath}")
    
    def load(self, filepath: str = None):
        """
        Load Q-table from file
        
        Args:
            filepath: Path to load file (None = auto-generate)
        """
        if filepath is None:
            filepath = os.path.join(Config.MODELS_DIR, f"{self.agent_id}_qtable.pkl")
        
        if not os.path.exists(filepath):
            agent_logger.warning(f"Q-table file not found: {filepath}")
            return False
        
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
            
            self.q_table = data['q_table']
            self.total_updates = data.get('total_updates', 0)
            self.states_explored = data.get('states_explored', 0)
            
            agent_logger.info(f"Loaded Q-table for {self.agent_id} from {filepath}")
            agent_logger.info(f"  States explored: {self.states_explored}, Updates: {self.total_updates}")
            return True
        
        except Exception as e:
            agent_logger.error(f"Error loading Q-table: {e}")
            return False
    
    def get_statistics(self) -> dict:
        """Get Q-table statistics"""
        if not self.q_table:
            return {
                'states': 0,
                'total_updates': 0,
                'avg_q_value': 0,
                'max_q_value': 0,
                'min_q_value': 0
            }
        
        all_q_values = []
        for q_values in self.q_table.values():
            all_q_values.extend(q_values)
        
        return {
            'states': len(self.q_table),
            'total_updates': self.total_updates,
            'avg_q_value': np.mean(all_q_values) if all_q_values else 0,
            'max_q_value': np.max(all_q_values) if all_q_values else 0,
            'min_q_value': np.min(all_q_values) if all_q_values else 0
        }
    
    def reset_statistics(self):
        """Reset learning statistics (but keep Q-values)"""
        self.total_updates = 0
        # Don't reset states_explored as it's cumulative
        agent_logger.info(f"Reset statistics for {self.agent_id}")