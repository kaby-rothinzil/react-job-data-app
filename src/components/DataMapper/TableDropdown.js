import React, { useState, useEffect } from 'react';

const TableDropdown = ({ selectedTable, handleTableChange }) => {
  const [tableOptions, setTableOptions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;  // Add this flag

    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/tables');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tables = await response.json();

        // Only update state if component is still mounted
        if (isMounted) {
          setTableOptions(tables);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
        // Only update state if component is still mounted
        if (isMounted) {
          setError('Failed to fetch tables. Please check if the backend server is running.');
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTables();

    // Return a cleanup function that runs when the component unmounts
    return () => {
      isMounted = false;  // Set flag to false when unmounting
    };
  }, []);

  if (isLoading) {
    return <p>Loading tables...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
      <div>
        <label htmlFor="table-select" className="block text-sm font-medium text-gray-700">
          Choose Table
        </label>
        <select
            id="table-select"
            value={selectedTable}
            onChange={handleTableChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a table</option>
          {tableOptions.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
          ))}
        </select>
      </div>
  );
};

export default TableDropdown;