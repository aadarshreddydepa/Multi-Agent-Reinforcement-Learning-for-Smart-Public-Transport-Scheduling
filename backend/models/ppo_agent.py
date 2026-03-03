import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Tuple

class ActorCritic(nn.Module):
    """
    Unified Actor-Critic Network for PPO
    """
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super(ActorCritic, self).__init__()
        
        # Shared feature extractor
        self.affine = nn.Linear(state_dim, hidden_dim)
        
        # Actor head (policy)
        self.action_head = nn.Linear(hidden_dim, action_dim)
        
        # Critic head (value estimation)
        self.value_head = nn.Linear(hidden_dim, 1)
        
    def forward(self, state: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass
        Returns action probabilities and state value
        """
        x = F.relu(self.affine(state))
        
        # Categorical distribution for discrete actions
        state_values = self.value_head(x)
        action_probs = F.softmax(self.action_head(x), dim=-1)
        
        return action_probs, state_values

class PPOAgent:
    """
    Proximal Policy Optimization Agent
    """
    def __init__(self, state_dim: int, action_dim: int, lr: float = 3e-4, gamma: float = 0.99, eps_clip: float = 0.2):
        self.policy = ActorCritic(state_dim, action_dim)
        self.optimizer = torch.optim.Adam(self.policy.parameters(), lr=lr)
        self.policy_old = ActorCritic(state_dim, action_dim)
        self.policy_old.load_state_dict(self.policy.state_dict())
        
        self.gamma = gamma
        self.eps_clip = eps_clip
        self.mse_loss = nn.MSELoss()
        
    def select_action(self, state: np.ndarray) -> Tuple[int, torch.Tensor]:
        state = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            action_probs, _ = self.policy_old(state)
        
        dist = torch.distributions.Categorical(action_probs)
        action = dist.sample()
        
        return action.item(), dist.log_prob(action)
    
    def update(self, memory):
        # Convert list to tensors
        old_states = torch.stack(memory.states).detach()
        old_actions = torch.stack(memory.actions).detach()
        old_logprobs = torch.stack(memory.logprobs).detach()
        rewards = memory.rewards
        is_terminals = memory.is_terminals
        
        # Monte Carlo estimate of state rewards/returns
        returns = []
        discounted_reward = 0
        for reward, is_terminal in zip(reversed(rewards), reversed(is_terminals)):
            if is_terminal:
                discounted_reward = 0
            discounted_reward = reward + (self.gamma * discounted_reward)
            returns.insert(0, discounted_reward)
            
        returns = torch.tensor(returns, dtype=torch.float32)
        returns = (returns - returns.mean()) / (returns.std() + 1e-5)
        
        # Optimize policy for K epochs:
        for _ in range(10): # K_epochs
            # Evaluating old actions and values
            logprobs, state_values = self.evaluate(old_states, old_actions)
            
            # Finding the ratio (pi_theta / pi_theta__old)
            ratios = torch.exp(logprobs - old_logprobs.detach())
            
            # Finding Surrogate Loss
            advantages = returns - state_values.detach()
            surr1 = ratios * advantages
            surr2 = torch.clamp(ratios, 1 - self.eps_clip, 1 + self.eps_clip) * advantages
            
            loss = -torch.min(surr1, surr2) + 0.5 * self.mse_loss(state_values, returns) - 0.01 * self.entropy(old_states)
            
            # take gradient step
            self.optimizer.zero_grad()
            loss.mean().backward()
            self.optimizer.step()
            
        # Copy new weights into old policy:
        self.policy_old.load_state_dict(self.policy.state_dict())
        
    def evaluate(self, state, action):
        action_probs, state_values = self.policy(state)
        dist = torch.distributions.Categorical(action_probs)
        action_logprobs = dist.log_prob(action)
        
        return action_logprobs, torch.squeeze(state_values)

    def entropy(self, state):
        action_probs, _ = self.policy(state)
        dist = torch.distributions.Categorical(action_probs)
        return dist.entropy()

    def save(self, checkpoint_path):
        torch.save(self.policy_old.state_dict(), checkpoint_path)
   
    def load(self, checkpoint_path):
        self.policy_old.load_state_dict(torch.load(checkpoint_path, map_location=lambda storage, loc: storage))
        self.policy.load_state_dict(torch.load(checkpoint_path, map_location=lambda storage, loc: storage))
