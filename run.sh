#!/bin/bash

# Function to stop any running instance of the React development server and Flask server
stop_servers() {
  echo "Stopping any running servers..."
  pkill -f "react-scripts start" || true
  pkill -f "python3 backend/app.py" || true
}

# Change to the frontend directory
cd frontend

# Clean previous installations
echo "Cleaning previous installations..."
sudo rm -rf node_modules

# Install dependencies
echo "Installing dependencies..."
npm install
npm install --save-dev @babel/plugin-proposal-private-property-in-object

# Install additional dependencies
npm install @mui/material @emotion/react @emotion/styled react-table
npm install @mui/icons-material
npm install react-router-dom

# Install Tailwind CSS and its dependencies
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Initialize Tailwind CSS
npx tailwindcss init -p

# Change back to the root directory
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
pip3 install -r backend/requirements.txt

# Stop any running server instance
stop_servers

# Start the backend server
echo "Starting the backend server..."
python3 backend/app.py &

# Change to the frontend directory and start the frontend development server
echo "Starting the frontend development server..."
cd frontend && npm start