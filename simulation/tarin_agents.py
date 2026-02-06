#!/usr/bin/env python3
"""
Standalone Training Script
Run this to train RL agents offline before deploying to web interface
"""
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models.training import trainer
from utils.logger import system_logger

def main():
    """Main training function"""
    print("\n" + "="*70)
    print("SMART BUS MARL - AGENT TRAINING")
    print("="*70)
    
    # Initialize agents
    print("\nInitializing agents...")
    trainer.initialize_agents()
    
    # Check if we should load existing models
    load_existing = input("\nLoad existing models? (y/n): ").lower().strip()
    if load_existing == 'y':
        loaded = trainer.load_models()
        if loaded > 0:
            print(f"✓ Loaded {loaded} existing models")
        else:
            print("No existing models found, starting fresh")
    
    # Get training parameters
    print("\nTraining Configuration:")
    print("-" * 70)
    
    try:
        num_episodes = int(input("Number of episodes [default: 200]: ") or "200")
        max_steps = int(input("Max steps per episode [default: 500]: ") or "500")
    except ValueError:
        print("Invalid input, using defaults")
        num_episodes = 200
        max_steps = 500
    
    print(f"\nTraining for {num_episodes} episodes with max {max_steps} steps each")
    print("This may take a while...\n")
    
    # Train
    try:
        trainer.train(num_episodes=num_episodes, max_steps_per_episode=max_steps)
        print("\n✓ Training completed successfully!")
        
        # Ask if user wants to evaluate
        evaluate = input("\nEvaluate trained agents? (y/n): ").lower().strip()
        if evaluate == 'y':
            eval_episodes = int(input("Number of evaluation episodes [default: 10]: ") or "10")
            trainer.evaluate(num_episodes=eval_episodes)
        
    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user")
        save = input("Save current progress? (y/n): ").lower().strip()
        if save == 'y':
            trainer.save_models()
            print("✓ Progress saved")
    
    except Exception as e:
        print(f"\n✗ Error during training: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*70)
    print("Training session ended")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()