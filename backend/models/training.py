"""
Training Module - Train RL agents using Q-learning
"""
import numpy as np
import time
import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import agent_logger, system_logger
from environment.traffic_env import traffic_env
from agents.bus_agent import BusAgent, coordinator

class Trainer:
    """Trains RL agents"""
    
    def __init__(self):
        """Initialize trainer"""
        self.agents = {}
        self.training_history = {
            'episode_rewards': [],
            'avg_rewards': [],
            'avg_wait_times': [],
            'passengers_served': []
        }
        
        system_logger.info("Trainer initialized")
    
    def initialize_agents(self):
        """Create agents for all buses"""
        # Reset environment to get bus information
        state = traffic_env.reset()
        
        # Create an agent for each bus
        for bus_id in state['buses'].keys():
            route_id = state['buses'][bus_id]['route_id']
            agent = BusAgent(bus_id, route_id)
            self.agents[bus_id] = agent
            coordinator.add_agent(agent)
        
        system_logger.info(f"Initialized {len(self.agents)} agents")
    
    def train(self, num_episodes: int = 100, max_steps_per_episode: int = 500):
        """
        Train agents for specified number of episodes
        
        Args:
            num_episodes: Number of training episodes
            max_steps_per_episode: Maximum steps per episode
        """
        system_logger.info(f"Starting training: {num_episodes} episodes, max {max_steps_per_episode} steps each")
        
        start_time = time.time()
        
        for episode in range(num_episodes):
            episode_start = time.time()
            
            # Reset environment
            state = traffic_env.reset()
            
            # Reset all agents for new episode
            for agent in self.agents.values():
                agent.reset()
            
            episode_rewards = {agent_id: 0 for agent_id in self.agents.keys()}
            
            # Run episode
            for step in range(max_steps_per_episode):
                # Get observations for all buses
                observations = traffic_env.get_observations()
                
                # Get actions from agents
                action_indices = coordinator.get_actions(observations, training=True)
                
                # Convert action indices to action names
                actions = {
                    bus_id: Config.ACTIONS[action_idx]
                    for bus_id, action_idx in action_indices.items()
                }
                
                # Execute actions in environment
                next_observations, rewards, done = traffic_env.step(actions)
                
                # Update agents
                coordinator.update_agents(next_observations, rewards)
                
                # Track episode rewards
                for bus_id, reward in rewards.items():
                    episode_rewards[bus_id] += reward
                
                if done:
                    break
            
            # End episode for all agents
            for agent in self.agents.values():
                agent.end_episode()
            
            # Get episode statistics
            stats = traffic_env.get_statistics()
            avg_episode_reward = np.mean(list(episode_rewards.values()))
            
            # Track training history
            self.training_history['episode_rewards'].append(avg_episode_reward)
            self.training_history['avg_wait_times'].append(stats['average_wait_time'])
            self.training_history['passengers_served'].append(stats['total_passengers_served'])
            
            # Calculate moving average
            recent_rewards = self.training_history['episode_rewards'][-20:]
            avg_reward = np.mean(recent_rewards)
            self.training_history['avg_rewards'].append(avg_reward)
            
            episode_time = time.time() - episode_start
            
            # Log progress
            if (episode + 1) % 10 == 0 or episode == 0:
                system_logger.info(
                    f"Episode {episode + 1}/{num_episodes} | "
                    f"Reward: {avg_episode_reward:.1f} | "
                    f"Avg(20): {avg_reward:.1f} | "
                    f"Wait: {stats['average_wait_time']:.1f}s | "
                    f"Served: {stats['total_passengers_served']} | "
                    f"ε: {self.agents[list(self.agents.keys())[0]].epsilon:.3f} | "
                    f"Time: {episode_time:.1f}s"
                )
            
            # Save models periodically
            if (episode + 1) % Config.SAVE_INTERVAL == 0:
                self.save_models()
                system_logger.info(f"Models saved at episode {episode + 1}")
        
        training_time = time.time() - start_time
        
        system_logger.info(f"Training complete! Total time: {training_time:.1f}s")
        
        # Final save
        self.save_models()
        
        # Print training summary
        self.print_summary()
    
    def save_models(self):
        """Save all agent models"""
        coordinator.save_all_models()
        
        # Save training history
        history_file = os.path.join(Config.MODELS_DIR, 'training_history.npy')
        np.save(history_file, self.training_history)
        system_logger.info(f"Training history saved to {history_file}")
    
    def load_models(self):
        """Load all agent models"""
        success = coordinator.load_all_models()
        
        # Try to load training history
        history_file = os.path.join(Config.MODELS_DIR, 'training_history.npy')
        if os.path.exists(history_file):
            self.training_history = np.load(history_file, allow_pickle=True).item()
            system_logger.info("Training history loaded")
        
        return success
    
    def print_summary(self):
        """Print training summary"""
        print("\n" + "="*60)
        print("TRAINING SUMMARY")
        print("="*60)
        
        if self.training_history['episode_rewards']:
            print(f"Total Episodes: {len(self.training_history['episode_rewards'])}")
            print(f"Average Reward: {np.mean(self.training_history['episode_rewards']):.1f}")
            print(f"Best Episode Reward: {np.max(self.training_history['episode_rewards']):.1f}")
            print(f"Final Avg Reward (last 20): {self.training_history['avg_rewards'][-1]:.1f}")
            
            if self.training_history['avg_wait_times']:
                print(f"Average Wait Time: {np.mean(self.training_history['avg_wait_times']):.1f}s")
                print(f"Final Wait Time: {self.training_history['avg_wait_times'][-1]:.1f}s")
            
            if self.training_history['passengers_served']:
                print(f"Average Passengers Served: {np.mean(self.training_history['passengers_served']):.0f}")
                print(f"Total Passengers Served: {np.sum(self.training_history['passengers_served']):.0f}")
        
        print("\nAgent Statistics:")
        for agent_id, agent in self.agents.items():
            stats = agent.get_statistics()
            print(f"\n{agent_id}:")
            print(f"  Q-table states: {stats['q_table_stats']['states']}")
            print(f"  Total updates: {stats['q_table_stats']['total_updates']}")
            print(f"  Avg Q-value: {stats['q_table_stats']['avg_q_value']:.2f}")
            print(f"  Current epsilon: {stats['epsilon']:.4f}")
        
        print("="*60 + "\n")
    
    def evaluate(self, num_episodes: int = 10, max_steps: int = 500):
        """
        Evaluate trained agents (no learning, pure exploitation)
        
        Args:
            num_episodes: Number of evaluation episodes
            max_steps: Maximum steps per episode
        
        Returns:
            Dictionary with evaluation metrics
        """
        system_logger.info(f"Evaluating agents for {num_episodes} episodes...")
        
        eval_rewards = []
        eval_wait_times = []
        eval_passengers_served = []
        
        for episode in range(num_episodes):
            # Reset environment
            state = traffic_env.reset()
            
            # Reset agents
            for agent in self.agents.values():
                agent.reset()
            
            episode_reward = 0
            
            # Run episode (no training)
            for step in range(max_steps):
                observations = traffic_env.get_observations()
                
                # Get actions (training=False for pure exploitation)
                action_indices = coordinator.get_actions(observations, training=False)
                
                actions = {
                    bus_id: Config.ACTIONS[action_idx]
                    for bus_id, action_idx in action_indices.items()
                }
                
                next_observations, rewards, done = traffic_env.step(actions)
                
                episode_reward += sum(rewards.values())
                
                if done:
                    break
            
            stats = traffic_env.get_statistics()
            
            eval_rewards.append(episode_reward)
            eval_wait_times.append(stats['average_wait_time'])
            eval_passengers_served.append(stats['total_passengers_served'])
            
            system_logger.info(
                f"Eval Episode {episode + 1}: "
                f"Reward={episode_reward:.1f}, "
                f"Wait={stats['average_wait_time']:.1f}s, "
                f"Served={stats['total_passengers_served']}"
            )
        
        # Calculate averages
        results = {
            'avg_reward': np.mean(eval_rewards),
            'std_reward': np.std(eval_rewards),
            'avg_wait_time': np.mean(eval_wait_times),
            'avg_passengers_served': np.mean(eval_passengers_served),
            'all_rewards': eval_rewards,
            'all_wait_times': eval_wait_times,
            'all_passengers_served': eval_passengers_served
        }
        
        print("\n" + "="*60)
        print("EVALUATION RESULTS")
        print("="*60)
        print(f"Episodes: {num_episodes}")
        print(f"Average Reward: {results['avg_reward']:.1f} ± {results['std_reward']:.1f}")
        print(f"Average Wait Time: {results['avg_wait_time']:.1f}s")
        print(f"Average Passengers Served: {results['avg_passengers_served']:.0f}")
        print("="*60 + "\n")
        
        return results

# Create singleton trainer
trainer = Trainer()