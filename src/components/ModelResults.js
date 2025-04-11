import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ZAxis
} from 'recharts';
import { Info } from '@mui/icons-material';

// Utility function for metric descriptions
const getMetricDescription = (key) => {
  const descriptions = {
    // Classification metrics
    'accuracy': "Proportion of correctly classified instances out of all instances",
    'precision': "Proportion of true positive predictions out of all positive predictions",
    'recall': "Proportion of true positive predictions out of all actual positives",
    'f1Score': "Harmonic mean of precision and recall",
    'Accuracy': "Proportion of correctly classified instances out of all instances",
    'F1': "Weighted harmonic mean of precision and recall",
    'F1macro': "Unweighted mean of F1 score for each class",
    'AUC': "Area Under the ROC Curve - represents probability that model ranks a random positive example higher than a random negative example",

    // Regression metrics
    'mse': "Mean Squared Error - Average of squared differences between predicted and actual values",
    'rmse': "Root Mean Squared Error - Square root of MSE, in the same units as the target variable",
    'r2': "R-squared - Proportion of variance in the dependent variable explained by the model",
    'maeError': "Mean Absolute Error - Average of absolute differences between predicted and actual values",
    'MSE': "Mean Squared Error - Average of squared differences between predicted and actual values",
    'RMSE': "Root Mean Squared Error - Square root of MSE, in the same units as the target variable",
    'R2': "R-squared - Proportion of variance in the dependent variable explained by the model",
    'MAE': "Mean Absolute Error - Average of absolute differences between predicted and actual values",

    // Clustering metrics
    'silhouetteScore': "Measure of how similar an object is to its own cluster compared to other clusters",
    'withinClusterSumOfSquares': "Sum of squared distances between each point and its assigned cluster centroid",
    'explainedVariance': "Amount of variance retained after dimensionality reduction",
    'anomalyPercentage': "Percentage of data points identified as anomalies"
  };

  return descriptions[key] || "No description available";
};

const ModelResults = ({ results, columns = [] }) => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [showTooltip, setShowTooltip] = useState({});

  if (!results) {
    return <div>No results available</div>;
  }

  const { modelName, modelType, metrics = {}, predictions = [], featureImportance = [] } = results;

  // Memoized feature importance mapping
  const mappedFeatureImportance = useMemo(() =>
    featureImportance.map(feature => {
      const matchingColumn = columns.find(col =>
        col.name.toLowerCase() === feature.name.toLowerCase() ||
        `feature_${col.originalIndex + 1}` === feature.name
      );

      return {
        ...feature,
        displayName: matchingColumn ? matchingColumn.displayName : feature.name,
        description: matchingColumn ? `Original field: ${matchingColumn.name}` : undefined
      };
    }),
    [featureImportance, columns]
  );

  // Tooltip Helper Component
  const TooltipHelper = ({ id, title, content }) => (
    <div className="relative inline-block ml-1">
      <div
        className="text-gray-500 cursor-pointer"
        onClick={() => setShowTooltip(prev => ({
          ...prev,
          [id]: !prev[id]
        }))}
      >
        <Info fontSize="small" />
      </div>
      {showTooltip[id] && (
        <div className="absolute z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-sm text-gray-600 -top-2 left-6">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-medium text-gray-800">{title}</h4>
            <button
              onClick={() => setShowTooltip(prev => ({
                ...prev,
                [id]: false
              }))}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p>{content}</p>
        </div>
      )}
    </div>
  );

  // Render method for metrics
  const renderMetrics = () => {
    if (!metrics || Object.keys(metrics).length === 0) {
      return <div>No metrics available</div>;
    }

    // Prepare data for metrics chart
    const metricsChartData = Object.entries(metrics).map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').trim(),
      value: typeof value === 'number' ? value : 0
    }));

    return (
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(metrics).map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                    <TooltipHelper
                      id={`metric-${key}`}
                      title={key.replace(/([A-Z])/g, ' $1').trim()}
                      content={getMetricDescription(key)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {typeof value === 'number' ? value.toFixed(4) : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metricsChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => value.toFixed(4)} />
              <Bar dataKey="value" fill="#8884d8" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Determine the prediction type based on the data structure
  const getPredictionType = () => {
    if (!predictions || predictions.length === 0) return 'unknown';
    const firstPrediction = predictions[0];

    if ('predictedClass' in firstPrediction) return 'classification';
    if ('predictedValue' in firstPrediction) return 'regression';

    return 'unknown';
  };

  // Render method for predictions
  const renderPredictions = () => {
    if (!predictions || predictions.length === 0) {
      return <div>No predictions available</div>;
    }

    // Determine if predictions are classification or regression
    const predictionType = getPredictionType();

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {predictionType === 'classification' ? (
                <>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predicted Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probability
                  </th>
                </>
              ) : (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted Value
                </th>
              )}
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictions.slice(0, 20).map((prediction, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prediction.id || index + 1}
                </td>
                {predictionType === 'classification' ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prediction.predictedClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {(prediction.probability * 100).toFixed(2)}%
                    </td>
                  </>
                ) : (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {typeof prediction.predictedValue === 'number'
                      ? prediction.predictedValue.toFixed(4)
                      : prediction.predictedValue}
                  </td>
                )}
                {prediction.actual !== undefined && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {typeof prediction.actual === 'number'
                        ? prediction.actual.toFixed(4)
                        : prediction.actual}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {predictionType === 'classification' ? (
                        <span className={prediction.predictedClass === prediction.actual ? 'text-green-500' : 'text-red-500'}>
                          {prediction.predictedClass === prediction.actual ? 'Correct' : 'Incorrect'}
                        </span>
                      ) : (
                        <span className="text-blue-500">
                          {typeof prediction.predictedValue === 'number' && typeof prediction.actual === 'number' ?
                            Math.abs(prediction.predictedValue - prediction.actual).toFixed(4) : 'N/A'}
                        </span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {predictions.length > 20 && (
          <div className="text-sm text-gray-500 mt-2 text-right">
            Showing 20 of {predictions.length} predictions
          </div>
        )}
      </div>
    );
  };

  // Render method for feature importance
  const renderFeatureImportance = () => {
    if (!mappedFeatureImportance || mappedFeatureImportance.length === 0) {
      return <div>No feature importance data available</div>;
    }

    // Sort by importance value
    const sortedFeatures = [...mappedFeatureImportance].sort((a, b) => b.importance - a.importance);

    return (
      <div className="space-y-8">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedFeatures}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, Math.max(...sortedFeatures.map(d => d.importance)) * 1.1]} />
              <YAxis dataKey="displayName" type="category" width={140} />
              <Tooltip formatter={(value) => (value * 100).toFixed(2) + '%'} />
              <Bar dataKey="importance" fill="#82ca9d" name="Importance" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {sortedFeatures.map((feature) => (
          <div key={feature.name} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {feature.displayName || feature.name}
                {feature.description && (
                  <TooltipHelper
                    id={`feature-${feature.name}`}
                    title={feature.displayName || feature.name}
                    content={feature.description}
                  />
                )}
              </span>
              <span className="text-sm text-gray-500">{(feature.importance * 100).toFixed(2)}%</span>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${feature.importance * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render tabs
  const renderTabs = () => {
    const tabs = [
      { id: 'metrics', label: 'Metrics & Performance' },
      { id: 'predictions', label: 'Predictions' },
      { id: 'importance', label: 'Feature Importance' },
    ];

    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Results for {modelName}
        </h3>
        <p className="text-sm text-gray-600">
          Model Type: {modelType}
        </p>
      </div>

      {renderTabs()}

      <div className="mt-6">
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'predictions' && renderPredictions()}
        {activeTab === 'importance' && renderFeatureImportance()}
      </div>
    </div>
  );
};

export default ModelResults;