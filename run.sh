#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==== Job Data App FastAPI Setup and Run Script ====${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to stop any running server instance
stop_servers() {
  echo -e "${YELLOW}Stopping any running servers...${NC}"

  # Check for processes on port 3000 (frontend)
  FRONTEND_PID=$(lsof -t -i:3000 2>/dev/null)
  if [ -n "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}Killing process on port 3000 (PID: $FRONTEND_PID)${NC}"
    kill -9 $FRONTEND_PID 2>/dev/null || true
  fi

  # Check for processes on port 5000 (backend)
  BACKEND_PID=$(lsof -t -i:5000 2>/dev/null)
  if [ -n "$BACKEND_PID" ]; then
    echo -e "${YELLOW}Killing process on port 5000 (PID: $BACKEND_PID)${NC}"
    kill -9 $BACKEND_PID 2>/dev/null || true
  fi

  # Additional cleanup for any stray processes
  pkill -f "react-scripts start" 2>/dev/null || true
  pkill -f "uvicorn" 2>/dev/null || true

  # Wait to ensure processes are terminated
  sleep 2
}

# Ensure system dependencies are installed
ensure_dependencies() {
  echo -e "${YELLOW}Checking and installing system dependencies...${NC}"

  # Check for Python
  if ! command_exists python3; then
    echo -e "${RED}Python 3 is not installed. Installing...${NC}"
    sudo apt update
    sudo apt install -y python3 python3-venv python3-pip
  fi

  # Check for Node.js
  if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
  fi

  # Check for AWS CLI
  if ! command_exists aws; then
    echo -e "${YELLOW}AWS CLI is not installed. You may need to install it manually:${NC}"
    echo -e "${YELLOW}https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html${NC}"
  fi
}

# Create and setup virtual environment
setup_venv() {
  echo -e "${YELLOW}Setting up Python virtual environment...${NC}"

  # Create virtual environment if it doesn't exist
  if [ ! -d "venv" ]; then
    python3 -m venv venv
  fi

  # Activate virtual environment
  source venv/bin/activate

  # Upgrade pip
  pip install --upgrade pip

  # Install backend dependencies from the correct requirements.txt
  pip install -r backend/requirements.txt
}

# Verify AWS credentials
verify_aws_credentials() {
  echo -e "${YELLOW}Verifying AWS credentials...${NC}"

  # Load environment variables from .env file
  if [ -f ".env" ]; then
    source .env
  fi

  # Check if AWS credentials are set
  if [ -z "$REACT_APP_AWS_ACCESS_KEY_ID" ] || [ -z "$REACT_APP_AWS_SECRET_ACCESS_KEY" ] || [ -z "$REACT_APP_AWS_REGION" ]; then
    echo -e "${RED}AWS credentials are not properly set in .env file.${NC}"
    echo -e "${YELLOW}Please update your .env file with valid AWS credentials.${NC}"
    return 1
  fi

  # Check if SageMaker role ARN is set
  if [ -z "$REACT_APP_SAGEMAKER_ROLE_ARN" ]; then
    echo -e "${RED}SageMaker role ARN is not set in .env file.${NC}"
    echo -e "${YELLOW}Please update your .env file with a valid SageMaker execution role ARN.${NC}"
    return 1
  fi

  echo -e "${GREEN}AWS credentials verified.${NC}"
  return 0
}

# Start frontend
start_frontend() {
  echo -e "${YELLOW}Starting frontend development server...${NC}"
  cd frontend
  npm install
  npm start &
  cd ..
}

# Start backend
start_backend() {
  echo -e "${YELLOW}Starting FastAPI backend server...${NC}"
  cd backend
  uvicorn app:app --host 0.0.0.0 --port 5000 --reload > backend.log 2>&1 &
  BACKEND_PID=$!
  cd ..

  echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

  # Wait for backend to start
  sleep 3

  # Verify backend is running
  if ! curl -s http://localhost:5000 > /dev/null; then
    echo -e "${RED}Backend server failed to start or respond. Check backend/backend.log for details.${NC}"
    cat backend/backend.log
    exit 1
  fi
}

# Main script execution
main() {
  # Stop any existing servers
  stop_servers

  # Ensure dependencies
  ensure_dependencies

  # Setup virtual environment and install dependencies
  setup_venv

  # Verify AWS credentials
  verify_aws_credentials
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Continuing startup despite AWS credential issues...${NC}"
  fi

  # Start backend
  start_backend

  # Start frontend
  start_frontend

  echo -e "${GREEN}Setup complete!${NC}"
  echo -e "${GREEN}Backend running at http://localhost:5000${NC}"
  echo -e "${GREEN}Frontend running at http://localhost:3000${NC}"
  echo -e ""
  echo -e "${YELLOW}Important notes:${NC}"
  echo -e "${YELLOW}1. To use SageMaker features, ensure your AWS credentials and SageMaker role are properly configured.${NC}"
  echo -e "${YELLOW}2. The S3 bucket in your .env file must exist and be accessible with your credentials.${NC}"
  echo -e "${YELLOW}3. You can access the backend API documentation at http://localhost:5000/docs${NC}"
}

# Run main script
main