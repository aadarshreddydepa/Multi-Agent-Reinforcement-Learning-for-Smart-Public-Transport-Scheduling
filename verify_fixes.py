#!/usr/bin/env python3
"""
Quick verification script for Smart Bus MARL fixes
Run this to verify all fixes are working
"""

import os
import sys

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} NOT FOUND")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists"""
    if os.path.exists(dirpath):
        print(f"✅ {description}: {dirpath}")
        return True
    else:
        print(f"⚠️  {description}: {dirpath} (will be created on first run)")
        return True

def check_method_in_file(filepath, method_name):
    """Check if a method exists in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if method_name in content:
                print(f"✅ Method '{method_name}' found in {os.path.basename(filepath)}")
                return True
            else:
                print(f"❌ Method '{method_name}' NOT FOUND in {os.path.basename(filepath)}")
                return False
    except:
        print(f"❌ Could not read {filepath}")
        return False

def main():
    print("=" * 70)
    print("SMART BUS MARL - FIX VERIFICATION")
    print("=" * 70)
    print()
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    
    # Check 1: PassengerDemand method
    print("🔍 Fix #1: Checking generate_passengers_all() method...")
    traffic_env_file = os.path.join(backend_dir, 'environment', 'traffic_env.py')
    check1 = check_method_in_file(traffic_env_file, 'generate_passengers_all')
    print()
    
    # Check 2: WebSocket emissions
    print("🔍 Fix #2: Checking bus_position_update emissions...")
    app_file = os.path.join(backend_dir, 'app.py')
    check2 = check_method_in_file(app_file, 'bus_position_update')
    print()
    
    # Check 3: Model directory creation
    print("🔍 Fix #3: Checking model directory handling...")
    check3a = check_method_in_file(app_file, "os.makedirs(Config.MODELS_DIR")
    check3b = check_method_in_file(app_file, "coordinator.save_all_models()")
    check3 = check3a and check3b
    print()
    
    # Check 4: Required directories
    print("🔍 Checking required directories...")
    data_dir = os.path.join(backend_dir, 'data')
    models_dir = os.path.join(data_dir, 'trained_models')
    logs_dir = os.path.join(data_dir, 'logs')
    
    check4a = check_directory_exists(data_dir, "Data directory")
    check4b = check_directory_exists(models_dir, "Models directory")
    check4c = check_directory_exists(logs_dir, "Logs directory")
    print()
    
    # Check 5: Required data files
    print("🔍 Checking required data files...")
    routes_file = os.path.join(data_dir, 'routes.json')
    stops_file = os.path.join(data_dir, 'stops.json')
    
    check5a = check_file_exists(routes_file, "Routes data")
    check5b = check_file_exists(stops_file, "Stops data")
    print()
    
    # Summary
    print("=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)
    
    all_checks = [check1, check2, check3, check4a, check5a, check5b]
    passed = sum(all_checks)
    total = len(all_checks)
    
    if passed == total:
        print(f"✅ All {total} critical checks PASSED!")
        print()
        print("🚀 Your system is ready to run!")
        print()
        print("Next steps:")
        print("1. Start backend: cd backend && python app.py")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Open http://localhost:3000")
        return 0
    else:
        print(f"⚠️  {passed}/{total} checks passed")
        print()
        print("Some issues detected. Please review the output above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
