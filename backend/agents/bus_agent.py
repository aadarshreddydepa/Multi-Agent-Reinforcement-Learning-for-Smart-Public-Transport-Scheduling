"""
Bus Agent - Intelligent RL agent for bus control
"""
import numpy as np
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import agent_logger
from models.ppo_agent import PPOAgent
from models.memory import Memory
from agents.reward_system import reward_calculator
import torch

class BusAgent:
    """Reinforcement Learning agent for bus control using PPO"""
    
    def __init__(self, agent_id: str, route_id: str):
        """
        Initialize bus agent with PPO
        """
        self.agent_id = agent_id
        self.route_id = route_id
        
        # PPO components (4 inputs: queue, occupancy, time, traffic; 4 outputs: ACTIONS)
        self.state_dim = 4
        self.action_dim = len(Config.ACTIONS)
        self.ppo_agent = PPOAgent(self.state_dim, self.action_dim)
        self.memory = Memory()
        
        # Metrics
        self.episode_reward = 0
        self.episode_steps = 0
        self.episodes_completed = 0
        self.total_rewards = []
        self.avg_rewards = []
        self.last_reward = 0
        self.epsilon = Config.EPSILON  # Initial exploration rate
        
        agent_logger.info(f"BusAgent {agent_id} (PPO) initialized for {route_id}")
    
    def select_action(self, observation: tuple, training: bool = True) -> int:
        """
        Select action based on current observation
        """
        # Convert observation to numpy array
        state = np.array(observation, dtype=np.float32)
        
        if training:
            action, logprob = self.ppo_agent.select_action(state)
            self.memory.states.append(torch.FloatTensor(state))
            self.memory.actions.append(torch.tensor(action))
            self.memory.logprobs.append(logprob)
        else:
            with torch.no_grad():
                action_probs, _ = self.ppo_agent.policy_old(torch.FloatTensor(state).unsqueeze(0))
                action = torch.argmax(action_probs).item()
        
        agent_logger.debug(f"{self.agent_id} selected action: {Config.ACTIONS[action]}")
        return action
    
    def learn(self, next_observation: tuple, reward: float, done: bool = False):
        """
        Store reward and learn if buffer is full or episode done
        """
        self.memory.rewards.append(reward)
        self.memory.is_terminals.append(done)
        
        self.episode_reward += reward
        self.episode_steps += 1
        
        # PPO usually updates in batches, but for simplicity we can trigger it here or in coordinator
        if done:
            self.ppo_agent.update(self.memory)
            self.memory.clear()
    
    def end_episode(self):
        """Mark end of episode and update statistics"""
        self.episodes_completed += 1
        self.total_rewards.append(self.episode_reward)
        
        recent_rewards = self.total_rewards[-100:]
        avg_reward = np.mean(recent_rewards) if recent_rewards else 0
        self.avg_rewards.append(avg_reward)
        
        agent_logger.info(f"{self.agent_id} Episode {self.episodes_completed} complete: "
                         f"reward={self.episode_reward:.1f}, steps={self.episode_steps}, "
                         f"avg_reward={avg_reward:.1f}")
        
        # Reset episode counters
        self.episode_reward = 0
        self.episode_steps = 0
    
    def save_model(self, filepath: str = None):
        """Save agent's PPO model"""
        if filepath is None:
            os.makedirs(Config.MODELS_DIR, exist_ok=True)
            filepath = os.path.join(Config.MODELS_DIR, f"{self.agent_id}_ppo.pt")
        self.ppo_agent.save(filepath)
    
    def load_model(self, filepath: str = None) -> bool:
        """Load agent's PPO model"""
        if filepath is None:
            filepath = os.path.join(Config.MODELS_DIR, f"{self.agent_id}_ppo.pt")
        
        if os.path.exists(filepath):
            self.ppo_agent.load(filepath)
            agent_logger.info(f"{self.agent_id} loaded PPO model from {filepath}")
            return True
        return False
    
    def get_statistics(self) -> dict:
        """Get comprehensive agent statistics"""
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
            'total_episodes': len(self.total_rewards)
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
        """
        state = np.array(observation, dtype=np.float32)
        with torch.no_grad():
            action_probs, _ = self.ppo_agent.policy_old(torch.FloatTensor(state).unsqueeze(0))
            probs = action_probs.squeeze().numpy()
        
        policy = {}
        for i, action_name in enumerate(Config.ACTIONS):
            policy[action_name] = float(probs[i])
        
        return policy
    
    def explain_decision(self, observation: tuple) -> dict:
        """
        Explain decision based on state
        """
        queue_length, occupancy, time_since_last, traffic = observation
        
        explanation = {
            'state': {
                'queue_length': queue_length,
                'bus_occupancy': f"{occupancy:.0%}",
                'time_since_last_bus': f"{time_since_last:.0f}s",
                'traffic_level': f"{traffic:.0%}"
            },
            'reasoning': "PPO neural network decision based on policy gradient optimization."
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