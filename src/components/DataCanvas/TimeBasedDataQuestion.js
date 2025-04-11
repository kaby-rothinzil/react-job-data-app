// Path: src/components/DataCanvas/TimeBasedDataQuestion.js
import React from 'react';
import { Schedule, Timeline, TrendingUp, BarChart } from '@mui/icons-material';

const TimeBasedDataQuestion = ({ onSelection }) => {
  return (
    <div className="bg-white shadow rounded-lg p-8 max-w-3xl mx-auto">
      <h3 className="text-xl font-semibold text-center mb-6">Is your data time-based?</h3>

      <p className="text-gray-600 mb-8 text-center">
        Choose 'Yes' if each row has a date or timestamp and you want to predict future values.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onSelection(true)}
          className="flex flex-col items-center bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 p-6 rounded-lg transition duration-200"
        >
          <Timeline className="text-blue-600 text-4xl mb-3" />
          <span className="text-lg font-medium text-blue-800">Yes, Time-Based</span>
          <p className="text-sm text-gray-600 text-center mt-2">
            My data includes dates/times and I want to analyze trends over time or forecast future values.
          </p>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="bg-blue-100 px-2 py-1 rounded mr-2">Time Series</span>
            <span className="bg-blue-100 px-2 py-1 rounded mr-2">Forecasting</span>
            <span className="bg-blue-100 px-2 py-1 rounded">Trends</span>
          </div>
        </button>

        <button
          onClick={() => onSelection(false)}
          className="flex flex-col items-center bg-green-50 hover:bg-green-100 border-2 border-green-200 p-6 rounded-lg transition duration-200"
        >
          <BarChart className="text-green-600 text-4xl mb-3" />
          <span className="text-lg font-medium text-green-800">No, Feature-Based</span>
          <p className="text-sm text-gray-600 text-center mt-2">
            My data represents features and outcomes without a meaningful time component.
          </p>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="bg-green-100 px-2 py-1 rounded mr-2">Classification</span>
            <span className="bg-green-100 px-2 py-1 rounded mr-2">Regression</span>
            <span className="bg-green-100 px-2 py-1 rounded">Features</span>
          </div>
        </button>
      </div>

      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center">
          <Schedule className="mr-2 text-gray-600" />
          Why does this matter?
        </h4>
        <p className="text-sm text-gray-600">
          This helps us select the right algorithms and visualizations for your data.
          Time-based models handle sequences and trends, while feature-based models
          focus on relationships between variables.
        </p>
      </div>
    </div>
  );
};

export default TimeBasedDataQuestion;