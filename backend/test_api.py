import requests
import time

URL = "http://localhost:5001/api/simulation/start"
payload = {"use_trained_agents": False}

try:
    print(f"Sending POST to {URL}...")
    response = requests.post(URL, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("Waiting 5 seconds to verify state updates...")
        time.sleep(5)
        state_url = "http://localhost:5001/api/state"
        state_resp = requests.get(state_url)
        print(f"State: {state_resp.json()['simulation_time']}")
except Exception as e:
    print(f"Error: {e}")
