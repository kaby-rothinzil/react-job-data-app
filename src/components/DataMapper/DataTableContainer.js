import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import SelectedItems from './SelectedItems';
import TableDropdown from './TableDropdown';

const DataTableContainer = ({ tableId, onSelectionChange }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedCells, setSelectedCells] = useState(new Map());
  const [data, setData] = useState([]);

  useEffect(() => {
    if (selectedTable) {
      fetchData();
    } else {
      setData([]);
    }
  }, [selectedTable]);

  useEffect(() => {
    onSelectionChange(selectedCells);
  }, [selectedCells, onSelectionChange]);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/data?table=${selectedTable}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    }
  };

  const handleSelect = (rowIndex, columnId, value) => {
    setSelectedCells((prevSelectedCells) => {
      const newSelectedCells = new Map(prevSelectedCells);
      const cellKey = `row-${rowIndex}`;
      const currentValue = newSelectedCells.get(cellKey) || {};

      if (currentValue[columnId]) {
        delete currentValue[columnId];
        if (Object.keys(currentValue).length === 0) {
          newSelectedCells.delete(cellKey);
        } else {
          newSelectedCells.set(cellKey, currentValue);
        }
      } else {
        currentValue[columnId] = value;
        newSelectedCells.set(cellKey, currentValue);
      }

      return newSelectedCells;
    });
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
    setSelectedCells(new Map());
    setData([]);
  };

  const handleDelete = (rowKey) => {
    setSelectedCells((prevSelectedCells) => {
      const newSelectedCells = new Map(prevSelectedCells);
      newSelectedCells.delete(rowKey);
      return newSelectedCells;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Data Table {tableId}</h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-64">
          <TableDropdown
            selectedTable={selectedTable}
            handleTableChange={handleTableChange}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Selected Items {tableId}</h3>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="w-full lg:w-3/4">
          {selectedTable && (
            <DataTable
              data={data}
              handleSelect={handleSelect}
              selectedCells={selectedCells}
            />
          )}
        </div>
        <div className="w-full lg:w-1/4">
          <SelectedItems selectedCells={selectedCells} handleDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
};

export default DataTableContainer;