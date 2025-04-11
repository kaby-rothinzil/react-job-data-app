#!/bin/bash

# Function to clean up running processes
cleanup() {
  echo "Cleaning up processes..."

  # Find and kill React development server
  REACT_PID=$(ps aux | grep 'react-scripts start' | grep -v grep | awk '{print $2}')
  if [ -n "$REACT_PID" ]; then
    echo "Shutting down React server (PID: $REACT_PID)"
    kill -15 $REACT_PID 2>/dev/null || kill -9 $REACT_PID 2>/dev/null
  fi

  # Find and kill FastAPI/Uvicorn server
  UVICORN_PID=$(ps aux | grep 'uvicorn' | grep -v grep | awk '{print $2}')
  if [ -n "$UVICORN_PID" ]; then
    echo "Shutting down FastAPI/Uvicorn server (PID: $UVICORN_PID)"
    kill -15 $UVICORN_PID 2>/dev/null || kill -9 $UVICORN_PID 2>/dev/null
  fi

  # Find anything on ports 3000 (React) or 5000 (FastAPI)
  PORT_3000_PID=$(lsof -t -i:3000 2>/dev/null)
  if [ -n "$PORT_3000_PID" ]; then
    echo "Killing process on port 3000 (PID: $PORT_3000_PID)"
    kill -15 $PORT_3000_PID 2>/dev/null || kill -9 $PORT_3000_PID 2>/dev/null
  fi

  PORT_5000_PID=$(lsof -t -i:5000 2>/dev/null)
  if [ -n "$PORT_5000_PID" ]; then
    echo "Killing process on port 5000 (PID: $PORT_5000_PID)"
    kill -15 $PORT_5000_PID 2>/dev/null || kill -9 $PORT_5000_PID 2>/dev/null
  fi

  # Make sure all child processes are terminated
  pkill -f "react-scripts start" 2>/dev/null || true
  pkill -f "uvicorn" 2>/dev/null || true

  echo "Cleanup complete!"
}

# Run the cleanup
cleanup