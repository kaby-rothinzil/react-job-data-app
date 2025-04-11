// Path: src/components/DataCanvas/EnhancedResultsView.js
import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { ArrowBack, BarChart as BarChartIcon, BubbleChart,
  Timeline, TableChart, Dashboard, Download } from '@mui/icons-material';
import ModelResults from '../ModelResults';

const EnhancedResultsView = ({ results, columns, onBackToHistory, jobName }) => {
  const [activeView, setActiveView] = useState('dashboard');

  if (!results) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-500">No model results available</h3>
        <p className="mt-2 text-sm text-gray-500">Please select a job from history to view results</p>
        <button
          onClick={onBackToHistory}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Job History
        </button>
      </div>
    );
  }

  const { modelName, modelType, metrics = {}, predictions = [], featureImportance = [] } = results;

  // Determine whether this is classification or regression
  const isRegression = modelType.toLowerCase().includes('regress');

  // Function to calculate prediction accuracy (for classification)
  const calculateAccuracy = () => {
    if (!predictions || predictions.length === 0 || !predictions[0].actual) return null;

    const correctPredictions = predictions.filter(
      p => p.predictedClass === p.actual
    ).length;

    return (correctPredictions / predictions.length) * 100;
  };

  // Function to calculate error metrics (for regression)
  const calculateErrorMetrics = () => {
    if (!predictions || predictions.length === 0 || !predictions[0].actual) return null;

    const errors = predictions.map(p => p.predictedValue - p.actual);
    const absErrors = errors.map(Math.abs);

    const metrics = {
      mae: absErrors.reduce((sum, val) => sum + val, 0) / absErrors.length,
      rmse: Math.sqrt(errors.reduce((sum, val) => sum + val * val, 0) / errors.length),
      mape: predictions.reduce((sum, p) => {
        if (p.actual === 0) return sum;
        return sum + (Math.abs((p.predictedValue - p.actual) / p.actual));
      }, 0) / predictions.length * 100
    };

    return metrics;
  };

  // Function to generate confusion matrix (for classification)
  const generateConfusionMatrix = () => {
    if (!predictions || predictions.length === 0 || !predictions[0].actual) return null;

    // Get unique classes
    const classes = [...new Set([
      ...predictions.map(p => p.predictedClass),
      ...predictions.map(p => p.actual)
    ])];

    // Create confusion matrix
    const matrix = {};
    classes.forEach(actual => {
      matrix[actual] = {};
      classes.forEach(predicted => {
        matrix[actual][predicted] = predictions.filter(
          p => p.actual === actual && p.predictedClass === predicted
        ).length;
      });
    });

    return { matrix, classes };
  };

  // Generate chart data for confidence distribution (classification)
  const generateConfidenceDistribution = () => {
    if (!predictions || predictions.length === 0) return [];

    // Group predictions by confidence ranges
    const ranges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const distribution = ranges.slice(0, -1).map((min, i) => {
      const max = ranges[i + 1];
      const inRange = predictions.filter(
        p => p.probability >= min && p.probability < max
      );

      return {
        range: `${(min * 100).toFixed(0)}-${(max * 100).toFixed(0)}%`,
        count: inRange.length,
        correct: inRange.filter(p => p.predictedClass === p.actual).length || 0
      };
    });

    return distribution;
  };

  // Generate feature importances for chart
  const prepareFeatureImportanceData = () => {
    if (!featureImportance || featureImportance.length === 0) return [];

    return featureImportance
      .slice() // Create a copy
      .sort((a, b) => b.importance - a.importance) // Sort by importance
      .slice(0, 10); // Take top 10
  };

  // Create scatter data for actual vs predicted (regression)
  const createScatterData = () => {
    if (!predictions || predictions.length === 0 || !predictions[0].actual) return [];

    return predictions.map(p => ({
      x: p.actual,
      y: p.predictedValue,
      id: p.id
    }));
  };

  // Render dashboard view with high-level metrics and charts
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Model Info Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Model Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Model Name:</span>
                <span className="font-medium">{modelName || 'AutoML Model'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Model Type:</span>
                <span className="font-medium">{modelType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Job Name:</span>
                <span className="font-medium text-sm truncate">{jobName}</span>
              </div>
            </div>
          </div>

          {/* Primary Metric Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {isRegression ? 'Primary Error Metric' : 'Classification Accuracy'}
            </h3>
            <div className="flex items-center justify-center h-24">
              {isRegression ? (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {(metrics.RMSE || metrics.rmse || 0).toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-500">RMSE</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {(metrics.Accuracy || metrics.accuracy || calculateAccuracy() || 0).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-500">Accuracy</div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Metrics Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Additional Metrics</h3>
            <div className="space-y-2">
              {isRegression ? (
                // Regression metrics
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">MAE:</span>
                    <span className="font-medium">{(metrics.MAE || metrics.mae || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">R²:</span>
                    <span className="font-medium">{(metrics.R2 || metrics.r2 || 0).toFixed(4)}</span>
                  </div>
                </>
              ) : (
                // Classification metrics
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Precision:</span>
                    <span className="font-medium">{(metrics.Precision || metrics.precision || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recall:</span>
                    <span className="font-medium">{(metrics.Recall || metrics.recall || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">F1 Score:</span>
                    <span className="font-medium">{(metrics.F1 || metrics.f1Score || 0).toFixed(4)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feature Importance Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Top Feature Importance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareFeatureImportanceData()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'auto']} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip
                  formatter={(value) => [(value * 100).toFixed(2) + '%', 'Importance']}
                />
                <Bar dataKey="importance" fill="#8884d8">
                  {prepareFeatureImportanceData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`#${(index * 30 + 120).toString(16)}84d8`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Performance Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {isRegression ? 'Prediction vs Actual' : 'Prediction Confidence Distribution'}
          </h3>
          <div className="h-64">
            {isRegression ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right:
                    30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Actual"
                    label={{ value: 'Actual', position: 'insideBottomRight', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Predicted"
                    label={{ value: 'Predicted', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <ReferenceLine x={0} y={0} stroke="red" strokeWidth={2} />
                  <ReferenceLine y={0} stroke="#666" />
                  <ReferenceLine x={0} stroke="#666" />
                  {/* Perfect prediction line (y=x) */}
                  <ReferenceLine
                    segment={[{ x: -1000, y: -1000 }, { x: 1000, y: 1000 }]}
                    stroke="blue"
                    strokeDasharray="3 3"
                  />
                  <Scatter
                    name="Predictions"
                    data={createScatterData()}
                    fill="#8884d8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={generateConfidenceDistribution()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="range"
                    label={{ value: 'Confidence Range', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Total Predictions" />
                  <Bar dataKey="correct" fill="#82ca9d" name="Correct Predictions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render a more detailed view using the ModelResults component
  const renderDetailedView = () => {
    return (
      <ModelResults results={results} columns={columns} />
    );
  };

  // Render predictions table
  const renderPredictionsTable = () => {
    if (!predictions || predictions.length === 0) {
      return <div>No predictions available</div>;
    }

    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {isRegression ? (
                <>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predicted Value
                  </th>
                  {predictions[0].actual !== undefined && (
                    <>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </>
                  )}
                </>
              ) : (
                <>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predicted Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  {predictions[0].actual !== undefined && (
                    <>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Class
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correct
                      </th>
                    </>
                  )}
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictions.map((prediction, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {prediction.id !== undefined ? prediction.id : index + 1}
                </td>
                {isRegression ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {typeof prediction.predictedValue === 'number'
                        ? prediction.predictedValue.toFixed(4)
                        : prediction.predictedValue}
                    </td>
                    {prediction.actual !== undefined && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {typeof prediction.actual === 'number'
                            ? prediction.actual.toFixed(4)
                            : prediction.actual}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {typeof prediction.predictedValue === 'number' && typeof prediction.actual === 'number' ? (
                            <span className={
                              Math.abs(prediction.predictedValue - prediction.actual) <=
                              (prediction.actual * 0.1) ? 'text-green-500' : 'text-red-500'
                            }>
                              {(prediction.predictedValue - prediction.actual).toFixed(4)}
                            </span>
                          ) : 'N/A'}
                        </td>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prediction.predictedClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {typeof prediction.probability === 'number'
                        ? (prediction.probability * 100).toFixed(2) + '%'
                        : prediction.probability}
                    </td>
                    {prediction.actual !== undefined && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prediction.actual}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {prediction.predictedClass === prediction.actual ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              ✓
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              ✗
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render feature importance details
  const renderFeatureImportance = () => {
    if (!featureImportance || featureImportance.length === 0) {
      return <div>No feature importance data available</div>;
    }

    // Sort features by importance
    const sortedFeatures = [...featureImportance].sort((a, b) => b.importance - a.importance);

    return (
      <div className="space-y-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedFeatures}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, Math.max(...sortedFeatures.map(f => f.importance)) * 1.1]}
              />
              <YAxis dataKey="name" type="category" width={140} />
              <Tooltip formatter={(value) => (value * 100).toFixed(2) + '%'} />
              <Bar dataKey="importance" name="Importance">
                {sortedFeatures.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`#${(index * 30 + 120).toString(16)}84d8`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relative
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedFeatures.map((feature, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {feature.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {(feature.importance * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(feature.importance / sortedFeatures[0].importance) * 100}%`
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Main render function with view selector
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBackToHistory}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowBack />
          </button>
          <h2 className="text-xl font-semibold">
            {modelName || 'AutoML Model'} Results
          </h2>
        </div>
        <div>
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            // Add download functionality here
          >
            <Download className="h-4 w-4 mr-1" /> Download Results
          </button>
        </div>
      </div>

      {/* View selector */}
      <div className="flex space-x-2 border-b pb-2">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded ${
            activeView === 'dashboard'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Dashboard className="h-4 w-4 mr-1" /> Dashboard
        </button>
        <button
          onClick={() => setActiveView('detailed')}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded ${
            activeView === 'detailed'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BubbleChart className="h-4 w-4 mr-1" /> Detailed Analysis
        </button>
        <button
          onClick={() => setActiveView('predictions')}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded ${
            activeView === 'predictions'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TableChart className="h-4 w-4 mr-1" /> Predictions
        </button>
        <button
          onClick={() => setActiveView('features')}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded ${
            activeView === 'features'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChartIcon className="h-4 w-4 mr-1" /> Feature Importance
        </button>
      </div>

      {/* Display selected view */}
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'detailed' && renderDetailedView()}
      {activeView === 'predictions' && renderPredictionsTable()}
      {activeView === 'features' && renderFeatureImportance()}
    </div>
  );
};

export default EnhancedResultsView;