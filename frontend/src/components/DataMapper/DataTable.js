import React, { useMemo } from 'react';
import { useTable, usePagination, useFilters } from 'react-table';

const DataTable = ({ data, handleSelect, selectedCells }) => {
  const columns = useMemo(
    () => {
      if (data.length > 0) {
        return Object.keys(data[0]).map(key => ({
          Header: key.charAt(0).toUpperCase() + key.slice(1),
          accessor: key,
        }));
      }
      return [];
    },
    [data]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    setFilter,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    gotoPage,
    state: { pageIndex },
  } = useTable({ columns, data, initialState: { pageIndex: 0 } }, useFilters, usePagination);

  const handleCellClick = (rowIndex, columnId, value) => {
    handleSelect(rowIndex, columnId, value);
  };

  const isCellSelected = (rowIndex, columnId) => {
    const rowKey = `row-${rowIndex}`;
    return selectedCells.has(rowKey) && selectedCells.get(rowKey)[columnId];
  };

  return (
    <div className="overflow-x-auto">
      <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.render('Header')}
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    onChange={(e) => setFilter(column.id, e.target.value || undefined)}
                    placeholder={`Search ${column.Header}`}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td
                    {...cell.getCellProps()}
                    onClick={() => handleCellClick(row.index, cell.column.id, cell.value)}
                    className={`px-6 py-4 whitespace-nowrap cursor-pointer ${
                      isCellSelected(row.index, cell.column.id)
                        ? 'bg-blue-100'
                        : ''
                    }`}
                  >
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="py-3 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button onClick={() => previousPage()} disabled={!canPreviousPage} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button onClick={() => nextPage()} disabled={!canNextPage} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{pageIndex + 1}</span> of <span className="font-medium">{pageOptions.length}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                {'<<'}
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                {'<'}
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage} className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                {'>'}
              </button>
              <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                {'>>'}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;