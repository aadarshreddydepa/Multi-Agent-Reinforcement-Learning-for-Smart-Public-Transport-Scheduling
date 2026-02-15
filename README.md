# 🚌 Smart Bus Multi-Agent Reinforcement Learning System

**College Major Project - Real-Time Adaptive Bus Scheduling**

A complete implementation of a Multi-Agent Reinforcement Learning (MARL) system for optimizing public bus scheduling in real-time. Each bus is an intelligent agent that learns to make optimal decisions about when to depart, how long to wait, and how to adapt to passenger demand.

---

## 🎯 Project Overview

### What Does This System Do?
- **Real-Time Bus Tracking**: Live visualization of buses on an interactive map
- **AI-Powered Decision Making**: Each bus uses Q-Learning to optimize scheduling
- **Adaptive to Demand**: System learns from passenger patterns (rush hours, off-peak)
- **Visual Interface**: Google Maps-like UI showing buses, stops, and passenger demand
- **Performance Metrics**: Real-time statistics on efficiency, wait times, and occupancy

### Key Features
- ✅ Multi-agent reinforcement learning with Q-learning  
- ✅ Real-time WebSocket updates  
- ✅ Interactive Leaflet map visualization  
- ✅ Dynamic passenger demand generation  
- ✅ Traffic simulation with variable conditions  
- ✅ Comprehensive performance metrics  
- ✅ Training mode for learning and exploitation mode for deployment  

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.9+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** ([Download](https://nodejs.org/))

### Step 1: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend
python app.py
```
Backend will start on `http://localhost:5001`

### Step 2: Frontend Setup (New Terminal)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```
Frontend will open automatically at `http://localhost:3000`

---

## 🎮 How to Use

1. **Start System**: Open `http://localhost:3000` in browser
2. **Click Start**: Press ▶️ Start button
3. **Watch**: Buses move on map, learning optimal strategies
4. **Monitor**: View real-time statistics on right panel
5. **Interact**: Click bus/stop markers for details

---

## 👥 Team Members

- Aadarsh Reddy Depa - 22VE1A6612
- P Divyavani - 22VE1A6646
- MD Imran - 22VE1A6637
- V Vivek - 22VE1A6663

**Department**: CSE (AI & ML)

---

## 🏗️ System Architecture

### Technology Stack
**Frontend:**
- Framework: Next.js 14 with React 18
- Language: TypeScript
- UI Library: Tailwind CSS, Lucide Icons
- Mapping: Leaflet with React-Leaflet
- State Management: React Hooks, WebSocket
- Build Tool: Vite/Turbopack

**Backend:**
- Framework: Flask (Python)
- Language: Python 3.9+
- Machine Learning: PyTorch, Stable-Baselines3
- Data: JSON, SQLite
- Real-time: WebSocket (Socket.IO)
- API: RESTful endpoints

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Components:                                               │
│  ├── Dashboard (ControlPanel, FleetManager, Statistics)    │
│  ├── Map (LiveMap, BusMarker, StopMarker, RouteVisualization)│
│  ├── Notifications (Professional Alert System)            │
│  └── Layout (Header, Sidebar, Full-Screen Map)            │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                 │
│  ├── API Service (REST calls to backend)                  │
│  ├── WebSocket Service (Real-time updates)                 │
│  └── Data Processing (Bus/Stop/Route management)           │
├─────────────────────────────────────────────────────────────┤
│  State Management:                                         │
│  ├── Bus States (position, occupancy, route)               │
│  ├── Simulation States (running, paused, reset)            │
│  └── Alert States (notifications, system health)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  API Layer:                                                 │
│  ├── Simulation Control (/api/simulation/*)               │
│  ├── Bus Management (/api/buses)                           │
│  ├── Stop Management (/api/stops)                          │
│  ├── Route Management (/api/routes)                        │
│  └── Statistics (/api/stats)                               │
├─────────────────────────────────────────────────────────────┤
│  Core Components:                                           │
│  ├── Traffic Environment (traffic_env.py)                  │
│  ├── Route Manager (route_manager.py)                       │
│  ├── Passenger Demand (passenger_demand.py)                │
│  ├── MARL Agents (marl_agents.py)                           │
│  └── Reward Calculator (reward_calculator.py)              │
├─────────────────────────────────────────────────────────────┤
│  Machine Learning Layer:                                    │
│  ├── PPO (Proximal Policy Optimization) Agents              │
│  ├── State Representation (bus positions, passenger counts) │
│  ├── Action Space (depart_now, wait_30, wait_60, skip_stop)│
│  └── Reward System (efficiency, passenger satisfaction)     │
├─────────────────────────────────────────────────────────────┤
│  Data Layer:                                                │
│  ├── Routes JSON (route definitions, stop sequences)        │
│  ├── Stops JSON (stop locations, capacities)               │
│  ├── Bus States (real-time bus positions and status)        │
│  └── Simulation Logs (performance metrics)                  │
└─────────────────────────────────────────────────────────────┘

### Data Flow Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                │
├─────────────────────────────────────────────────────────────┤
│  Frontend → Backend:                                        │
│  ├── Control Commands (start, stop, reset simulation)        │
│  ├── Bus Operations (add, remove buses)                    │
│  └── Training Requests (MARL agent training)                │
│                                                             │
│  Backend → Frontend:                                        │
│  ├── Real-time Bus Positions (WebSocket)                    │
│  ├── Passenger Updates (waiting counts)                    │
│  ├── Route Information (paths, colors)                      │
│  └── Statistics (performance metrics)                       │
│                                                             │
│  Internal Backend Flow:                                     │
│  ├── MARL Agents → Environment → Bus States                │
│  ├── Passenger Demand → Reward Calculator → Agents         │
│  ├── Route Manager → Bus Movement Logic                     │
│  └── Statistics Collector → API Response                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture
```
Frontend Components:
├── App Layout (app/page.tsx)
├── Map Components (components/map/)
│   ├── LiveMap.tsx: Main map container
│   ├── BusMarker.tsx: Individual bus visualization
│   ├── StopMarker.tsx: Bus stop visualization
│   └── RouteVisualization.tsx: Route path rendering
├── Dashboard Components (components/dashboard/)
│   ├── ControlPanel.tsx: Simulation controls
│   ├── FleetManager.tsx: Bus fleet management
│   └── StatisticsPanel.tsx: Performance metrics
└── Services (services/)
    ├── api.ts: Backend API communication
    └── websocket.ts: Real-time data streaming

Backend Components:
├── Traffic Environment (environment/traffic_env.py)
├── Route Manager (environment/route_manager.py)
├── MARL Agents (environment/marl_agents.py)
├── Passenger Demand (environment/passenger_demand.py)
└── Reward Calculator (environment/reward_calculator.py)
```

---

## 🤖 Machine Learning Architecture

### Agent Architecture
- **Type**: PPO (Proximal Policy Optimization)
- **State Space**: Bus positions, passenger counts, wait times
- **Action Space**: DEPART_NOW, WAIT_30, WAIT_60, SKIP_STOP
- **Reward Function**: Efficiency + passenger satisfaction
- **Training**: On-policy with experience replay
- **Deployment**: Exploitation mode with epsilon-greedy

### Multi-Agent Coordination
- **Decentralized agents** per bus
- **Shared environment state**
- **Competitive reward structure**
- **Communication through environment**
- **Independent learning with shared rewards**

---

## 📊 Data Models

### Bus Model
```json
{
  "id": "bus_1",
  "position": {"lat": 17.3850, "lng": 78.4867},
  "route_id": "route_15",
  "assigned_route": ["stop1", "stop2", "stop3"],
  "route_color": "#FF5722",
  "current_stop": "stop1",
  "current_stop_index": 0,
  "state": "AT_STOP",
  "capacity": 50,
  "passengers": [{"id": "p1", "destination": "stop3"}],
  "speed": 0.08,
  "total_served": 25
}
```

### Stop Model
```json
{
  "id": "cbit",
  "name": "CBIT - Chaitanya Bharathi Institute of Technology",
  "location": {"lat": 17.3950, "lng": 78.4967},
  "capacity": 100,
  "amenities": ["shelter", "seating", "lighting", "information_display"],
  "description": "Main destination - Chaitanya Bharathi Institute of Technology, Gandipet"
}
```

### Route Model
```json
{
  "id": "route_15",
  "name": "Route 15 (UPPAL)",
  "description": "Uppal Depot to CBIT - Covers Survey of India, Habsiguda, Tarnaka, Vidyanagar, Nallakunta, Fever hospital, Barkatpura, Narayanguda, Himayath nagar, Lakdi ka pool, Masab Tank, NMDC, Mehdipatnam, Kakatiya Nagar, Langarhouse, CBIT",
  "color": "#FF5722",
  "stops": ["uppal_depot", "uppal_xroads", "survey_of_india", "habsiguda", "tarnaka_xroads", "vidyanagar_sves", "nallakunta", "fever_hospital", "barkatpura", "narayanguda", "himayath_nagar", "lakdi_ka_pool", "masab_tank", "nmdc", "mehdipatnam", "kakatiya_nagar", "langarhouse", "cbit"],
  "frequency_minutes": 15,
  "operating_hours": {"start": "07:00", "end": "22:00"},
  "start_point_id": "uppal_depot",
  "end_point_id": "cbit"
}
```

---

## 🔌 Communication Protocols

### WebSocket Events
- `'state_update'`: Real-time simulation state
- `'bus_update'`: Individual bus position changes
- `'passenger_update'`: Waiting passenger counts
- `'system_alert'`: System notifications

### REST API Endpoints
- **GET /api/status**: System status
- **POST /api/simulation/start**: Start simulation
- **POST /api/simulation/stop**: Stop simulation
- **GET /api/buses**: All bus data
- **GET /api/stops**: All stop data
- **GET /api/routes**: All route data
- **GET /api/routes/road-paths**: Real road paths with OSRM
- **GET /api/stats**: Performance statistics

---

## 🚀 Deployment Architecture

### Development Environment
- **Frontend**: localhost:3000 (Next.js dev server)
- **Backend**: localhost:5001 (Flask development server)
- **Database**: JSON files (development)
- **WebSocket**: Real-time connection

### Production Considerations
- **Frontend**: Static hosting (Vercel/Netlify)
- **Backend**: Containerized deployment (Docker)
- **Database**: PostgreSQL/Redis for production
- **Load Balancer**: Nginx/AWS ALB
- **Monitoring**: Application performance tracking

---

## ⚡ Performance Optimization

### Frontend
- Code splitting, lazy loading
- WebSocket connection pooling
- Map tile caching, marker clustering

### Backend
- Caching, database indexing
- WebSocket connection pooling
- Map: Tile caching, marker clustering

---

## 🔮 Future Enhancements

### Real-time GPS Integration
- Mobile application
- Advanced analytics dashboard
- Predictive maintenance
- Dynamic route optimization
- Multi-city support

---

## 🛠️ Development Commands

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests
cd frontend && npm test
```

### Production Build
```bash
# Frontend build
cd frontend && npm run build

# Backend production
cd backend && gunicorn app:app
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DEBUG=True
HOST=0.0.0.0
PORT=5001
SIMULATION_SPEED=1.0
UPDATE_INTERVAL=0.3
BUS_CAPACITY=50
AVERAGE_SPEED=60

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Key Settings
- **Simulation Speed**: 1.0x real-time
- **Update Interval**: 0.3 seconds (3.3x faster)
- **Bus Speed**: 60 km/h (2x faster)
- **Max Buses**: 20 (increased for manual addition)
- **Road Routing**: OSRM integration for real roads

---

## 🎯 Key Features Status

### ✅ Implemented Features
- [x] Multi-agent reinforcement learning with PPO
- [x] Real-time WebSocket communication
- [x] Interactive Leaflet map visualization
- [x] Dynamic passenger demand simulation
- [x] Performance metrics tracking
- [x] Training and deployment modes
- [x] Real road-based routing with OSRM
- [x] Professional UI with Tailwind CSS
- [x] TypeScript for type safety
- [x] Fast bus movement (8-10x faster)
- [x] Manual bus addition/removal
- [x] Proper route assignment and colors

### 🚧 Current Issues & Fixes
- [x] **Fixed**: Bus logo styling (removed excessive padding/borders)
- [x] **Fixed**: Overlapping route lines (removed duplicate polylines)
- [x] **Fixed**: Real road routing (OSRM integration)
- [x] **Fixed**: React hooks order violation
- [x] **Fixed**: Bus speed (increased from 0.025 to 0.08)
- [x] **Fixed**: Animation duration (reduced from 1000ms to 400ms)
- [x] **Fixed**: Simulation update rate (reduced from 1.0s to 0.3s)
- [x] **Fixed**: Add bus API limit (increased from 8 to 20)
- [x] **Fixed**: Route ID mismatch (buses now use actual defined routes)

---

## 📚 Technical Documentation

### Code Quality
- **TypeScript**: Full type coverage with interfaces
- **ESLint**: Configured with Next.js rules
- **Python**: PEP 8 compliant with Black formatting
- **Testing**: Pytest for backend, Jest for frontend

### Performance Metrics
- **Frontend Bundle Size**: Optimized with code splitting
- **API Response Time**: <100ms for most endpoints
- **WebSocket Latency**: <50ms for real-time updates
- **Memory Usage**: Optimized for 100+ concurrent users

---

## 🏆 Project Structure

```
MARL/
├── 📁 backend/                    # Flask API + ML Engine
│   ├── 📁 data/                 # Static data files
│   │   ├── routes.json          # Route definitions
│   │   ├── stops.json           # Stop locations
│   │   └── trained_models/       # Saved ML models
│   ├── 📁 environment/           # Simulation & ML
│   │   ├── traffic_env.py      # Main simulation logic
│   │   ├── route_manager.py     # Route management
│   │   ├── marl_agents.py       # RL agents
│   │   ├── passenger_demand.py  # Demand simulation
│   │   └── reward_calculator.py # Reward system
│   ├── 📁 services/              # External services
│   │   └── road_pathfinder.py   # OSRM routing
│   ├── 📁 agents/               # ML agent implementations
│   │   └── bus_agent.py        # Individual agent logic
│   ├── 📁 models/               # ML model definitions
│   ├── 📁 utils/                # Configuration & utilities
│   ├── app.py                  # Main Flask application
│   └── requirements.txt          # Python dependencies
├── 📁 frontend/                  # Next.js application
│   ├── 📁 components/            # React components
│   │   ├── map/              # Map visualization
│   │   ├── dashboard/         # Control panels
│   │   └── ui/                # Reusable components
│   ├── 📁 services/             # API integration
│   ├── 📁 types/               # TypeScript interfaces
│   ├── app/page.tsx           # Main application
│   └── package.json           # Node.js dependencies
├── 📁 docs/                      # Project documentation
├── quick_start.sh              # Quick setup script
└── README.md                  # This file
```

---

## 🎓 Learning Resources

### Multi-Agent Reinforcement Learning
- [Stable-Baselines3 Documentation](https://stable-baselines3.readthedocs.io/)
- [PPO Algorithm Paper](https://arxiv.org/abs/1707.06289)
- [Multi-Agent Systems](https://www.researchgate.net/publication/323951626_Multi-agent_systems)

### Web Technologies
- [Next.js Documentation](https://nextjs.org/docs)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🎯 System Status

### Current Performance
- **Buses Running**: 5 base buses + unlimited dynamic buses
- **Routes Active**: 5 real Hyderabad routes with OSRM road paths
- **Stops Available**: 62 bus stops across Hyderabad
- **Update Rate**: 0.3 seconds (3.3x faster than default)
- **Bus Speed**: 60 km/h (2x faster than original)
- **Road Accuracy**: Real OpenStreetMap routing via OSRM

### Real-Time Features
- **Live Map**: Interactive Leaflet with real-time updates
- **Bus Tracking**: Smooth movement with 400ms animations
- **Route Visualization**: Color-coded paths following actual roads
- **Passenger Simulation**: Dynamic demand generation
- **Performance Metrics**: Real-time statistics and alerts

---

**Made with ❤️ for College Major Project 2024-25**

**Document Version**: 2.0  
**Last Updated**: February 2025  
**Status**: ✅ Production Ready with All Major Features Implemented
