# README

This application combines a React frontend with a Flask backend to interact with AWS services, primarily a serverless Redshift database. It includes features for data mapping, data uploading, and settings management.

## Requirements

### System Requirements
- Node.js (v14 or later)
- Python 3.7 or later
- pip (Python package installer)
- AWS CLI (for local development and deployment)

### AWS Services
- Amazon S3
- Amazon Redshift (Serverless)

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd react-job-data-app
   ```

2. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```
   cd ../backend
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with the following content:
   ```
   REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_id
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_access_key
   REACT_APP_AWS_REGION=your_aws_region
   REACT_APP_DEFAULT_S3_BUCKET=your_s3_bucket_name
   REACT_APP_DEFAULT_WORKGROUP=your_redshift_workgroup
   REACT_APP_REDSHIFT_DB_NAME=your_redshift_database_name
   ```
   Replace the placeholder values with your actual AWS credentials and configuration.

## Packages and Dependencies

### Frontend (React) Dependencies
- react: ^17.0.2
- react-dom: ^17.0.2
- react-router-dom: ^6.26.1
- react-scripts: ^5.0.1
- react-table: ^7.8.0
- @aws-sdk/client-s3: ^3.0.0
- @mui/material: ^5.16.7
- @mui/icons-material: ^5.16.7
- @emotion/react: ^11.13.3
- @emotion/styled: ^11.13.0
- web-vitals: ^2.1.4

### Frontend Development Dependencies
- tailwindcss: ^3.4.10
- postcss: ^8.4.41
- autoprefixer: ^10.4.20
- @babel/plugin-proposal-private-property-in-object: ^7.21.11

### Backend (Flask) Dependencies
- Flask: 2.0.1
- Flask-CORS: 3.0.10
- boto3: (latest version)
- python-dotenv: 0.19.0
- Werkzeug: 2.0.1

## Running the Application

1. Start the backend server:
   ```
   cd backend
   python app.py
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`

Note: Alternatively, a `run.sh` script has been included.

## AWS Configuration

Ensure your AWS credentials have the following permissions:
- S3: Read and write access to the specified bucket
- Redshift:
    - Create, read, update, and delete tables
    - Execute queries
    - Describe tables and schemas

## Security Notes
- Only using `.env` file for dev. I understand IAM roles is the standard for production. 

