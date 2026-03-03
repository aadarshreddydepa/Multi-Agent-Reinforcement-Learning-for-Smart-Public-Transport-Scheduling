"""
MARL Agents Module - Handles PPO agent creation and binding
"""
import os
import sys
from typing import Dict

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.bus_agent import BusAgent, coordinator
from utils.logger import agent_logger

def initialize_agents(env):
    """
    Initialize one PPO agent per bus and bind to env.agents
    """
    agent_logger.info(f"Initializing MARL agents for {len(env.buses)} buses...")
    
    # Reset coordinator to clear stale agents
    coordinator.agents = {}
    env.agents = {}
    
    for bus_id, bus in env.buses.items():
        route_id = bus['route_id']
        
        # Create a new BusAgent (which internally uses PPOAgent)
        agent = BusAgent(bus_id, route_id)
        
        # Bind to coordinator (existing logic)
        coordinator.add_agent(agent)
        
        # Bind to environment (as requested)
        env.agents[bus_id] = agent
        
        agent_logger.info(f"Bound PPO agent to bus: {bus_id}")
    
    env.agents_initialized = True
    return env.agents
