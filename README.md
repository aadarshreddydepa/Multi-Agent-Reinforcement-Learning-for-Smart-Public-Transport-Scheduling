# 🚌 Smart Bus Multi-Agent Reinforcement Learning System

**College Major Project - Real-Time Adaptive Bus Scheduling**

An intelligent public transport management system where each bus acts as an autonomous AI agent. Using Multi-Agent Reinforcement Learning (MARL) with Proximal Policy Optimization (PPO), buses learn optimal decisions for departure timing, wait duration, and stop skipping to maximize efficiency and passenger satisfaction.

---

## 🎯 What This System Does

### System Overview

This project implements a Multi-Agent Reinforcement Learning (MARL) system for intelligent public bus transportation management. Unlike traditional fixed-schedule bus systems that operate on predetermined timetables regardless of actual demand, this system creates autonomous intelligent agents where each bus operates as an independent decision-making entity capable of learning, adapting, and optimizing its behavior based on real-time conditions.

The fundamental innovation of this system lies in its ability to transform passive transportation vehicles into active learning agents. Each bus continuously observes its environment, evaluates multiple competing objectives, and makes optimal decisions that balance passenger satisfaction with operational efficiency. The system addresses the classic problem of public transportation inefficiency where buses either run empty during low-demand periods or become overcrowded during peak times while passengers wait excessively.

### Core Concept and Motivation

Traditional bus scheduling systems rely on static timetables created months in advance based on historical averages. These schedules cannot adapt to dynamic real-world variations such as sudden passenger surges from events, unexpected traffic conditions, or changing demand patterns throughout the day. The result is inefficient service: buses running empty during off-peak hours wastes fuel and operational costs, while insufficient capacity during rush hours leads to passenger dissatisfaction and long wait times.

This MARL system addresses these inefficiencies by implementing the following intelligent behaviors:

**Learning from Experience**: Each bus operates as a Proximal Policy Optimization (PPO) based reinforcement learning agent. Rather than following fixed rules, the agent learns through trial and error which decisions lead to better outcomes. Over hundreds of training episodes, the agent discovers optimal policies for different scenarios - learning for example that waiting at high-demand stops increases total passenger throughput while skipping empty stops improves fuel efficiency without impacting service quality.

**Demand Adaptation**: The system dynamically responds to passenger demand patterns. During rush hours when queues build up at major stops, the AI agents learn to minimize wait times by departing quickly and coordinating service frequency. During off-peak periods when demand drops, agents learn to consolidate service by skipping stops where no passengers are waiting and optimizing routes for fuel efficiency. This demand-responsive behavior emerges naturally from the reward structure without requiring explicit programming for each scenario.

**Multi-Objective Optimization**: The reward function is carefully designed to balance three competing objectives: minimizing passenger wait times (service quality), maximizing bus occupancy (operational efficiency), and minimizing unnecessary idle time (fuel consumption and environmental impact). The AI learns trade-offs between these objectives - understanding that occasionally making passengers wait slightly longer can significantly improve overall system efficiency by allowing better passenger consolidation.

**Real-Time Decision Making**: Every 0.3 seconds of simulated time, each active bus agent evaluates its current situation and selects from four possible actions: depart immediately, wait for 30 seconds, wait for 60 seconds, or skip the current stop entirely. This rapid decision cycle allows the system to respond immediately to changing conditions such as passenger arrivals or changing traffic patterns.

### Real-World Analogy

To understand how this system operates, consider the decision-making process of an experienced human bus driver with perfect information:

The driver approaches a bus stop and observes multiple factors simultaneously. They notice a queue of twenty passengers waiting at the stop, indicating high demand. They check their current passenger count and see the bus is approximately eighty percent full, suggesting good utilization with some remaining capacity. They consider how long they have been waiting at this stop and note that no other buses are currently serving this route nearby. Based on this assessment, the driver decides to wait thirty seconds before departing, anticipating that the high queue indicates continued passenger arrivals and the partial capacity provides room for additional passengers.

This MARL system automates exactly this type of contextual decision-making. However, unlike human drivers who develop intuition over years of experience, these AI agents can learn optimal policies through thousands of simulated scenarios in hours. Furthermore, the agents can discover non-intuitive strategies that human operators might not consider, such as optimal patterns of stop-skipping during specific demand conditions or coordination strategies where buses implicitly distribute themselves across routes based on learned expectations of demand patterns.

The system essentially creates a fleet of intelligent agents that collectively learn to provide adaptive, efficient public transportation service that responds to actual demand rather than predicted averages.

---

## �️ System Architecture

### High-Level Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HOW THE SYSTEM WORKS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FRONTEND (Next.js + React)              BACKEND (Flask + Python)       │
│   ┌─────────────────────┐                  ┌─────────────────────────────┐   │
│   │ Interactive Map     │◄────WebSocket────┤ Traffic Environment         │   │
│   │ - Bus markers       │   (real-time)    │ - Bus positions             │   │
│   │ - Stop markers      │                  │ - Passenger queues          │   │
│   │ - Route lines       │◄────REST API─────┤ - Simulation state          │   │
│   └─────────────────────┘                  └─────────────────────────────┘   │
│          │                                            │                     │
│          │                                            │                     │
│   ┌──────▼──────┐                            ┌───────▼────────┐            │
│   │ Dashboard   │                            │  MARL Agents   │            │
│   │ - Controls  │                            │  (PPO Neural   │            │
│   │ - Stats     │                            │   Networks)    │            │
│   │ - Fleet     │                            │                │            │
│   └─────────────┘                            └────────────────┘            │
│                                                       │                     │
│                              ┌──────────────────────┘                     │
│                              ▼                                              │
│                    ┌───────────────────┐                                   │
│                    │ Decision Loop     │                                   │
│                    │ (every 0.3s):     │                                   │
│                    │ 1. Observe state  │                                   │
│                    │ 2. PPO → action   │                                   │
│                    │ 3. Execute        │                                   │
│                    │ 4. Get reward     │                                   │
│                    │ 5. Learn          │                                   │
│                    └───────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Explanation

The system follows a client-server architecture with clear separation between the user interface and the simulation engine. This separation enables the system to run the computationally intensive reinforcement learning algorithms on the backend while providing a responsive, visually rich interface on the frontend.

**Frontend Layer**: The user interface is built using Next.js with React components. The map visualization uses Leaflet to display an interactive map showing real-time bus positions, stop locations, and route paths. When a user interacts with the system - such as clicking the start button or adding a new bus - the frontend sends HTTP requests to the backend API and establishes WebSocket connections for real-time updates. The dashboard components provide controls for simulation management and display statistics panels showing performance metrics like passenger wait times, bus occupancy rates, and cumulative passengers served.

**Backend Layer**: The Flask server handles two primary responsibilities. First, it serves REST API endpoints that allow the frontend to request data (such as route information or bus states) and send commands (such as starting the simulation or adding buses). Second, it maintains persistent WebSocket connections that push real-time updates to connected clients whenever the simulation state changes.

**Traffic Environment**: At the core of the backend is the Traffic Environment, which maintains the complete state of the simulation including bus positions, passenger queues at stops, and the passage of simulated time. This environment runs on its own thread when the simulation is active, updating every 0.3 seconds to advance the simulation state.

**MARL Agents**: Each bus in the simulation is associated with a PPO agent that makes decisions independently. These agents are implemented as neural networks that take observations from the environment and output action probabilities. The agents do not communicate directly with each other - instead, they share the common environment and learn to coordinate implicitly through the reward structure.

**Data Flow**: The communication flow operates as follows: When the simulation runs, the Traffic Environment updates bus positions and passenger states. At each decision point, the environment queries the MARL agents for actions. After executing actions and calculating rewards, the environment broadcasts updated states via WebSocket to all connected frontend clients, which then render the new positions and statistics.

---

## 🤖 The AI: How MARL Works

### What is Multi-Agent Reinforcement Learning?

Reinforcement Learning is a machine learning paradigm where an agent learns to make decisions by interacting with an environment. Unlike supervised learning where the system learns from labeled examples, or unsupervised learning where the system finds patterns in unlabeled data, reinforcement learning learns through trial and error guided by rewards and penalties. The agent observes the current state of the environment, selects an action, receives a reward or penalty based on the outcome, and gradually learns which actions lead to the best long-term results.

In the context of this bus scheduling system, each bus acts as an autonomous agent. When a bus arrives at a stop, it observes its current situation - how many passengers are waiting, how full the bus already is, how long it has been waiting, and current traffic conditions. Based on these observations, the agent selects an action such as departing immediately or waiting longer. The environment then provides feedback in the form of a reward signal that indicates whether the decision was good or bad. If the bus picks up many passengers and maintains good occupancy, it receives positive rewards. If it skips stops where passengers are waiting or wastes fuel through excessive idling, it receives negative rewards. Over thousands of such interactions, the agent learns a policy - a mapping from situations to actions - that maximizes its cumulative reward.

Multi-Agent Reinforcement Learning extends this concept to scenarios where multiple agents operate simultaneously in a shared environment. In this system, each bus is an independent agent with its own neural network and learning process. All agents share the same traffic environment and compete for shared resources like road capacity and passenger pickups. This creates a complex dynamic where the optimal policy for one agent depends on the behaviors of other agents. The system implements decentralized learning where each agent makes independent decisions without explicit communication with other agents. Instead of coordinating through direct messaging, agents learn to coordinate implicitly through the shared reward structure and by observing the effects of other agents' actions in the environment state. For example, if one bus observes that another bus has just served a major stop, it might learn to skip that stop and proceed to the next one, effectively distributing service across the route without any explicit coordination protocol.

### Agent Design: PPO (Proximal Policy Optimization)

Each bus runs a **PPO Agent** with:

#### 1. Neural Network Architecture (Actor-Critic)
```
State Input (4 values)          Hidden Layer              Output
┌─────────────────┐            ┌───────────┐         ┌─────────────────┐
│ queue_length    │───────────▶│  128      │────────▶│ DEPART_NOW (p1) │
│ occupancy       │───────────▶│  neurons  │────────▶│ WAIT_30 (p2)    │
│ time_at_stop    │───────────▶│  ReLU     │────────▶│ WAIT_60 (p3)    │
│ traffic_level   │───────────▶│           │────────▶│ SKIP_STOP (p4)  │
└─────────────────┘            └───────────┘         └─────────────────┘
                                                          + State Value
```

- **Actor**: Decides which action to take (policy)
- **Critic**: Evaluates how good the current state is (value function)
- Both share a neural network backbone for efficiency

#### 2. State Space (What the Agent Observes)
```python
observation = (
    queue_length,      # How many passengers waiting (0-20+)
    occupancy,         # Bus fill level (0.0 - 1.0+)
    time_at_stop,      # Seconds spent at current stop
    traffic_level      # Road congestion (0.0 - 1.0)
)
```

#### 3. Action Space (What the Agent Can Do)
| Action | Description | When Useful |
|--------|-------------|-------------|
| `DEPART_NOW` | Leave immediately | Bus is full or no passengers waiting |
| `WAIT_30` | Wait 30 seconds | Moderate demand, space available |
| `WAIT_60` | Wait 60 seconds | High demand, bus has capacity |
| `SKIP_STOP` | Don't stop at all | Empty stop, express service |

#### 4. Reward Function (What the Agent Learns to Maximize)
```python
def calculate_reward(action, passengers_boarded, queue_before, 
                     queue_after, occupancy, wait_duration):
    reward = 0
    
    # +10 per passenger picked up
    reward += 10 * passengers_boarded
    
    # +15 for optimal occupancy (80-100% full)
    if 0.8 <= occupancy <= 1.0:
        reward += 15
    
    # -2 per passenger still waiting (fairness penalty)
    reward -= 2 * queue_after
    
    # -5 per minute of idle time (fuel waste)
    reward -= 5 * (wait_duration / 60)
    
    # Action-specific rewards
    if action == 'SKIP_STOP' and queue_before == 0:
        reward += 8  # Efficient skip
    elif action == 'SKIP_STOP' and queue_before > 0:
        reward -= 15 * queue_before  # Penalty for skipping passengers!
    
    return reward
```

### Training Process
```
Episode = One simulation run (0-30 minutes simulated time)

For each episode:
    Reset environment (random passenger demand)
    For each step (0.3s intervals):
        1. Each bus observes its state
        2. PPO network outputs action probabilities
        3. Bus samples an action
        4. Environment executes action, returns reward
        5. Store (state, action, reward) in memory
        6. Every N steps: Update PPO network
    End when episode time limit reached
    
Repeat for 100-500 episodes until agents converge
```

### Training Process Explanation

The training of MARL agents follows an episodic structure where each episode represents a complete simulation run. An episode typically spans 30 minutes of simulated time, during which buses navigate their routes, pick up passengers, and make hundreds of individual decisions. The training begins by resetting the environment to a random initial state with randomly generated passenger demand patterns. This randomization ensures that agents learn to handle diverse scenarios rather than memorizing specific situations.

During each episode, the system operates in discrete time steps of 0.3 seconds. At every step, the simulation advances: passenger demand is updated with new arrivals, buses move along their routes, and most importantly, each bus agent observes its current state and makes a decision. The observation consists of four values: the number of passengers waiting at the current stop, the bus occupancy level, how long the bus has been waiting at this stop, and the current traffic congestion level. These observations feed into the PPO neural network which outputs probability distributions over the four possible actions.

The agent samples an action from these probabilities - this introduces exploration during training. Rather than always selecting the action with highest probability, the agent sometimes tries suboptimal actions to discover potentially better strategies. After the action executes, the environment calculates a reward based on outcomes like how many passengers boarded and whether the bus maintained good occupancy. This reward signal provides the learning feedback that guides policy improvement.

The PPO algorithm maintains a memory buffer that stores recent experiences - sequences of states, actions taken, rewards received, and whether episodes terminated. Periodically, typically after a fixed number of steps or when an episode ends, the algorithm performs a policy update using this stored experience. The update process runs multiple epochs over the collected data, adjusting the neural network weights to increase the probability of actions that led to high rewards and decrease the probability of actions that led to low rewards.

A critical aspect of PPO is the clipping mechanism that prevents the policy from changing too drastically in a single update. The algorithm calculates a ratio between the new policy probability and the old policy probability for each action. If this ratio exceeds a threshold (typically 1.2 or falls below 0.8), the update is clipped to prevent destabilizing changes. This conservative approach ensures stable learning and prevents the common reinforcement learning problem of policy collapse where performance suddenly degrades due to overly aggressive updates.

The training continues for hundreds of episodes, with the agent gradually improving its performance. Early episodes show random or suboptimal behavior as the agent explores the action space. As training progresses, the agent develops sophisticated strategies - learning when to wait for more passengers, when to skip empty stops, and how to balance occupancy with service frequency. Convergence is achieved when the average reward per episode plateaus and the agent consistently makes sensible decisions across diverse scenarios.

---

## 🛠️ Technology Stack

### Frontend (User Interface)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 16 + React 19 | App structure, routing |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS 4 | Responsive UI |
| Icons | Lucide React | Consistent iconography |
| Maps | Leaflet + React-Leaflet | Interactive maps |
| Animations | Framer Motion | Smooth bus movements |
| Charts | Recharts | Statistics visualization |
| Real-time | Socket.IO Client | WebSocket connection |
| HTTP | Axios | API requests |

### Backend (Simulation & AI)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Flask 3.0 | REST API server |
| WebSocket | Flask-SocketIO 5.3 | Real-time communication |
| ML Engine | PyTorch 2.0+ | Neural network training |
| RL Library | Stable-Baselines3 | PPO implementation reference |
| Data | NumPy, Pandas | Array/tensor operations |
| Environment | Eventlet | Async WebSocket handling |

---

## 📁 Project Structure

```
MARL/
├── 📁 backend/                          # Flask API + ML Engine
│   ├── app.py                          # Main Flask application
│   ├── requirements.txt                # Python dependencies
│   │
│   ├── 📁 agents/                      # RL Agent Implementations
│   │   ├── bus_agent.py               # PPO agent per bus + MultiAgentCoordinator
│   │   ├── marl_agents.py             # Agent initialization logic
│   │   └── reward_system.py           # Reward calculation logic
│   │
│   ├── 📁 environment/                # Simulation Environment
│   │   ├── traffic_env.py             # Main simulation engine
│   │   ├── route_manager.py           # Route/stop data management
│   │   └── passenger_demand.py        # Passenger generation & queues
│   │
│   ├── 📁 models/                     # Neural Network Models
│   │   ├── ppo_agent.py               # Actor-Critic PPO implementation
│   │   ├── memory.py                  # Experience buffer for PPO
│   │   └── training.py                # Training loop & evaluation
│   │
│   ├── 📁 data/                       # Static Data Files
│   │   ├── routes.json                # 5 Hyderabad bus routes
│   │   ├── stops.json                 # 62 bus stop locations
│   │   └── trained_models/            # Saved PPO model weights
│   │
│   └── 📁 utils/                      # Utilities
│       ├── config.py                  # Hyperparameters & settings
│       └── logger.py                  # Logging setup
│
├── 📁 frontend/                       # Next.js Application
│   ├── app/page.tsx                  # Main dashboard page
│   ├── app/layout.tsx                # Root layout
│   ├── package.json                  # Node dependencies
│   │
│   ├── 📁 components/                 # React Components
│   │   ├── 📁 map/                   # Map Visualization
│   │   │   ├── Map.tsx               # Main map container
│   │   │   ├── BusMarker.tsx         # Animated bus markers
│   │   │   ├── StopMarker.tsx        # Stop markers with demand
│   │   │   └── RouteVisualization.tsx # Colored route lines
│   │   │
│   │   ├── 📁 dashboard/             # Control Panels
│   │   │   ├── ControlPanel.tsx      # Start/stop/reset buttons
│   │   │   ├── FleetManager.tsx      # Add/remove buses
│   │   │   ├── StatisticsPanel.tsx   # Live metrics display
│   │   │   └── EventLog.tsx          # System notifications
│   │   │
│   │   ├── 📁 charts/                # Data Visualization
│   │   │   └── AdvancedCharts.tsx    # Performance graphs
│   │   │
│   │   └── 📁 ui/                    # UI Components
│   │       └── ThemeToggle.tsx       # Dark/light mode
│   │
│   └── 📁 contexts/                  # React Context
│       └── ThemeContext.tsx           # Theme management
│
├── 📁 simulation/                     # Standalone Training
│   └── tarin_agents.py               # Offline training script
│
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Git**

### Step 1: Clone and Setup Backend
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```
Backend runs at `http://localhost:5001`

### Step 2: Setup Frontend (New Terminal)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend opens at `http://localhost:3000`

### Step 3: Use the System
1. Open `http://localhost:3000` in browser
2. Click **▶️ Start Simulation** button
3. Watch buses move on the map making AI decisions
4. View real-time statistics in the right panel

---

## 🎮 How to Use

### Dashboard Controls
- **Start**: Begin simulation with AI agents making decisions
- **Stop**: Pause simulation
- **Reset**: Clear all buses and restart
- **Add Bus**: Manually add a bus to any route
- **Train Agents**: Run offline training (see below)

### Training Modes

#### 1. Online Training (via Web Interface)
```bash
# Start backend, then:
curl -X POST http://localhost:5001/api/training/start \
  -H "Content-Type: application/json" \
  -d '{"num_episodes": 100}'
```
Agents train in background while you watch progress.

#### 2. Offline Training (Standalone Script)
```bash
cd simulation
python tarin_agents.py
```
Interactive prompt for training episodes, then saves models to `backend/data/trained_models/`.

### Using Trained Models
When starting simulation, add parameter:
```javascript
// In frontend or API call
fetch('/api/simulation/start', {
  method: 'POST',
  body: JSON.stringify({ use_trained_agents: true })
})
```

---

## 🔌 API Endpoints

### API Overview

The system exposes a dual communication interface combining REST API endpoints for command and configuration operations with WebSocket connections for real-time data streaming. This hybrid approach provides the benefits of HTTP's simplicity for stateless operations while enabling efficient bidirectional communication for time-sensitive simulation updates.

The REST API follows standard HTTP conventions using GET requests for data retrieval and POST requests for actions that modify system state. All endpoints return JSON responses with consistent structure including success flags and appropriate HTTP status codes. The API supports cross-origin requests allowing the frontend application running on a different port to communicate with the backend seamlessly.

### REST API

The following endpoints provide programmatic access to system functionality:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Returns current system status including whether simulation is running, number of active buses, number of initialized agents, and current simulation time |
| `/api/config` | GET | Returns system configuration including bus capacity, simulation speed, update intervals, available actions, and map center coordinates |
| `/api/routes` | GET | Returns all route definitions with stop sequences, colors, and metadata |
| `/api/routes/road-paths` | GET | Returns real road coordinates for route visualization using OSRM routing data |
| `/api/buses` | GET | Returns complete state of all buses including positions, occupancy, routes, and passenger counts |
| `/api/stops` | GET | Returns all stop information including locations, names, and current queue lengths |
| `/api/stats` | GET | Returns performance statistics including average wait times, passengers served, and occupancy rates |
| `/api/simulation/start` | POST | Starts the simulation with optional parameters for using trained agents |
| `/api/simulation/stop` | POST | Stops the currently running simulation |
| `/api/simulation/reset` | POST | Resets simulation to initial state clearing all buses and statistics |
| `/api/buses/add` | POST | Adds a new bus to a specified route with given initial stop |
| `/api/training/start` | POST | Initiates background training process for specified number of episodes |
| `/api/agent/<id>/decision` | GET | Returns explanation of why a specific agent made its last decision |

### WebSocket Communication

WebSocket connections provide real-time bidirectional communication between the backend simulation engine and connected frontend clients. When the simulation runs, the backend pushes updates continuously rather than requiring the frontend to poll for changes. This reduces latency and network overhead while enabling smooth real-time visualization.

The WebSocket implementation uses Socket.IO which provides automatic reconnection, fallback transports, and room-based message routing. The backend maintains a list of connected clients and broadcasts simulation updates to all connected browsers simultaneously.

### WebSocket Events

| Event | Direction | Payload Description |
|-------|-----------|---------------------|
| `simulation_update` | Backend → Frontend | Complete simulation state including all bus positions, states, passenger counts, and current time |
| `statistics_update` | Backend → Frontend | Aggregated performance metrics sent every 5 simulation seconds |
| `stop_demand_update` | Backend → Frontend | Real-time passenger queue counts for each stop with location coordinates |
| `training_started` | Backend → Frontend | Notification when training begins with episode count |
| `training_complete` | Backend → Frontend | Notification when training finishes with summary statistics |

### API Usage Patterns

Typical frontend usage follows this pattern: On page load, the frontend makes GET requests to `/api/routes` and `/api/stops` to populate initial map data. When the user clicks the start button, the frontend sends a POST to `/api/simulation/start` and simultaneously opens a WebSocket connection. The backend begins broadcasting `simulation_update` events every 0.3 seconds which the frontend renders as animated bus movements. Concurrently, `statistics_update` events update dashboard panels showing performance metrics.

---

## ⚙️ Configuration

### Key Settings (`backend/utils/config.py`)
```python
# Simulation
UPDATE_INTERVAL = 0.3       # Seconds between simulation steps
SIMULATION_SPEED = 1.0      # Time acceleration factor
BUS_SPEED = 0.08           # Bus movement speed (lat/lng per step)
BUS_CAPACITY = 50           # Max passengers per bus

# RL Training
LEARNING_RATE = 0.001       # PPO learning rate
GAMMA = 0.99               # Discount factor for future rewards
EPS_CLIP = 0.2             # PPO clipping parameter
PPO_EPOCHS = 10            # Training epochs per update

# Reward Weights
REWARD_PASSENGER_PICKUP = 10
REWARD_OPTIMAL_OCCUPANCY = 15
PENALTY_WAIT_TIME = -2
PENALTY_FUEL = -5
```

---

## 📊 Performance Metrics

The system tracks:
- **Average Wait Time** - How long passengers wait at stops
- **Passengers Served** - Total boardings per episode
- **Bus Occupancy** - Average fill percentage
- **Reward per Episode** - AI learning progress
- **Queue Lengths** - Demand at each stop

---

## 🎓 Learning Resources

### Understanding PPO
- [PPO Paper (Schulman et al., 2017)](https://arxiv.org/abs/1707.06347)
- [Stable-Baselines3 PPO Docs](https://stable-baselines3.readthedocs.io/en/master/modules/ppo.html)
- [Spinning Up in RL - PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html)

### Multi-Agent RL
- [Multi-Agent Reinforcement Learning Basics](https://www.researchgate.net/publication/323951626_Multi-agent_systems)
- [MARL Survey Paper](https://arxiv.org/abs/1810.05492)

### Tools Used
- [Next.js Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Leaflet Documentation](https://leafletjs.com/)

---

## 👥 Team

- **Aadarsh Reddy Depa** - 22VE1A6612
- **P Divyavani** - 22VE1A6646  
- **MD Imran** - 22VE1A6637
- **V Vivek** - 22VE1A6663

**Department**: CSE (AI & ML)

---

**Version**: 2.0  
**Last Updated**: April 2025  
**Status**: Production Ready

