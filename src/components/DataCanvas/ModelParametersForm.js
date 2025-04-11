// Path: src/components/DataCanvas/ModelParametersForm.js
import React from 'react';

const ModelParametersForm = ({ modelType, parameters, onParameterChange }) => {
  // Define parameter descriptions and constraints based on model type
  const getParameterDetails = () => {
    const commonParams = {
      maxIterations: {
        label: 'Max Iterations',
        description: 'Maximum number of iterations for the algorithm',
        type: 'number',
        min: 1,
        max: 1000,
        step: 10
      },
      learningRate: {
        label: 'Learning Rate',
        description: 'Step size for gradient-based optimization',
        type: 'number',
        min: 0.001,
        max: 1,
        step: 0.01
      },
      regularization: {
        label: 'Regularization',
        description: 'Strength of regularization to prevent overfitting',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01
      }
    };

    switch(modelType) {
      case 'Classification':
        return {
          ...commonParams,
          classWeights: {
            label: 'Class Weights',
            description: 'How to handle class imbalance',
            type: 'select',
            options: [
              { value: 'balanced', label: 'Balanced' },
              { value: 'none', label: 'None' }
            ]
          },
          threshold: {
            label: 'Classification Threshold',
            description: 'Probability threshold for positive class prediction',
            type: 'number',
            min: 0.01,
            max: 0.99,
            step: 0.01
          }
        };
      case 'Regression':
        return {
          ...commonParams,
          lossFunction: {
            label: 'Loss Function',
            description: 'Function to measure prediction error',
            type: 'select',
            options: [
              { value: 'mse', label: 'Mean Squared Error' },
              { value: 'mae', label: 'Mean Absolute Error' },
              { value: 'huber', label: 'Huber Loss' }
            ]
          }
        };
      case 'Clustering':
        return {
          clusters: {
            label: 'Number of Clusters',
            description: 'Number of clusters to create',
            type: 'number',
            min: 2,
            max: 20,
            step: 1
          },
          maxIterations: commonParams.maxIterations,
          distanceMetric: {
            label: 'Distance Metric',
            description: 'Method to calculate distance between points',
            type: 'select',
            options: [
              { value: 'euclidean', label: 'Euclidean' },
              { value: 'manhattan', label: 'Manhattan' },
              { value: 'cosine', label: 'Cosine' }
            ]
          },
          initialization: {
            label: 'Initialization Method',
            description: 'How to initialize cluster centers',
            type: 'select',
            options: [
              { value: 'k-means++', label: 'K-Means++' },
              { value: 'random', label: 'Random' }
            ]
          }
        };
      default:
        return {};
    }
  };

  const paramDetails = getParameterDetails();

  // Render different input types based on parameter type
  const renderParameterInput = (paramName, details) => {
    if (!details) return null;

    const value = parameters[paramName] !== undefined ? parameters[paramName] : '';

    switch(details.type) {
      case 'number':
        return (
          <input
            type="number"
            id={paramName}
            value={value}
            min={details.min}
            max={details.max}
            step={details.step}
            onChange={(e) => onParameterChange(paramName, parseFloat(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );
      case 'select':
        return (
          <select
            id={paramName}
            value={value}
            onChange={(e) => onParameterChange(paramName, e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {details.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            id={paramName}
            value={value}
            onChange={(e) => onParameterChange(paramName, e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );
    }
  };

  // Reset parameters to default values
  const handleResetDefaults = () => {
    // Create default values for all parameters
    const defaults = {};
    Object.entries(paramDetails).forEach(([paramName, details]) => {
      if (details.type === 'number') {
        // Use middle of the range as default
        defaults[paramName] = (details.min + details.max) / 2;
      } else if (details.type === 'select' && details.options.length > 0) {
        // Use first option as default
        defaults[paramName] = details.options[0].value;
      }
    });

    // Update all parameters at once
    Object.entries(defaults).forEach(([param, value]) => {
      onParameterChange(param, value);
    });
  };

  return (
    <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Model Parameters
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Customize how the model will be trained and evaluated
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reset to Defaults
        </button>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.entries(paramDetails).map(([paramName, details]) => (
            <div key={paramName} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div>{details.label}</div>
                <div className="text-xs font-normal text-gray-400 mt-1">
                  {details.description}
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {renderParameterInput(paramName, details)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default ModelParametersForm;