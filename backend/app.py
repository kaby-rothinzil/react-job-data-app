from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import logging
import time
import csv
import io

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure CORS to allow requests from your React app
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Set up logging
logging.basicConfig(level=logging.DEBUG)

def get_redshift_data_client(settings=None):
    if settings is None:
        settings = {}

    aws_access_key_id = settings.get('REACT_APP_AWS_ACCESS_KEY_ID') or os.getenv('REACT_APP_AWS_ACCESS_KEY_ID')
    aws_secret_access_key = settings.get('REACT_APP_AWS_SECRET_ACCESS_KEY') or os.getenv('REACT_APP_AWS_SECRET_ACCESS_KEY')
    aws_region = settings.get('REACT_APP_AWS_REGION') or os.getenv('REACT_APP_AWS_REGION')

    if not all([aws_access_key_id, aws_secret_access_key, aws_region]):
        raise ValueError("Missing required AWS credentials or region")

    return boto3.client('redshift-data',
        region_name=aws_region,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key
    )

def get_s3_client(settings=None):
    if settings is None:
        settings = {}

    aws_access_key_id = settings.get('REACT_APP_AWS_ACCESS_KEY_ID') or os.getenv('REACT_APP_AWS_ACCESS_KEY_ID')
    aws_secret_access_key = settings.get('REACT_APP_AWS_SECRET_ACCESS_KEY') or os.getenv('REACT_APP_AWS_SECRET_ACCESS_KEY')
    aws_region = settings.get('REACT_APP_AWS_REGION') or os.getenv('REACT_APP_AWS_REGION')

    if not all([aws_access_key_id, aws_secret_access_key, aws_region]):
        raise ValueError("Missing required AWS credentials or region")

    return boto3.client('s3',
        region_name=aws_region,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key
    )

@app.route('/api/tables', methods=['GET'])
def get_tables():
    try:
        client = get_redshift_data_client()
        workgroup = os.getenv('REACT_APP_DEFAULT_WORKGROUP')
        database = os.getenv('REACT_APP_REDSHIFT_DB_NAME')

        if not workgroup or not database:
            raise ValueError("Missing Redshift workgroup or database name")

        response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )

        query_id = response['Id']

        # Wait for the query to complete
        while True:
            status = client.describe_statement(Id=query_id)
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                app.logger.error(f"Query failed: {status.get('Error', 'Unknown error')}")
                return jsonify({"error": "Query failed"}), 500
            time.sleep(0.5)

        # Fetch the results
        result = client.get_statement_result(Id=query_id)

        # Process the results
        tables = [row[0]['stringValue'] for row in result['Records']]

        return jsonify(tables)
    except Exception as e:
        app.logger.error(f"Error in get_tables: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        table_name = request.args.get('table', 'default_table')
        client = get_redshift_data_client()
        workgroup = os.getenv('REACT_APP_DEFAULT_WORKGROUP')
        database = os.getenv('REACT_APP_REDSHIFT_DB_NAME')

        if not workgroup or not database:
            raise ValueError("Missing Redshift workgroup or database name")

        response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql=f"SELECT * FROM {table_name}"
        )

        query_id = response['Id']

        # Wait for the query to complete
        while True:
            status = client.describe_statement(Id=query_id)
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                app.logger.error(f"Query failed: {status.get('Error', 'Unknown error')}")
                return jsonify({"error": "Query failed"}), 500
            time.sleep(0.5)

        # Fetch the results
        result = client.get_statement_result(Id=query_id)

        # Process the results
        columns = [col['name'] for col in result['ColumnMetadata']]
        data = [dict(zip(columns, [field.get('stringValue', '') for field in row])) for row in result['Records']]

        return jsonify(data)
    except Exception as e:
        app.logger.error(f"Error in get_data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/update-table', methods=['POST'])
def update_table():
    try:
        data = request.json
        table_name = data.get('table')
        table_data = data.get('data')

        if not all([table_name, table_data]):
            return jsonify({"error": "Missing required fields"}), 400

        client = get_redshift_data_client()
        workgroup = os.getenv('REACT_APP_DEFAULT_WORKGROUP')
        database = os.getenv('REACT_APP_REDSHIFT_DB_NAME')

        if not workgroup or not database:
            raise ValueError("Missing Redshift workgroup or database name")

        # First, delete all existing rows
        delete_sql = f"DELETE FROM {table_name}"
        delete_response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql=delete_sql
        )

        # Wait for the delete operation to complete
        while True:
            status = client.describe_statement(Id=delete_response['Id'])
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                error_message = status.get('Error', 'Unknown error')
                app.logger.error(f"Failed to delete existing rows: {error_message}")
                return jsonify({"error": f"Failed to delete existing rows: {error_message}"}), 500
            time.sleep(0.5)

        # Now, insert the new data
        for row in table_data:
            columns = ', '.join(row.keys())
            values = ', '.join([f"'{v}'" for v in row.values()])
            insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values})"

            insert_response = client.execute_statement(
                Database=database,
                WorkgroupName=workgroup,
                Sql=insert_sql
            )

            # Wait for each insert operation to complete
            while True:
                status = client.describe_statement(Id=insert_response['Id'])
                if status['Status'] == 'FINISHED':
                    break
                elif status['Status'] == 'FAILED':
                    error_message = status.get('Error', 'Unknown error')
                    app.logger.error(f"Failed to insert data: {error_message}")
                    return jsonify({"error": f"Failed to insert data: {error_message}"}), 500
                time.sleep(0.5)

        return jsonify({"message": "Table updated successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error in update_table: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/write-to-redshift', methods=['POST'])
def write_to_redshift():
    try:
        data = request.json
        schema = data.get('schema')
        table_name = data.get('tableName')
        combined_data = data.get('data')

        if not all([schema, table_name, combined_data]):
            return jsonify({"error": "Missing required fields"}), 400

        client = get_redshift_data_client()
        workgroup = os.getenv('REACT_APP_DEFAULT_WORKGROUP')
        database = os.getenv('REACT_APP_REDSHIFT_DB_NAME')

        if not workgroup or not database:
            raise ValueError("Missing Redshift workgroup or database name")

        # Create table if not exists
        columns = set()
        for row in combined_data:
            columns.update(row.keys())

        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {schema}.{table_name} (
            {', '.join([f'"{col}" VARCHAR(255)' for col in columns])}
        )
        """

        create_response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql=create_table_sql
        )

        # Wait for the create table operation to complete
        while True:
            status = client.describe_statement(Id=create_response['Id'])
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                error_message = status.get('Error', 'Unknown error')
                app.logger.error(f"Failed to create table: {error_message}")
                return jsonify({"error": f"Failed to create table: {error_message}"}), 500
            time.sleep(0.5)

        # Insert data
        for row in combined_data:
            columns = ', '.join([f'"{k}"' for k in row.keys()])
            values = ', '.join([f"'{v}'" for v in row.values()])
            insert_sql = f"INSERT INTO {schema}.{table_name} ({columns}) VALUES ({values})"

            insert_response = client.execute_statement(
                Database=database,
                WorkgroupName=workgroup,
                Sql=insert_sql
            )

            # Wait for each insert operation to complete
            while True:
                status = client.describe_statement(Id=insert_response['Id'])
                if status['Status'] == 'FINISHED':
                    break
                elif status['Status'] == 'FAILED':
                    error_message = status.get('Error', 'Unknown error')
                    app.logger.error(f"Failed to insert data: {error_message}")
                    return jsonify({"error": f"Failed to insert data: {error_message}"}), 500
                time.sleep(0.5)

        return jsonify({"message": "Data successfully written to Redshift"}), 200
    except Exception as e:
        app.logger.error(f"Error in write_to_redshift: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/write-to-redshift-from-s3', methods=['POST'])
def write_to_redshift_from_s3():
    try:
        data = request.json
        s3_path = data.get('s3_path')
        schema = data.get('schema')
        table_name = data.get('tableName')

        if not all([s3_path, schema, table_name]):
            return jsonify({"error": "Missing required fields"}), 400

        client = get_redshift_data_client()
        workgroup = os.getenv('REACT_APP_DEFAULT_WORKGROUP')
        database = os.getenv('REACT_APP_REDSHIFT_DB_NAME')

        if not workgroup or not database:
            raise ValueError("Missing Redshift workgroup or database name")

        # Get CSV structure
        try:
            s3_client = get_s3_client()
            bucket, key = s3_path.replace("s3://", "").split("/", 1)
            response = s3_client.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')
            csv_reader = csv.reader(io.StringIO(csv_content))
            headers = next(csv_reader)
        except Exception as e:
            return jsonify({"error": f"Failed to read S3 object: {str(e)}"}), 500

        # Create table if not exists
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {schema}.{table_name} (
            {', '.join([f'"{header}" VARCHAR(255)' for header in headers])}
        )
        """

        create_response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql=create_table_sql
        )

        # Wait for the create table operation to complete
        while True:
            status = client.describe_statement(Id=create_response['Id'])
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                error_message = status.get('Error', 'Unknown error')
                app.logger.error(f"Failed to create table: {error_message}")
                return jsonify({"error": f"Failed to create table: {error_message}"}), 500
            time.sleep(0.5)

        # Copy data from S3 to Redshift
        copy_sql = f"""
        COPY {schema}.{table_name}
        FROM '{s3_path}'
        IAM_ROLE DEFAULT
        FORMAT AS CSV
        IGNOREHEADER 1
        """

        copy_response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql=copy_sql
        )

        # Wait for the copy operation to complete
        while True:
            status = client.describe_statement(Id=copy_response['Id'])
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                error_message = status.get('Error', 'Unknown error')
                app.logger.error(f"Failed to copy data: {error_message}")
                return jsonify({"error": f"Failed to copy data: {error_message}"}), 500
            time.sleep(0.5)

        return jsonify({"message": "Data successfully written to Redshift from S3"}), 200
    except Exception as e:
        app.logger.error(f"Error in write_to_redshift_from_s3: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/test-credentials', methods=['POST'])
def test_credentials():
    try:
        data = request.json
        client = get_redshift_data_client(data)
        workgroup = data.get('REACT_APP_DEFAULT_WORKGROUP')
        database = data.get('REACT_APP_REDSHIFT_DB_NAME')

        if not workgroup or not database:
            raise ValueError("Missing Redshift workgroup or database name")

        # Test connection by listing schemas
        response = client.execute_statement(
            Database=database,
            WorkgroupName=workgroup,
            Sql="SELECT DISTINCT schemaname FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'"
        )

        query_id = response['Id']

        # Wait for the query to complete
        while True:
            status = client.describe_statement(Id=query_id)
            if status['Status'] == 'FINISHED':
                break
            elif status['Status'] == 'FAILED':
                raise Exception(f"Query failed: {status.get('Error', 'Unknown error')}")
            time.sleep(0.5)

        # Fetch the results
        result = client.get_statement_result(Id=query_id)

        # Process the results
        schemas = [row[0]['stringValue'] for row in result['Records']]

        return jsonify({"message": "Connection successful", "schemas": schemas})
    except Exception as e:
        app.logger.error(f"Error in test_credentials: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)