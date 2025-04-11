// Path: src/components/DataCanvas/JobHistoryComponent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Refresh, SearchOutlined, Check, Cancel, Help } from '@mui/icons-material';
import LoadingSpinner from '../LoadingSpinner';

// Create a centralized axios instance for API calls
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const JobHistoryComponent = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('creationTime');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch job history when component mounts
  useEffect(() => {
    fetchJobHistory();
  }, []);

  // Function to fetch job history from the backend
  const fetchJobHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/sagemaker/list-jobs');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching job history:', error);
      setError('Failed to fetch job history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job =>
    job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.problemType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort jobs based on the selected field and direction
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let compareA = a[sortField];
    let compareB = b[sortField];

    // Handle string comparison
    if (typeof compareA === 'string') {
      compareA = compareA.toLowerCase();
      compareB = compareB.toLowerCase();
    }

    // Handle null values
    if (compareA === null) return 1;
    if (compareB === null) return -1;

    // Perform the comparison
    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort click
  const handleSortClick = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Format date string for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Get status icon based on job status
  const getStatusIcon = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') {
      return <Check className="text-green-500" />;
    } else if (statusLower === 'failed' || statusLower === 'stopped') {
      return <Cancel className="text-red-500" />;
    } else if (statusLower === 'inprogress' || statusLower === 'in_progress') {
      return <LoadingSpinner size="small" />;
    } else {
      return <Help className="text-gray-500" />;
    }
  };

  // Calculate duration in human-readable format
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';

    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMs = end - start;

      // Format duration
      const seconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">SageMaker AutoML Job History</h2>
        <button
          onClick={fetchJobHistory}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          <Refresh className="h-4 w-4 mr-1" /> Refresh
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchOutlined className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {!isLoading && jobs.length === 0 && !error && (
        <div className="p-4 text-gray-700 bg-gray-100 rounded-lg">
          No job history found. Start a new AutoML job to see it here.
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSortClick('jobName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Job Name
                  {sortField === 'jobName' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSortClick('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Status
                  {sortField === 'status' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSortClick('problemType')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Problem Type
                  {sortField === 'problemType' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSortClick('creationTime')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Created
                  {sortField === 'creationTime' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSortClick('endTime')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Completed
                  {sortField === 'endTime' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedJobs.map((job) => (
                <tr key={job.jobName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.jobName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className="ml-2">{job.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.problemType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.creationTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(job.endTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateDuration(job.creationTime, job.endTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onJobSelect(job.jobName)}
                      disabled={job.status.toLowerCase() !== 'completed'}
                      className={`text-sm font-medium px-3 py-1 rounded ${
                        job.status.toLowerCase() === 'completed'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      View Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-gray-500 italic">
        Showing {filteredJobs.length} of {jobs.length} jobs
      </div>
    </div>
  );
};

export default JobHistoryComponent;