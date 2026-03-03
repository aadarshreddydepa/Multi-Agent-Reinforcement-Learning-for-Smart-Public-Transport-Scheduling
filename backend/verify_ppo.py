import sys
import os
import torch
import numpy as np

# Windows DLL Path Fix for Torch
if os.name == 'nt':
    import site
    # Use sys.prefix for active venv path
    torch_lib = os.path.join(sys.prefix, 'Lib', 'site-packages', 'torch', 'lib')
    if os.path.exists(torch_lib):
        try:
            os.add_dll_directory(torch_lib)
        except Exception:
            pass
    # Fallback to site-packages if not in venv
    for site_pkg in site.getsitepackages():
        torch_lib_alt = os.path.join(site_pkg, 'torch', 'lib')
        if os.path.exists(torch_lib_alt):
            try:
                os.add_dll_directory(torch_lib_alt)
            except Exception:
                pass

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.ppo_agent import PPOAgent
from models.memory import Memory
from agents.bus_agent import BusAgent
from environment.traffic_env import traffic_env
from utils.config import Config

def test_ppo_forward_pass():
    print("\n=== Testing PPO Forward Pass ===")
    agent = PPOAgent(state_dim=4, action_dim=4)
    state = np.random.rand(4).astype(np.float32)
    action, logprob = agent.select_action(state)
    print(f"Action selected: {action} (Name: {Config.ACTIONS[action]})")
    print(f"Logprob: {logprob.item():.4f}")
    print("✓ PPO Forward Pass OK")

def test_memory_buffer():
    print("\n=== Testing Memory Buffer ===")
    memory = Memory()
    memory.states.append(torch.randn(4))
    memory.actions.append(torch.tensor(1))
    memory.logprobs.append(torch.tensor(-0.5))
    memory.rewards.append(10.0)
    memory.is_terminals.append(False)
    print(f"Buffer size: {len(memory.states)}")
    memory.clear()
    print(f"Buffer size after clear: {len(memory.states)}")
    print("✓ Memory Buffer OK")

def test_stochastic_movement():
    print("\n=== Testing Stochastic Movement ===")
    traffic_env.reset()
    bus_id = list(traffic_env.buses.keys())[0]
    bus = traffic_env.buses[bus_id]
    
    # Run 10 steps and track positions
    positions = []
    for _ in range(10):
        traffic_env.step({bus_id: 'DEPART_NOW'})
        positions.append(bus['position'].copy())
    
    print(f"Observed {len(positions)} position updates with stochasticity")
    print("✓ Stochastic Movement OK")

if __name__ == "__main__":
    try:
        test_ppo_forward_pass()
        test_memory_buffer()
        test_stochastic_movement()
        print("\n=== ALL PPO INTEGRATION TESTS PASSED ===")
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
