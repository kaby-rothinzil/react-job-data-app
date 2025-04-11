// Path: src/components/DataCanvas/DataPreview.js
import React, { useState } from 'react';

const DataPreview = ({ data, columns, totalRows }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 10;

  const filteredData = data.filter(row =>
    row.some((cell, index) => {
      // Only search in enabled columns
      const column = columns[index];
      if (!column || !column.include) return false;

      // Convert cell to string and search
      const cellValue = String(cell || '').toLowerCase();
      return cellValue.includes(searchTerm.toLowerCase());
    })
  );

  const paginatedData = filteredData.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  const pageCount = Math.ceil(filteredData.length / rowsPerPage);

  const formatValue = (value, dataType) => {
    if (value === null || value === undefined) return '-';

    switch(dataType) {
      case 'numeric':
        return isNaN(parseFloat(value)) ? value : parseFloat(value).toLocaleString();
      case 'date':
        return value; // Could add date formatting here
      default:
        return String(value);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing data preview ({Math.min(data.length, totalRows)} of {totalRows} rows)
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0); // Reset to first page on search
              }}
              className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.filter(col => col.include).map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.displayName}
                  <div className="text-xs normal-case font-normal text-gray-400">
                    {column.dataType}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => {
                  const column = columns[cellIndex];
                  if (!column || !column.include) return null;

                  return (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatValue(cell, column.dataType)}
                    </td>
                  );
                })}
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.filter(col => col.include).length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {searchTerm ? 'No matching data found' : 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
              disabled={currentPage === pageCount - 1}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{currentPage * rowsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min((currentPage + 1) * rowsPerPage, filteredData.length)}
                </span>{' '}
                of <span className="font-medium">{filteredData.length}</span> results
              </p>
            </div>

            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">First</span>
                  <span>&laquo;</span>
                </button>

                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <span>&lsaquo;</span>
                </button>

                {[...Array(Math.min(5, pageCount))].map((_, i) => {
                  // Show 5 page numbers centered around current page
                  let pageNum = 0;
                  if (pageCount <= 5) {
                    pageNum = i;
                  } else if (currentPage < 2) {
                    pageNum = i;
                  } else if (currentPage > pageCount - 3) {
                    pageNum = pageCount - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
                  disabled={currentPage === pageCount - 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <span>&rsaquo;</span>
                </button>

                <button
                  onClick={() => setCurrentPage(pageCount - 1)}
                  disabled={currentPage === pageCount - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Last</span>
                  <span>&raquo;</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview;