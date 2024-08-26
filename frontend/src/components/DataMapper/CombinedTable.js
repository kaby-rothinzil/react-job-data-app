import React from 'react';

const CombinedTable = ({ selectedItems1, selectedItems2, tableName1, tableName2 }) => {
  const items1 = Array.from(selectedItems1.entries());
  const items2 = Array.from(selectedItems2.entries());

  const combinedRows = [];

  items1.forEach(([rowKey1, rowValues1]) => {
    const concatenatedValues1 = Object.values(rowValues1).join(' _ ');
    
    items2.forEach(([rowKey2, rowValues2]) => {
      const concatenatedValues2 = Object.values(rowValues2).join(' _ ');

      combinedRows.push({ item1: concatenatedValues1, item2: concatenatedValues2 });
    });
  });

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Combined Data Table</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tableName1 || 'Table 1'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tableName2 || 'Table 2'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedRows.map((row, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.item1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.item2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CombinedTable;