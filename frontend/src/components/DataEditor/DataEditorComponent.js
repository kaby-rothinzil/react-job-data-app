import React, { useState, useEffect } from 'react';
import { useTable, useFilters, usePagination } from 'react-table';
import LoadingSpinner from '../LoadingSpinner';

const DataEditorComponent = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchTableData(selectedTable);
        }
    }, [selectedTable]);

    const fetchTables = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/tables');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setTables(data);
            } else {
                throw new Error('Unexpected data format for tables');
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            setError('Failed to fetch tables. Please check if the backend server is running.');
            setTables([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTableData = async (table) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/data?table=${table}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setTableData(data);
                if (data.length > 0) {
                    setColumns(Object.keys(data[0]).map(key => ({
                        Header: key,
                        accessor: key,
                        Filter: ColumnFilter,
                    })));
                } else {
                    setColumns([]);
                }
            } else {
                throw new Error('Unexpected data format for table data');
            }
        } catch (error) {
            console.error('Error fetching table data:', error);
            setError('Failed to fetch table data. Please try again.');
            setTableData([]);
            setColumns([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTableChange = (e) => {
        setSelectedTable(e.target.value);
    };

    const handleAddRow = () => {
        const newRow = columns.reduce((acc, column) => {
            acc[column.accessor] = '';
            return acc;
        }, {});
        setTableData([...tableData, newRow]);
    };

    const handleDeleteRow = (index) => {
        const newData = [...tableData];
        newData.splice(index, 1);
        setTableData(newData);
    };

    const handleCellChange = (index, columnId, value) => {
        const newData = [...tableData];
        newData[index][columnId] = value;
        setTableData(newData);
    };

    const handleSubmitChanges = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/update-table', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    table: selectedTable,
                    data: tableData,
                }),
            });
            const result = await response.json();
            if (response.ok) {
                alert('Changes submitted successfully!');
            } else {
                alert(`Failed to submit changes: ${result.error}`);
            }
        } catch (error) {
            console.error('Error submitting changes:', error);
            alert('An error occurred while submitting changes.');
        } finally {
            setIsLoading(false);
        }
    };

    const ColumnFilter = ({ column }) => {
        const { filterValue, setFilter } = column;
        return (
            <input
                value={filterValue || ''}
                onChange={e => setFilter(e.target.value)}
                placeholder={`Filter ${column.Header}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
        );
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data: tableData,
            initialState: { pageIndex: 0, pageSize: 10 },
        },
        useFilters,
        usePagination
    );

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">DataEditor</h1>
            <div>
                <label htmlFor="table-select" className="block text-sm font-medium text-gray-700">Select Table</label>
                <select
                    id="table-select"
                    value={selectedTable}
                    onChange={handleTableChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="">Select a table</option>
                    {tables.map((table) => (
                        <option key={table} value={table}>{table}</option>
                    ))}
                </select>
            </div>
            {selectedTable && (
                <div>
                    <button
                        onClick={handleAddRow}
                        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Add Row
                    </button>
                    <div className="overflow-x-auto">
                        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <th
                                            {...column.getHeaderProps()}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {column.render('Header')}
                                            <div>{column.canFilter ? column.render('Filter') : null}</div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            ))}
                            </thead>
                            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                            {page.map((row, index) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => (
                                            <td
                                                {...cell.getCellProps()}
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                            >
                                                <input
                                                    value={cell.value}
                                                    onChange={(e) => handleCellChange(row.index, cell.column.id, e.target.value)}
                                                    className="w-full p-1 border rounded"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => handleDeleteRow(row.index)} className="text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                    <div className="py-3 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                                Previous
                            </button>
                            <button onClick={() => nextPage()} disabled={!canNextPage}>
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div className="flex gap-x-2">
                                <span className="text-sm text-gray-700">
                                    Page <span className="font-medium">{pageIndex + 1}</span> of <span className="font-medium">{pageOptions.length}</span>
                                </span>
                                <select
                                    value={pageSize}
                                    onChange={e => setPageSize(Number(e.target.value))}
                                    className="text-sm border-gray-300 rounded-md"
                                >
                                    {[10, 20, 30, 40, 50].map(pageSize => (
                                        <option key={pageSize} value={pageSize}>
                                            Show {pageSize}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => gotoPage(0)}
                                        disabled={!canPreviousPage}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        {'<<'}
                                    </button>
                                    <button
                                        onClick={() => previousPage()}
                                        disabled={!canPreviousPage}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        {'<'}
                                    </button>
                                    <button
                                        onClick={() => nextPage()}
                                        disabled={!canNextPage}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        {'>'}
                                    </button>
                                    <button
                                        onClick={() => gotoPage(pageCount - 1)}
                                        disabled={!canNextPage}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        {'>>'}
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmitChanges}
                        disabled={isLoading}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Submit Changes'}
                    </button>
                </div>
            )}
            {isLoading && <LoadingSpinner />}
        </div>
    );
};

export default DataEditorComponent;