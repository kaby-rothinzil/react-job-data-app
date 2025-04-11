// Path: src/components/DataCanvas/ColumnEditor.js
import React, { useState } from 'react';

const ColumnEditor = ({ columns, onColumnChange, onHeaderChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter columns based on search term
  const filteredColumns = columns.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDataTypeChange = (index, newType) => {
    onColumnChange(index, 'dataType', newType);
  };

  const handleIncludeChange = (index, checked) => {
    onColumnChange(index, 'include', checked);
  };

  const handleDisplayNameChange = (index, value) => {
    onColumnChange(index, 'displayName', value);
    onHeaderChange(index, value);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <h3 className="text-lg font-medium">Column Configuration</h3>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              // Include all columns
              columns.forEach((_, index) => onColumnChange(index, 'include', true));
            }}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 mr-2"
          >
            Select All
          </button>
          <button
            onClick={() => {
              // Include none of the columns
              columns.forEach((_, index) => onColumnChange(index, 'include', false));
            }}
            className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-white overflow-hidden rounded-lg border border-gray-300">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Include
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Data Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredColumns.map((column, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={column.include}
                      onChange={(e) => handleIncludeChange(index, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="text"
                      value={column.displayName}
                      onChange={(e) => handleDisplayNameChange(index, e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      value={column.dataType}
                      onChange={(e) => handleDataTypeChange(index, e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="string">String</option>
                      <option value="numeric">Numeric</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredColumns.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan={4}>
                    No columns match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="text-sm font-medium text-gray-700">
            {columns.filter(col => col.include).length} of {columns.length} columns included
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the checkboxes to include or exclude columns from analysis</li>
          <li>Rename columns by changing the display name</li>
          <li>Set the correct data type to improve visualizations and model accuracy</li>
        </ul>
      </div>
    </div>
  );
};

export default ColumnEditor;