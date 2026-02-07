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

✅ Multi-agent reinforcement learning with Q-learning  
✅ Real-time WebSocket updates  
✅ Interactive Leaflet map visualization  
✅ Dynamic passenger demand generation  
✅ Traffic simulation with variable conditions  
✅ Comprehensive performance metrics  
✅ Training mode for learning and exploitation mode for deployment  

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

# Run the backend
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

**Made with ❤️ for College Major Project 2024-25**