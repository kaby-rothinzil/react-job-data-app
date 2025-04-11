// Path: src/components/DataCanvas/ModelSelector.js
import React from 'react';

const ModelSelector = ({ models, selectedModel, onSelectModel }) => {
  // Group models by type
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.type]) {
      acc[model.type] = [];
    }
    acc[model.type].push(model);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
          Select a Model
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a model</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.type}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groupedModels).map(([type, typeModels]) => (
          <div key={type} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {type}
              </h3>
              <div className="mt-2">
                <ul className="divide-y divide-gray-200">
                  {typeModels.map((model) => (
                    <li
                      key={model.id}
                      className={`py-3 flex cursor-pointer hover:bg-gray-50 ${selectedModel === model.id ? 'bg-blue-50' : ''}`}
                      onClick={() => onSelectModel(model.id)}
                    >
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${selectedModel === model.id ? 'text-blue-600' : 'text-gray-900'}`}>
                          {model.name}
                        </p>
                        <p className="text-xs text-gray-500">{model.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedModel && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Selected Model Details
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {models
              .filter(model => model.id === selectedModel)
              .map(model => (
                <dl className="sm:divide-y sm:divide-gray-200" key={model.id}>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{model.name}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{model.type}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{model.description}</dd>
                  </div>
                  {model.accuracyMetric && (
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Accuracy Metric</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{model.accuracyMetric}</dd>
                    </div>
                  )}
                </dl>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;