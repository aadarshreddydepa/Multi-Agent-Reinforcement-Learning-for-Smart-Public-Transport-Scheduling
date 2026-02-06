# 📡 Smart Bus MARL - API Documentation

## Overview

The Smart Bus MARL backend provides a **REST API** and **WebSocket interface** for real-time bus simulation and control.

**Base URL**: `http://localhost:5000`

---

## 🔌 REST API Endpoints

### Health & Configuration

#### `GET /`
**Health check endpoint**

**Response:**
```json
{
  "status": "running",
  "message": "Smart Bus MARL Backend API",
  "version": "1.0.0"
}
```

---

#### `GET /api/status`
**Get current system status**

**Response:**
```json
{
  "simulation_running": false,
  "agents_initialized": true,
  "num_buses": 3,
  "num_agents": 3,
  "simulation_time": 125.5
}
```

---

#### `GET /api/config`
**Get system configuration**

**Response:**
```json
{
  "num_buses": 3,
  "num_routes": 1,
  "bus_capacity": 50,
  "simulation_speed": 1.0,
  "update_interval": 1.0,
  "actions": ["DEPART_NOW", "WAIT_30", "WAIT_60", "SKIP_STOP"],
  "map_center": {
    "lat": 17.3850,
    "lng": 78.4867
  }
}
```

---

### Data Endpoints

#### `GET /api/routes`
**Get all bus routes**

**Response:**
```json
{
  "routes": [
    {
      "id": "route_1",
      "name": "College Campus Circuit",
      "description": "Main campus circular route",
      "color": "#FF5722",
      "stops": ["main_gate", "library", "canteen", "hostel_block_a", "sports_complex", "main_gate"],
      "frequency_minutes": 15,
      "operating_hours": {
        "start": "07:00",
        "end": "22:00"
      }
    }
  ]
}
```

---

#### `GET /api/stops`
**Get all bus stops**

**Response:**
```json
{
  "stops": [
    {
      "id": "main_gate",
      "name": "Main Gate",
      "description": "College main entrance",
      "location": {
        "lat": 17.3850,
        "lng": 78.4867
      },
      "capacity": 30,
      "peak_demand_hours": ["08:00-09:00", "17:00-18:00"],
      "amenities": ["shelter", "seating", "display_board"]
    }
  ]
}
```

---

#### `GET /api/state`
**Get complete current state**

**Response:**
```json
{
  "simulation_time": 125.5,
  "buses": {
    "route_1_bus_1": {
      "bus_id": "route_1_bus_1",
      "route_id": "route_1",
      "state": "MOVING",
      "current_stop": "main_gate",
      "next_stop": "library",
      "position": {
        "lat": 17.3852,
        "lng": 78.4869
      },
      "passengers_on_board": 25,
      "capacity_used": 0.5,
      "queue_at_stop": 0,
      "wait_duration": 0,
      "total_served": 127
    }
  },
  "passengers": {
    "total_generated": 456,
    "total_served": 389,
    "total_waiting": 67,
    "average_wait_time": 35.2,
    "stops": {
      "main_gate": {
        "waiting": 12,
        "avg_wait_time": 42.1
      }
    }
  },
  "stops": [...],
  "routes": [...]
}
```

---

#### `GET /api/statistics`
**Get performance statistics**

**Response:**
```json
{
  "simulation_time": 125.5,
  "total_passengers_served": 389,
  "total_waiting": 67,
  "average_wait_time": 35.2,
  "average_bus_occupancy": 0.72,
  "active_buses": 2,
  "agents": {
    "route_1_bus_1": {
      "agent_id": "route_1_bus_1",
      "episodes_completed": 0,
      "epsilon": 0.01,
      "episode_reward": 1245.5,
      "avg_reward_last_100": 1180.3,
      "q_table_stats": {
        "states": 437,
        "total_updates": 125834,
        "avg_q_value": 45.2
      }
    }
  }
}
```

---

### Simulation Control

#### `POST /api/simulation/start`
**Start the simulation**

**Request Body:**
```json
{
  "use_trained_agents": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Simulation started",
  "use_trained_agents": false
}
```

**Status Codes:**
- `200` - Success
- `400` - Simulation already running
- `500` - Server error

---

#### `POST /api/simulation/stop`
**Stop the simulation**

**Response:**
```json
{
  "success": true,
  "message": "Simulation stopped"
}
```

**Status Codes:**
- `200` - Success
- `400` - Simulation not running

---

#### `POST /api/simulation/reset`
**Reset the simulation**

**Response:**
```json
{
  "success": true,
  "message": "Simulation reset",
  "was_running": true
}
```

---

### Agent Endpoints

#### `GET /api/agent/<agent_id>/decision`
**Get explanation for agent's decision**

**Example:** `/api/agent/route_1_bus_1/decision`

**Response:**
```json
{
  "success": true,
  "agent_id": "route_1_bus_1",
  "explanation": {
    "state": {
      "queue_length": 8,
      "bus_occupancy": "65%",
      "time_since_last_bus": "180s",
      "traffic_level": "50%"
    },
    "state_hash": "2_1_0_1",
    "q_values": {
      "DEPART_NOW": 15.2,
      "WAIT_30": 8.3,
      "WAIT_60": 5.1,
      "SKIP_STOP": -10.5
    },
    "best_action": "DEPART_NOW",
    "exploration_rate": 0.15,
    "reasoning": "Bus nearly full, good time to depart"
  }
}
```

---

#### `POST /api/training/start`
**Start training agents (background)**

**Request Body:**
```json
{
  "num_episodes": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Training started for 100 episodes"
}
```

---

#### `POST /api/passenger/generate`
**Manually generate passengers (testing)**

**Request Body:**
```json
{
  "stop_id": "main_gate",
  "num_passengers": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated passengers at main_gate"
}
```

---

## 🔄 WebSocket Events

### Client → Server

#### `connect`
**Establish WebSocket connection**

**Server Response:** `connection_response`
```json
{
  "status": "connected",
  "message": "Connected to Smart Bus MARL backend"
}
```

---

#### `request_state`
**Request current state**

**Server Response:** `state_update` (see format above)

---

#### `request_statistics`
**Request current statistics**

**Server Response:** `statistics_update` (see format above)

---

### Server → Client

#### `state_update`
**Real-time state updates (every 1 second)**

Sent automatically when simulation is running.

**Payload:** Same as `GET /api/state` response

---

#### `statistics_update`
**Real-time statistics updates (every 1 second)**

Sent automatically when simulation is running.

**Payload:** Same as `GET /api/statistics` response

---

#### `training_complete`
**Training finished notification**

```json
{
  "message": "Training completed",
  "episodes": 100
}
```

---

#### `training_error`
**Training error notification**

```json
{
  "message": "Error message here"
}
```

---

## 🚀 Usage Examples

### Python (requests)

```python
import requests

# Start simulation
response = requests.post('http://localhost:5000/api/simulation/start',
                        json={'use_trained_agents': True})
print(response.json())

# Get current state
state = requests.get('http://localhost:5000/api/state').json()
print(f"Buses: {len(state['buses'])}")

# Stop simulation
requests.post('http://localhost:5000/api/simulation/stop')
```

---

### JavaScript (fetch)

```javascript
// Start simulation
fetch('http://localhost:5000/api/simulation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ use_trained_agents: true })
})
.then(res => res.json())
.then(data => console.log(data));

// Get state
fetch('http://localhost:5000/api/state')
  .then(res => res.json())
  .then(state => console.log(state));
```

---

### JavaScript (Socket.IO)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Connection
socket.on('connect', () => {
  console.log('Connected!');
});

// Real-time state updates
socket.on('state_update', (state) => {
  console.log('Buses:', Object.keys(state.buses).length);
  // Update UI with new state
});

// Real-time statistics
socket.on('statistics_update', (stats) => {
  console.log('Wait time:', stats.average_wait_time);
  // Update charts/graphs
});
```

---

## 🔒 CORS Configuration

CORS is enabled for:
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:3000`

To add more origins, edit `Config.CORS_ORIGINS` in `utils/config.py`.

---

## ⚡ Rate Limits

Currently **no rate limits** applied (local development).

For production, consider adding rate limiting for:
- Training endpoints
- Passenger generation
- Reset endpoint

---

## 🐛 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (invalid agent_id, etc.) |
| 500 | Internal Server Error |

---

## 🎯 Best Practices

### Polling vs WebSocket

**Use WebSocket for:**
- Real-time bus positions
- Live statistics updates
- Continuous monitoring

**Use REST API for:**
- One-time queries
- Configuration changes
- Simulation control

### Performance Tips

1. **Simulation Speed**: Adjust `Config.SIMULATION_SPEED`
   - `1.0` = real-time
   - `2.0` = 2x faster (for demos)
   - `0.5` = half-speed (for detailed viewing)

2. **Update Interval**: Change `Config.UPDATE_INTERVAL`
   - `1.0` = updates every second
   - `0.5` = 2 updates per second (smoother, more CPU)

3. **Frontend Throttling**: Don't re-render on every WebSocket event
   - Buffer updates
   - Render at ~30-60 FPS max

---

## 🧪 Testing

```bash
# Test REST API
python backend/test_api.py

# Test WebSocket
python backend/test_websocket.py

# Manual testing with curl
curl http://localhost:5000/api/status
curl -X POST http://localhost:5000/api/simulation/start
```

---

## 📝 Notes

- All timestamps in **seconds**
- GPS coordinates in **decimal degrees** (lat, lng)
- Occupancy as **float** (0.0 to 1.0+, where 1.0 = 100%)
- Queue lengths as **integer** (number of passengers)

---

## 🆘 Troubleshooting

**WebSocket not connecting?**
- Check CORS origins
- Verify port 5000 is not blocked
- Ensure backend is running

**State updates not received?**
- Check if simulation is running (`/api/status`)
- Start simulation (`POST /api/simulation/start`)
- Verify WebSocket connection

**Training not working?**
- Ensure agents are initialized
- Check logs in `backend/data/logs/`
- Verify trained models directory exists

---

## 📚 Related Documentation

- [Environment API](../backend/environment/README.md)
- [Agent API](../backend/agents/README.md)
- [Configuration Guide](../backend/utils/config.py)