import React from 'react';

const SelectedItems = ({ selectedCells, handleDelete }) => {
  return (
    <ul className="divide-y divide-gray-200">
      {Array.from(selectedCells.entries()).map(([rowKey, rowValues]) => {
        const concatenatedValues = Object.values(rowValues).join(' _ ');
        return (
          <li key={rowKey} className="py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {concatenatedValues}
                </p>
              </div>
              <div>
                <button
                  onClick={() => handleDelete(rowKey)}
                  className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default SelectedItems;