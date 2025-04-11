import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import {
  CloudUpload, Storage, TableChart, Refresh,
  Help, Visibility, Build, BarChart, Cancel, Check,
  Timeline // Added Timeline icon import here
} from '@mui/icons-material';

// Core component imports
import DataPreview from './DataPreview';
import DataVisualizer from './DataVisualizer';
import ColumnEditor from './ColumnEditor';
import ModelResults from '../ModelResults';
import LoadingSpinner from '../LoadingSpinner';
import JobHistoryComponent from './JobHistoryComponent';
import EnhancedResultsView from './EnhancedResultsView';
import TimeBasedDataQuestion from './TimeBasedDataQuestion';


// Create a centralized axios instance for API calls
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Increased timeout for longer SageMaker operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor for global error handling
api.interceptors.response.use(
  response => response,
  error => {
    const errorMessage = error.response?.data?.detail || error.message;
    console.error('API Error:', errorMessage);
    return Promise.reject(errorMessage);
  }
);

const DataCanvasComponent = () => {
  // State Management
  const [dataSource, setDataSource] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [problemType, setProblemType] = useState('regression');
  const [modelResults, setModelResults] = useState(null);
  const [activeTab, setActiveTab] = useState('data');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState(null);
  const [statusPollingId, setStatusPollingId] = useState(null);
  const [sageMakerModelName, setSageMakerModelName] = useState('');
  const [isTimeBasedData, setIsTimeBasedData] = useState(null);
  const [showDataTypeQuestion, setShowDataTypeQuestion] = useState(false);

  // Model training parameters
  const [trainingParameters, setTrainingParameters] = useState({
    maxRuntimeSeconds: 3600,
    maxCandidates: 10,
    trainingJobName: `automl-job-${Date.now()}`,
  });

  // Memoized data processing to improve performance
  const availableFeatures = useMemo(() =>
    columns.filter(col => col.name !== targetColumn),
    [columns, targetColumn]
  );

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (statusPollingId) {
        clearInterval(statusPollingId);
      }
    };
  }, [statusPollingId]);

  // Modified handleFileUpload function to show time-based question after parsing
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    // Reset previous states
    setError('');
    setParsedData([]);
    setColumns([]);
    setTargetColumn('');
    setSelectedFeatures([]);
    setModelResults(null);
    setIsTimeBasedData(null); // Reset the time-based flag

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          return;
        }

        if (results.data.length === 0) {
          setError('The CSV file is empty');
          return;
        }

        setParsedData(results.data);

        // Enhanced column detection
        const detectedColumns = Object.keys(results.data[0]).map((name, index) => {
          // Try to infer data type
          const sample = results.data.slice(0, 10).map(row => row[name]);
          const dataType = inferColumnType(sample);

          return {
            name,
            displayName: name,
            dataType,
            include: true,
            originalIndex: index
          };
        });

        setColumns(detectedColumns);
        setSelectedFile(file);

        // Show the time-based data question
        setShowDataTypeQuestion(true);
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
      }
    });
  }, []);

  const handleTimeBasedSelection = (isTimeBased) => {
    setIsTimeBasedData(isTimeBased);
    setShowDataTypeQuestion(false);

    // Optionally, you can auto-detect a date column and suggest it as a feature
    if (isTimeBased) {
      // Look for date columns to suggest for time analysis
      const dateColumn = columns.find(col => col.dataType === 'date');
      if (dateColumn) {
        // You could highlight this column or set it as a special time feature
        console.log(`Detected date column: ${dateColumn.name}`);
      }
    }

    // Proceed to model configuration tab
    setActiveTab('model');
  };

  // Improved column type inference
  const inferColumnType = useCallback((samples) => {
    // Remove null or undefined values
    const validSamples = samples.filter(val => val !== null && val !== undefined);

    if (validSamples.length === 0) return 'string';

    // Check if all values are numeric
    const numericTest = validSamples.every(val =>
      !isNaN(parseFloat(val)) && isFinite(parseFloat(val))
    );
    if (numericTest) return 'numeric';

    // Check for boolean-like values
    const booleanValues = ['true', 'false', '0', '1', 'yes', 'no'];
    const booleanTest = validSamples.every(val =>
      booleanValues.includes(String(val).toLowerCase())
    );
    if (booleanTest) return 'boolean';

    // Check for date-like values
    const dateRegex = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}$/;
    const dateTest = validSamples.every(val =>
      dateRegex.test(String(val))
    );
    if (dateTest) return 'date';

    return 'string';
  }, []);

  // Handle problem type change
  const handleProblemTypeChange = (e) => {
    setProblemType(e.target.value);
  };

  // Create and start a SageMaker AutoML job
  const startAutoMLJob = useCallback(async () => {
    // Validation checks
    if (!selectedFile) {
      setError('Please upload a CSV file');
      return;
    }

    if (!targetColumn) {
      setError('Please select a target column');
      return;
    }

    if (selectedFeatures.length === 0) {
      setError('Please select at least one feature');
      return;
    }

    setIsLoading(true);
    setError('');
    setModelStatus('STARTING');

    try {
      // Create a FormData object to send the file and parameters
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add other parameters to formData
      formData.append('target_attribute_name', targetColumn);
      formData.append('problem_type', problemType);
      formData.append('features', JSON.stringify(selectedFeatures));
      formData.append('max_runtime_seconds', trainingParameters.maxRuntimeSeconds);
      formData.append('max_candidates', trainingParameters.maxCandidates);
      formData.append('job_name', trainingParameters.trainingJobName);

      // Send request to start the AutoML job
      const response = await api.post('/sagemaker/create-autopilot-job', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        setSageMakerModelName(response.data.job_name);
        setModelStatus('IN_PROGRESS');

        // Start polling for job status
        const intervalId = setInterval(() => {
          checkJobStatus(response.data.job_name);
        }, 30000); // Check every 30 seconds

        setStatusPollingId(intervalId);
      }
    } catch (error) {
      console.error('Error starting AutoML job:', error);
      setError(`Failed to start AutoML job: ${error}`);
      setModelStatus('FAILED');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, targetColumn, selectedFeatures, problemType, trainingParameters]);

  // This function checks the status of a SageMaker AutoML job
  const checkJobStatus = async (jobName) => {
    try {
      // Send a request to the API to get the current job status
      const response = await api.get(`/sagemaker/job-status?job_name=${jobName}`);

      // Log the full response for debugging purposes
      console.log("Job status response:", response.data);

      // Extract the status from the response
      const status = response.data.status;

      // Update the component state with the current status
      setModelStatus(status);

      // Convert status to lowercase for case-insensitive comparison
      const statusLower = status.toLowerCase();

      // Check if the job has reached a terminal state (completed, failed, or stopped)
      if (statusLower === 'completed' ||
          statusLower === 'failed' ||
          statusLower === 'stopped') {

        console.log(`Job ${jobName} is now ${status}`);

        // If there's an active polling interval, clear it since we don't need to check anymore
        if (statusPollingId) {
          console.log("Clearing polling interval:", statusPollingId);
          clearInterval(statusPollingId);
          setStatusPollingId(null);
        }

        // If job completed successfully, fetch the results
        if (statusLower === 'completed') {
          console.log("Fetching results for completed job:", jobName);
          fetchAutoMLResults(jobName);
        } else {
          // If job failed or was stopped, show an error message
          setError(`AutoML job ${statusLower}: ${response.data.failure_reason || 'Unknown reason'}`);
        }
      }
    } catch (error) {
      // Log any errors that occur during the status check
      console.error('Error checking job status:', error);
      // Don't stop polling on temporary errors, but log them for debugging
    }
  };

  // Replace the existing fetchAutoMLResults function with this improved version
  const fetchAutoMLResults = async (jobName) => {
    setIsLoading(true);
    setError('');

    try {
      console.log(`Fetching results for job: ${jobName}`);
      const response = await api.get(`/sagemaker/job-results?job_name=${jobName}`);

      // Log the API response for debugging
      console.log("Results API response:", response.data);

      if (!response.data || !response.data.best_candidate) {
        throw new Error("Invalid results data received from server");
      }

      // Extract data from response
      const bestCandidate = response.data.best_candidate;
      const featureImportance = response.data.feature_importance || [];
      const predictions = response.data.predictions || [];

      // Log what we extracted for debugging
      console.log("Best candidate:", bestCandidate);
      console.log("Feature importance:", featureImportance);
      console.log("Predictions:", predictions);

      // Process and set the model results
      const resultData = {
        modelName: bestCandidate.name || jobName || 'AutoML Model',
        modelType: problemType.toLowerCase().includes('regress') ? 'Regression' : 'Classification',
        metrics: bestCandidate.metrics || {},
        predictions: predictions,
        featureImportance: featureImportance
      };

      console.log("Processed model results:", resultData);

      // Update component state with the results
      setModelResults(resultData);

      // Switch to results tab
      setActiveTab('results');

      // Update model status if needed
      if (modelStatus !== 'COMPLETED') {
        setModelStatus('COMPLETED');
      }

    } catch (error) {
      console.error('Error fetching AutoML results:', error);
      setError(`Failed to fetch AutoML results: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop a running SageMaker AutoML job
  const stopAutoMLJob = async () => {
    if (!sageMakerModelName) return;

    try {
      await api.post('/sagemaker/stop-job', { job_name: sageMakerModelName });

      clearInterval(statusPollingId);
      setStatusPollingId(null);
      setModelStatus('STOPPED');
    } catch (error) {
      console.error('Error stopping AutoML job:', error);
      setError(`Failed to stop AutoML job: ${error}`);
    }
  };

  // Feature selection handler
  const handleFeatureToggle = useCallback((featureName) => {
    setSelectedFeatures(prev =>
      prev.includes(featureName)
        ? prev.filter(f => f !== featureName)
        : [...prev, featureName]
    );
  }, []);

  // Handle parameter changes
  const handleParameterChange = useCallback((paramName, value) => {
    setTrainingParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);

  // Training job name generator
  const generateJobName = useCallback(() => {
    const timestamp = Date.now();
    const jobName = `automl-job-${timestamp}`;
    handleParameterChange('trainingJobName', jobName);
  }, [handleParameterChange]);

  // Render the tabs
  const renderTabs = () => {
    return (
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'data' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('data')}
        >
          Data
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'model' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('model')}
        >
          Model Configuration
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('history')}
        >
          Job History
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'results' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('results')}
          disabled={!modelResults}
        >
          Results
        </button>
      </div>
    );
  };

  const handleJobSelect = async (jobName) => {
    setIsLoading(true);
    setError('');
    setSageMakerModelName(jobName);

    try {
      // First, get job details to know problem type and target column
      console.log(`Fetching details for job: ${jobName}`);
      const detailsResponse = await api.get(`/sagemaker/job-details?job_name=${jobName}`);

      // Extract problem type and target variable
      const jobDetails = detailsResponse.data;
      console.log('Job details:', jobDetails);

      // Set problem type if available
      if (jobDetails.problemType) {
        const detectedProblemType = jobDetails.problemType.toLowerCase();
        if (detectedProblemType.includes('regression')) {
          setProblemType('regression');
        } else if (detectedProblemType.includes('binary')) {
          setProblemType('classification');
        } else if (detectedProblemType.includes('multiclass')) {
          setProblemType('multiclass_classification');
        }
      }

      // Set target column if available
      if (jobDetails.targetAttributeName) {
        setTargetColumn(jobDetails.targetAttributeName);
      }

      // Set model status
      setModelStatus('COMPLETED');

      // Then fetch the actual results
      await fetchAutoMLResults(jobName);

      // Navigate to results tab
      setActiveTab('results');
    } catch (error) {
      console.error('Error fetching job details or results:', error);
      setError(`Failed to load job ${jobName}: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHistoryTab = () => {
    return (
      <div>
        <JobHistoryComponent onJobSelect={handleJobSelect} />
      </div>
    );
  };

  // Render data tab content
  const renderDataTab = () => {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <label
            htmlFor="csv-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Upload CSV File
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>

        {parsedData.length > 0 && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Data Preview</h3>
              <DataPreview
                data={parsedData.slice(0, 10).map(row => Object.values(row))}
                columns={columns}
                totalRows={parsedData.length}
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Column Configuration</h3>
              <ColumnEditor
                columns={columns}
                onColumnChange={(index, field, value) => {
                  const newColumns = [...columns];
                  newColumns[index] = {
                    ...newColumns[index],
                    [field]: value
                  };
                  setColumns(newColumns);
                }}
                onHeaderChange={(index, value) => {
                  // Update column headers in the data preview
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  // Render model configuration tab
const renderModelTab = () => {
  return (
    <div className="space-y-6">
      {/* Optional banner indicating the data type */}
      {isTimeBasedData !== null && (
        <div className={`p-4 rounded-md ${
          isTimeBasedData
            ? 'bg-blue-50 border-l-4 border-blue-500'
            : 'bg-green-50 border-l-4 border-green-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {isTimeBasedData ? (
                <Timeline className="h-5 w-5 text-blue-400" />
              ) : (
                <BarChart className="h-5 w-5 text-green-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {isTimeBasedData
                  ? 'Time-Based Analysis Mode'
                  : 'Feature-Based Analysis Mode'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isTimeBasedData
                  ? 'The model will consider temporal patterns in your data.'
                  : 'The model will focus on relationships between features and the target variable.'}
              </p>
              <button
                onClick={() => setShowDataTypeQuestion(true)}
                className="text-xs underline mt-1 text-gray-500 hover:text-gray-700"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Column Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Target and Features</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Target Column
          </label>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Select Target Column</option>
            {columns.map(col => (
              <option key={col.name} value={col.name}>
                {col.displayName} ({col.dataType})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Problem Type
          </label>
          <select
            value={problemType}
            onChange={handleProblemTypeChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {isTimeBasedData ? (
              // Time-based problem types
              <>
                <option value="regression">Time Series Forecasting</option>
                <option value="classification">Time Series Classification</option>
              </>
            ) : (
              // Feature-based problem types
              <>
                <option value="regression">Regression</option>
                <option value="classification">Binary Classification</option>
                <option value="multiclass_classification">Multi-class Classification</option>
              </>
            )}
          </select>

          {isTimeBasedData && (
            <p className="mt-2 text-sm text-gray-500">
              {problemType === 'regression'
                ? 'Forecasting will predict future numeric values based on patterns in historical data.'
                : 'Classification will predict future categories based on patterns in historical data.'}
            </p>
          )}
        </div>

        {/* Feature Selection */}
        {targetColumn && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Features
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
              {availableFeatures.map(col => (
                <label
                  key={col.name}
                  className={`inline-flex items-center space-x-2 p-2 ${
                    isTimeBasedData && col.dataType === 'date'
                      ? 'bg-blue-50 rounded'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(col.name)}
                    onChange={() => handleFeatureToggle(col.name)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm">
                    {col.displayName}
                    {isTimeBasedData && col.dataType === 'date' && (
                      <span className="ml-1 text-xs text-blue-600">(date)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {selectedFeatures.length} of {availableFeatures.length} features selected
            </div>
          </div>
        )}
      </div>

      {/* SageMaker AutoPilot Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">SageMaker AutoML Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Job Name
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={trainingParameters.trainingJobName}
                onChange={(e) => handleParameterChange('trainingJobName', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              />
              <button
                onClick={generateJobName}
                className="mt-1 px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Runtime (seconds)
            </label>
            <input
              type="number"
              min="600"
              max="86400"
              value={trainingParameters.maxRuntimeSeconds}
              onChange={(e) => handleParameterChange('maxRuntimeSeconds', parseInt(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">Min: 10 minutes, Max: 24 hours</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Model Candidates
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={trainingParameters.maxCandidates}
              onChange={(e) => handleParameterChange('maxCandidates', parseInt(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">Higher values = more thorough search but longer runtime</p>
          </div>
        </div>
      </div>

      {/* Start Training Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={startAutoMLJob}
          disabled={isLoading || !targetColumn || selectedFeatures.length === 0 || modelStatus === 'IN_PROGRESS'}
          className={`py-2 px-6 text-white rounded-md flex items-center space-x-2 ${
            isLoading || !targetColumn || selectedFeatures.length === 0 || modelStatus === 'IN_PROGRESS'
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? <LoadingSpinner /> : <><Build className="mr-2" /> Start AutoML Training</>}
        </button>

        {modelStatus === 'IN_PROGRESS' && (
          <button
            onClick={stopAutoMLJob}
            className="py-2 px-6 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center space-x-2"
          >
            <Cancel className="mr-2" /> Stop Training
          </button>
        )}
      </div>

      {/* Status Display */}
      {modelStatus && (
        <div className={`p-4 rounded-md ${
          modelStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          modelStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
          modelStatus === 'STOPPED' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          <div className="flex items-center">
            {modelStatus === 'COMPLETED' ? <Check className="mr-2" /> :
             modelStatus === 'FAILED' ? <Cancel className="mr-2" /> :
             <LoadingSpinner />}
            <div>
              <p className="font-medium">Job Status: {modelStatus}</p>
              {modelStatus === 'IN_PROGRESS' && (
                <p className="text-sm">This may take some time depending on your dataset size and settings.</p>
              )}
              {sageMakerModelName && (
                <p className="text-sm">Job Name: {sageMakerModelName}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Force Fetch Results Button */}
      {sageMakerModelName && (
        <div className="mt-4">
          <button
            onClick={() => {
              fetchAutoMLResults(sageMakerModelName);
              setActiveTab('results');
            }}
            className="py-2 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <Refresh className="mr-2" /> Force Fetch Results
          </button>
          <p className="mt-2 text-sm text-gray-600">
              If your job is complete but status is stuck, click this button to manually retrieve results.
            </p>
          </div>
        )}
      </div>
  );
};

  // Render results tab
  const renderResultsTab = () => {
    if (!modelResults) {
      return (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-500">No model results available yet</h3>
          <p className="mt-2 text-sm text-gray-500">Complete model training or select a job from history to see results here</p>
        </div>
      );
    }

    return (
      <EnhancedResultsView
        results={modelResults}
        columns={columns}
        onBackToHistory={() => setActiveTab('history')}
        jobName={sageMakerModelName}
      />
    );
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          DataCanvas: SageMaker AutoML
          <span className="ml-2 text-sm text-gray-500">
            (Automated Machine Learning)
          </span>
        </h1>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error: </strong>
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'model' && renderModelTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'results' && renderResultsTab()}
      </div>

      {/* Show the time-based data question when appropriate */}
      {showDataTypeQuestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
            <TimeBasedDataQuestion onSelection={handleTimeBasedSelection} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCanvasComponent;