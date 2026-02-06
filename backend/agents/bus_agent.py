"""
Bus Agent - Intelligent RL agent for bus control
"""
import numpy as np
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import agent_logger
from models.q_table import QTable
from agents.reward_system import reward_calculator

class BusAgent:
    """Reinforcement Learning agent for bus control"""
    
    def __init__(self, agent_id: str, route_id: str):
        """
        Initialize bus agent
        
        Args:
            agent_id: Unique identifier (e.g., 'route_1_bus_1')
            route_id: Route this agent operates on
        """
        self.agent_id = agent_id
        self.route_id = route_id
        
        # Q-learning components
        self.q_table = QTable(agent_id)
        self.epsilon = Config.EPSILON  # Exploration rate
        
        # Experience tracking
        self.last_state = None
        self.last_action = None
        self.last_reward = 0
        
        # Episode statistics
        self.episode_reward = 0
        self.episode_steps = 0
        self.episodes_completed = 0
        
        # Performance metrics
        self.total_rewards = []
        self.avg_rewards = []
        
        agent_logger.info(f"BusAgent {agent_id} initialized for {route_id}")
    
    def select_action(self, observation: tuple, training: bool = True) -> int:
        """
        Select action based on current observation
        
        Args:
            observation: (queue_length, occupancy, time_since_last_bus, traffic_level)
            training: Whether in training mode (uses epsilon-greedy)
        
        Returns:
            Action index
        """
        if training:
            # Epsilon-greedy exploration
            action = self.q_table.get_action(observation, self.epsilon)
        else:
            # Pure exploitation (greedy)
            state_hash = self.q_table.discretize_state(observation)
            action = self.q_table.get_best_action(state_hash)
        
        # Store for learning
        self.last_state = observation
        self.last_action = action
        
        action_name = Config.ACTIONS[action]
        agent_logger.debug(f"{self.agent_id} selected action: {action_name} (ε={self.epsilon:.3f})")
        
        return action
    
    def learn(self, next_observation: tuple, reward: float, done: bool = False):
        """
        Learn from experience (update Q-values)
        
        Args:
            next_observation: Observation after taking action
            reward: Reward received
            done: Whether episode ended
        """
        if self.last_state is None or self.last_action is None:
            return
        
        # Update Q-table
        self.q_table.update(
            state=self.last_state,
            action=self.last_action,
            reward=reward,
            next_state=next_observation,
            done=done
        )
        
        # Track rewards
        self.episode_reward += reward
        self.episode_steps += 1
        self.last_reward = reward
        
        agent_logger.debug(f"{self.agent_id} learned: reward={reward:.2f}, total_episode_reward={self.episode_reward:.2f}")
    
    def end_episode(self):
        """Mark end of episode and update statistics"""
        self.episodes_completed += 1
        self.total_rewards.append(self.episode_reward)
        
        # Calculate moving average reward (last 100 episodes)
        recent_rewards = self.total_rewards[-100:]
        avg_reward = np.mean(recent_rewards) if recent_rewards else 0
        self.avg_rewards.append(avg_reward)
        
        agent_logger.info(f"{self.agent_id} Episode {self.episodes_completed} complete: "
                         f"reward={self.episode_reward:.1f}, steps={self.episode_steps}, "
                         f"avg_reward={avg_reward:.1f}")
        
        # Decay epsilon (reduce exploration over time)
        self.epsilon = max(Config.MIN_EPSILON, self.epsilon * Config.EPSILON_DECAY)
        
        # Reset episode counters
        self.episode_reward = 0
        self.episode_steps = 0
        self.last_state = None
        self.last_action = None
    
    def get_action_name(self, action: int) -> str:
        """Convert action index to name"""
        return Config.ACTIONS[action]
    
    def save_model(self, filepath: str = None):
        """Save agent's Q-table"""
        self.q_table.save(filepath)
    
    def load_model(self, filepath: str = None) -> bool:
        """Load agent's Q-table"""
        success = self.q_table.load(filepath)
        if success:
            # Reset epsilon to low value for exploitation
            self.epsilon = Config.MIN_EPSILON
            agent_logger.info(f"{self.agent_id} loaded trained model, epsilon set to {self.epsilon}")
        return success
    
    def get_statistics(self) -> dict:
        """Get comprehensive agent statistics"""
        q_stats = self.q_table.get_statistics()
        
        recent_rewards = self.total_rewards[-100:] if self.total_rewards else []
        
        return {
            'agent_id': self.agent_id,
            'route_id': self.route_id,
            'episodes_completed': self.episodes_completed,
            'epsilon': self.epsilon,
            'episode_reward': self.episode_reward,
            'episode_steps': self.episode_steps,
            'last_reward': self.last_reward,
            'avg_reward_last_100': np.mean(recent_rewards) if recent_rewards else 0,
            'total_episodes': len(self.total_rewards),
            'q_table_stats': q_stats
        }
    
    def reset(self):
        """Reset agent state (not Q-table)"""
        self.last_state = None
        self.last_action = None
        self.last_reward = 0
        self.episode_reward = 0
        self.episode_steps = 0
        
        agent_logger.debug(f"{self.agent_id} reset")
    
    def set_epsilon(self, epsilon: float):
        """Set exploration rate manually"""
        self.epsilon = max(0, min(1.0, epsilon))  # Clamp between 0 and 1
        agent_logger.info(f"{self.agent_id} epsilon set to {self.epsilon}")
    
    def get_policy(self, observation: tuple) -> dict:
        """
        Get policy (action probabilities) for current state
        Useful for visualization
        
        Returns:
            {action_name: probability}
        """
        state_hash = self.q_table.discretize_state(observation)
        q_values = self.q_table.get_q_values(state_hash)
        
        # Softmax for probabilities
        exp_q = np.exp(q_values - np.max(q_values))  # Subtract max for numerical stability
        probabilities = exp_q / np.sum(exp_q)
        
        policy = {}
        for i, action_name in enumerate(Config.ACTIONS):
            policy[action_name] = float(probabilities[i])
        
        return policy
    
    def explain_decision(self, observation: tuple) -> dict:
        """
        Explain why agent chose a particular action
        Useful for debugging and presentations
        
        Returns:
            Dictionary with explanation
        """
        state_hash = self.q_table.discretize_state(observation)
        q_values = self.q_table.get_q_values(state_hash)
        best_action = self.q_table.get_best_action(state_hash)
        
        queue_length, occupancy, time_since_last, traffic = observation
        
        explanation = {
            'state': {
                'queue_length': queue_length,
                'bus_occupancy': f"{occupancy:.0%}",
                'time_since_last_bus': f"{time_since_last:.0f}s",
                'traffic_level': f"{traffic:.0%}"
            },
            'state_hash': state_hash,
            'q_values': {
                Config.ACTIONS[i]: float(q_values[i]) 
                for i in range(len(Config.ACTIONS))
            },
            'best_action': Config.ACTIONS[best_action],
            'exploration_rate': self.epsilon,
            'reasoning': self._generate_reasoning(observation, q_values, best_action)
        }
        
        return explanation
    
    def _generate_reasoning(self, observation: tuple, q_values: np.ndarray, best_action: int) -> str:
        """Generate human-readable reasoning for decision"""
        queue_length, occupancy, _, _ = observation
        action_name = Config.ACTIONS[best_action]
        
        if action_name == 'DEPART_NOW':
            if queue_length == 0:
                return "No passengers waiting, efficient to depart immediately"
            elif occupancy > 0.8:
                return "Bus nearly full, good time to depart"
            else:
                return "Learned that departing now maximizes overall efficiency"
        
        elif action_name == 'WAIT_30':
            if queue_length > 0 and occupancy < 0.5:
                return "More passengers expected soon, bus has space"
            else:
                return "Short wait may improve passenger pickup"
        
        elif action_name == 'WAIT_60':
            if queue_length > 5 and occupancy < 0.6:
                return "Many passengers waiting, worth longer wait to serve more"
            else:
                return "Extended wait expected to maximize passenger service"
        
        elif action_name == 'SKIP_STOP':
            if queue_length == 0:
                return "No passengers, skipping saves time and fuel"
            else:
                return "Unusual decision, may be exploration"
        
        return "Decision based on learned Q-values"


class MultiAgentCoordinator:
    """Coordinates multiple bus agents"""
    
    def __init__(self):
        """Initialize coordinator"""
        self.agents = {}
        agent_logger.info("MultiAgentCoordinator initialized")
    
    def add_agent(self, agent: BusAgent):
        """Add agent to coordinator"""
        self.agents[agent.agent_id] = agent
        agent_logger.info(f"Added agent {agent.agent_id} to coordinator")
    
    def get_actions(self, observations: dict, training: bool = True) -> dict:
        """
        Get actions for all agents
        
        Args:
            observations: {agent_id: observation}
            training: Whether in training mode
        
        Returns:
            {agent_id: action_index}
        """
        actions = {}
        for agent_id, observation in observations.items():
            if agent_id in self.agents:
                action = self.agents[agent_id].select_action(observation, training)
                actions[agent_id] = action
        
        return actions
    
    def update_agents(self, next_observations: dict, rewards: dict, dones: dict = None):
        """
        Update all agents with new experiences
        
        Args:
            next_observations: {agent_id: next_observation}
            rewards: {agent_id: reward}
            dones: {agent_id: done} (None = all False)
        """
        if dones is None:
            dones = {agent_id: False for agent_id in self.agents.keys()}
        
        for agent_id, agent in self.agents.items():
            if agent_id in next_observations and agent_id in rewards:
                agent.learn(
                    next_observations[agent_id],
                    rewards[agent_id],
                    dones.get(agent_id, False)
                )
    
    def save_all_models(self):
        """Save all agent models"""
        for agent in self.agents.values():
            agent.save_model()
        agent_logger.info(f"Saved {len(self.agents)} agent models")
    
    def load_all_models(self):
        """Load all agent models"""
        success_count = 0
        for agent in self.agents.values():
            if agent.load_model():
                success_count += 1
        
        agent_logger.info(f"Loaded {success_count}/{len(self.agents)} agent models")
        return success_count
    
    def get_statistics(self) -> dict:
        """Get statistics for all agents"""
        return {
            agent_id: agent.get_statistics() 
            for agent_id, agent in self.agents.items()
        }

# Create singleton coordinator
coordinator = MultiAgentCoordinator()