"""
Reward System - Calculates rewards for RL agents
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import Config
from utils.logger import agent_logger

class RewardCalculator:
    """Calculates rewards for bus agent actions"""
    
    def __init__(self):
        """Initialize reward calculator"""
        agent_logger.info("RewardCalculator initialized")
    
    def calculate_reward(self, 
                        action: str,
                        passengers_boarded: int,
                        queue_length_before: int,
                        queue_length_after: int,
                        bus_occupancy: float,
                        wait_duration: float = 0) -> float:
        """
        Calculate reward for an action
        
        Args:
            action: Action taken (DEPART_NOW, WAIT_30, etc.)
            passengers_boarded: Number of passengers who boarded
            queue_length_before: Queue length before action
            queue_length_after: Queue length after action
            bus_occupancy: Bus occupancy percentage (0.0 to 1.0+)
            wait_duration: Time bus waited (seconds)
        
        Returns:
            Total reward value
        """
        reward = 0
        
        # 1. REWARD: Passengers picked up
        pickup_reward = Config.REWARD_PASSENGER_PICKUP * passengers_boarded
        reward += pickup_reward
        
        # 2. REWARD/PENALTY: Bus occupancy
        if 0.8 <= bus_occupancy <= 1.0:
            # Optimal occupancy (80-100% full)
            reward += Config.REWARD_OPTIMAL_OCCUPANCY
        elif 0.6 <= bus_occupancy < 0.8:
            # Good utilization - efficient
            reward += getattr(Config, 'REWARD_GOOD_OCCUPANCY', 8)
        elif bus_occupancy > 1.0:
            # Overcrowding penalty
            reward += Config.PENALTY_OVERCROWDING
        elif bus_occupancy < 0.3 and passengers_boarded > 0:
            # Underutilized bus (minor penalty)
            reward -= 3
        
        # 3. PENALTY: Passengers waiting
        # Each passenger waiting incurs a small penalty per second
        if queue_length_after > 0:
            wait_penalty = Config.PENALTY_WAIT_TIME * queue_length_after
            reward += wait_penalty
        
        # 4. ACTION-SPECIFIC REWARDS/PENALTIES
        if action == 'DEPART_NOW':
            # Good: Quick decision, efficient
            if passengers_boarded > 0:
                reward += 5  # Efficiency bonus
        
        elif action == 'WAIT_30':
            # Neutral to slightly negative if no passengers arrive
            if queue_length_before == queue_length_after:
                reward -= 3  # Wasted time
            else:
                reward += 2  # More passengers arrived
        
        elif action == 'WAIT_60':
            # Higher penalty for long wait if unproductive
            if queue_length_before == queue_length_after:
                reward -= 8  # Significant waste
            elif queue_length_after > queue_length_before + 5:
                reward += 5  # Good decision, many passengers arrived
        
        elif action == 'SKIP_STOP':
            if queue_length_before == 0:
                # Good: Efficiently skipped empty stop
                reward += 8
            else:
                # Bad: Skipped passengers
                reward -= 15 * queue_length_before
        
        # 5. FUEL EFFICIENCY
        # Penalize unnecessary waiting (fuel consumption while idle)
        if wait_duration > 0:
            fuel_penalty = Config.PENALTY_FUEL * (wait_duration / 60)  # Per minute
            reward += fuel_penalty
        
        # 6. SERVICE QUALITY
        # Reward for reducing queue
        queue_reduction = queue_length_before - queue_length_after
        if queue_reduction > 0:
            reward += queue_reduction * 2  # Bonus for clearing queue
        
        agent_logger.debug(f"Reward for {action}: {reward:.1f} (boarded={passengers_boarded}, occupancy={bus_occupancy:.0%})")
        
        return reward
    
    def calculate_episode_reward(self, 
                                 total_passengers_served: int,
                                 average_wait_time: float,
                                 average_occupancy: float,
                                 total_idle_time: float) -> float:
        """
        Calculate overall episode reward
        
        Args:
            total_passengers_served: Total passengers served in episode
            average_wait_time: Average passenger wait time (seconds)
            average_occupancy: Average bus occupancy (0.0 to 1.0)
            total_idle_time: Total time buses were idle (seconds)
        
        Returns:
            Episode reward
        """
        reward = 0
        
        # Reward for total passengers served
        reward += total_passengers_served * 5
        
        # Penalty for high average wait time
        if average_wait_time > 120:  # More than 2 minutes
            reward -= (average_wait_time - 120) * 0.5
        elif average_wait_time < 60:  # Less than 1 minute
            reward += 50
        
        # Reward for good average occupancy
        if 0.6 <= average_occupancy <= 0.9:
            reward += 100
        
        # Penalty for excessive idle time
        if total_idle_time > 300:  # More than 5 minutes
            reward -= (total_idle_time - 300) * 0.1
        
        return reward
    
    def get_reward_breakdown(self,
                            action: str,
                            passengers_boarded: int,
                            queue_length_before: int,
                            queue_length_after: int,
                            bus_occupancy: float,
                            wait_duration: float = 0) -> dict:
        """
        Get detailed breakdown of reward components
        Useful for debugging and analysis
        """
        breakdown = {
            'pickup_reward': Config.REWARD_PASSENGER_PICKUP * passengers_boarded,
            'occupancy_reward': 0,
            'wait_penalty': 0,
            'action_bonus': 0,
            'fuel_penalty': 0,
            'queue_reduction_bonus': 0
        }
        
        # Occupancy
        if 0.8 <= bus_occupancy <= 1.0:
            breakdown['occupancy_reward'] = Config.REWARD_OPTIMAL_OCCUPANCY
        elif bus_occupancy > 1.0:
            breakdown['occupancy_reward'] = Config.PENALTY_OVERCROWDING
        
        # Wait penalty
        if queue_length_after > 0:
            breakdown['wait_penalty'] = Config.PENALTY_WAIT_TIME * queue_length_after
        
        # Fuel
        if wait_duration > 0:
            breakdown['fuel_penalty'] = Config.PENALTY_FUEL * (wait_duration / 60)
        
        # Queue reduction
        queue_reduction = queue_length_before - queue_length_after
        if queue_reduction > 0:
            breakdown['queue_reduction_bonus'] = queue_reduction * 2
        
        breakdown['total'] = sum(breakdown.values())
        
        return breakdown

# Create singleton instance
reward_calculator = RewardCalculator()