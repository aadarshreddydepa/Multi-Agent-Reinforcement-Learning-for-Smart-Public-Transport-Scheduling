"""
Logging utility for Smart Bus MARL
"""
import logging
import os
from datetime import datetime

class Logger:
    """Custom logger with colored output"""
    
    def __init__(self, name, log_dir='data/logs'):
        self.name = name
        self.log_dir = log_dir
        
        # Create logs directory if it doesn't exist
        os.makedirs(log_dir, exist_ok=True)
        
        # Create logger
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # Avoid duplicate handlers
        if not self.logger.handlers:
            # Console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            console_format = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%H:%M:%S'
            )
            console_handler.setFormatter(console_format)
            
            # File handler
            log_file = os.path.join(
                log_dir, 
                f'{name}_{datetime.now().strftime("%Y%m%d")}.log'
            )
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.DEBUG)
            file_format = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(file_format)
            
            self.logger.addHandler(console_handler)
            self.logger.addHandler(file_handler)
    
    def debug(self, message):
        self.logger.debug(message)
    
    def info(self, message):
        self.logger.info(message)
    
    def warning(self, message):
        self.logger.warning(message)
    
    def error(self, message):
        self.logger.error(message)
    
    def critical(self, message):
        self.logger.critical(message)

# Create default loggers
system_logger = Logger('SYSTEM')
agent_logger = Logger('AGENT')
env_logger = Logger('ENVIRONMENT')