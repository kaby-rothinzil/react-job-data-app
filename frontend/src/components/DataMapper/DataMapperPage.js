import React, { useState } from 'react';
import DataTableContainer from './DataTableContainer';
import CombinedTable from './CombinedTable';
import LoadingSpinner from '../LoadingSpinner';

const DataMapperPage = () => {
  const [selectedItems1, setSelectedItems1] = useState(new Map());
  const [selectedItems2, setSelectedItems2] = useState(new Map());
  const [tableName1, setTableName1] = useState('');
  const [tableName2, setTableName2] = useState('');
  const [schema, setSchema] = useState('');
  const [tableName, setTableName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const combinedData = [];
    selectedItems1.forEach((values1, key1) => {
      selectedItems2.forEach((values2, key2) => {
        combinedData.push({
          ...values1,
          ...values2
        });
      });
    });

    if (!schema || !tableName || combinedData.length === 0) {
      setError('Please fill in all required fields: Schema, Table Name, and select data to combine');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/write-to-redshift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          tableName,
          data: combinedData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Data successfully written to Redshift!');
        setError('');
      } else {
        setError(`Failed to write data to Redshift: ${result.error}`);
        console.error('Error writing to Redshift:', result);
      }
    } catch (error) {
      setError('An error occurred while writing to Redshift. Please check the console for more details.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">DataMapper</h1>
        <div className="space-y-8">
          <DataTableContainer tableId={1} onSelectionChange={setSelectedItems1} onTableChange={setTableName1} />
          <DataTableContainer tableId={2} onSelectionChange={setSelectedItems2} onTableChange={setTableName2} />
        </div>
        <CombinedTable selectedItems1={selectedItems1} selectedItems2={selectedItems2} tableName1={tableName1} tableName2={tableName2} />
        <div className="space-y-4">
          <div>
            <label htmlFor="schema" className="block text-sm font-medium text-gray-700">Schema</label>
            <input
                type="text"
                id="schema"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="tableName" className="block text-sm font-medium text-gray-700">Table Name</label>
            <input
                type="text"
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? <LoadingSpinner /> : 'Write to Redshift'}
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
  );
};

export default DataMapperPage;