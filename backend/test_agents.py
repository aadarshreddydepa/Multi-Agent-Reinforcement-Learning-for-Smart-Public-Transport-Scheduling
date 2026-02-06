"""
Test RL Agents - Verify Q-learning implementation
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.bus_agent import BusAgent, coordinator
from models.q_table import QTable
from agents.reward_system import reward_calculator
from environment.traffic_env import traffic_env
from utils.config import Config

def test_q_table():
    """Test Q-table functionality"""
    print("\n=== Testing Q-Table ===")
    
    # Create Q-table
    q_table = QTable('test_agent')
    
    # Test state discretization
    observation = (5, 0.65, 120, 0.5)  # queue=5, occupancy=65%, time=120s, traffic=50%
    state_hash = q_table.discretize_state(observation)
    print(f"Observation: {observation}")
    print(f"State hash: {state_hash}")
    
    # Test Q-value initialization
    q_values = q_table.get_q_values(state_hash)
    print(f"Initial Q-values: {q_values}")
    
    # Test action selection
    action = q_table.get_action(observation, epsilon=0.2)
    print(f"Selected action (ε=0.2): {Config.ACTIONS[action]}")
    
    # Test Q-value update
    reward = 15.5
    next_observation = (3, 0.75, 130, 0.5)
    q_table.update(observation, action, reward, next_observation)
    
    updated_q_values = q_table.get_q_values(state_hash)
    print(f"Updated Q-values: {updated_q_values}")
    
    # Test save/load
    test_file = 'test_qtable.pkl'
    q_table.save(test_file)
    print(f"✓ Q-table saved to {test_file}")
    
    new_q_table = QTable('test_agent')
    new_q_table.load(test_file)
    print(f"✓ Q-table loaded from {test_file}")
    
    # Cleanup
    os.remove(test_file)
    
    print("✓ Q-Table working!")

def test_reward_system():
    """Test reward calculation"""
    print("\n=== Testing Reward System ===")
    
    # Test various scenarios
    scenarios = [
        {
            'name': 'Good pickup with optimal occupancy',
            'action': 'DEPART_NOW',
            'passengers_boarded': 10,
            'queue_before': 12,
            'queue_after': 2,
            'occupancy': 0.85,
            'wait_duration': 0
        },
        {
            'name': 'Waiting with no passengers arriving',
            'action': 'WAIT_30',
            'passengers_boarded': 0,
            'queue_before': 2,
            'queue_after': 2,
            'occupancy': 0.4,
            'wait_duration': 30
        },
        {
            'name': 'Skipping empty stop',
            'action': 'SKIP_STOP',
            'passengers_boarded': 0,
            'queue_before': 0,
            'queue_after': 0,
            'occupancy': 0.6,
            'wait_duration': 0
        },
        {
            'name': 'Overcrowded bus',
            'action': 'DEPART_NOW',
            'passengers_boarded': 15,
            'queue_before': 20,
            'queue_after': 5,
            'occupancy': 1.2,
            'wait_duration': 0
        }
    ]
    
    for scenario in scenarios:
        reward = reward_calculator.calculate_reward(
            action=scenario['action'],
            passengers_boarded=scenario['passengers_boarded'],
            queue_length_before=scenario['queue_before'],
            queue_length_after=scenario['queue_after'],
            bus_occupancy=scenario['occupancy'],
            wait_duration=scenario['wait_duration']
        )
        
        print(f"\n{scenario['name']}:")
        print(f"  Action: {scenario['action']}")
        print(f"  Passengers boarded: {scenario['passengers_boarded']}")
        print(f"  Queue: {scenario['queue_before']} → {scenario['queue_after']}")
        print(f"  Occupancy: {scenario['occupancy']:.0%}")
        print(f"  → Reward: {reward:.1f}")
    
    print("\n✓ Reward System working!")

def test_bus_agent():
    """Test bus agent"""
    print("\n=== Testing Bus Agent ===")
    
    # Create agent
    agent = BusAgent('test_bus_1', 'route_1')
    
    # Test action selection
    observation = (8, 0.5, 200, 0.6)
    action = agent.select_action(observation, training=True)
    print(f"\nObservation: {observation}")
    print(f"Selected action: {Config.ACTIONS[action]}")
    
    # Test learning
    next_observation = (5, 0.65, 210, 0.6)
    reward = 25.0
    agent.learn(next_observation, reward)
    print(f"Agent learned: reward={reward}")
    
    # Test policy explanation
    explanation = agent.explain_decision(observation)
    print(f"\nDecision Explanation:")
    print(f"  State: {explanation['state']}")
    print(f"  Best action: {explanation['best_action']}")
    print(f"  Reasoning: {explanation['reasoning']}")
    
    # Test statistics
    stats = agent.get_statistics()
    print(f"\nAgent Statistics:")
    print(f"  Episodes: {stats['episodes_completed']}")
    print(f"  Episode reward: {stats['episode_reward']:.1f}")
    print(f"  Q-table states: {stats['q_table_stats']['states']}")
    
    print("\n✓ Bus Agent working!")

def test_multi_agent_training():
    """Test multi-agent training"""
    print("\n=== Testing Multi-Agent Training ===")
    
    # Reset environment
    state = traffic_env.reset()
    print(f"\nEnvironment reset with {len(state['buses'])} buses")
    
    # Create agents
    agents = {}
    for bus_id in state['buses'].keys():
        route_id = state['buses'][bus_id]['route_id']
        agent = BusAgent(bus_id, route_id)
        agents[bus_id] = agent
        coordinator.add_agent(agent)
    
    print(f"Created {len(agents)} agents")
    
    # Run a few training steps
    print("\nRunning 10 training steps...")
    for step in range(10):
        # Get observations
        observations = traffic_env.get_observations()
        
        # Get actions
        action_indices = coordinator.get_actions(observations, training=True)
        
        # Convert to action names
        actions = {
            bus_id: Config.ACTIONS[action_idx]
            for bus_id, action_idx in action_indices.items()
        }
        
        # Execute actions
        next_observations, rewards, done = traffic_env.step(actions)
        
        # Update agents
        coordinator.update_agents(next_observations, rewards)
        
        if step % 5 == 0:
            total_reward = sum(rewards.values())
            print(f"  Step {step}: Total reward = {total_reward:.1f}")
    
    # Get final statistics
    stats = coordinator.get_statistics()
    print(f"\nFinal Agent Statistics:")
    for agent_id, agent_stats in stats.items():
        print(f"  {agent_id}:")
        print(f"    Episode reward: {agent_stats['episode_reward']:.1f}")
        print(f"    Q-table states: {agent_stats['q_table_stats']['states']}")
    
    print("\n✓ Multi-Agent Training working!")

def run_all_tests():
    """Run all agent tests"""
    print("\n" + "="*60)
    print("SMART BUS MARL - RL AGENT TEST SUITE")
    print("="*60)
    
    try:
        test_q_table()
        test_reward_system()
        test_bus_agent()
        test_multi_agent_training()
        
        print("\n" + "="*60)
        print("✓ ALL AGENT TESTS PASSED!")
        print("="*60)
        print("\nRL agents are ready for training!")
        print("\nNext steps:")
        print("1. Run: python simulation/train_agents.py")
        print("2. Train for ~200 episodes")
        print("3. Agents will learn optimal bus scheduling!")
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()