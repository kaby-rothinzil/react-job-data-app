// Path: src/components/DataCanvas/DataVisualizer.js
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         Cell } from 'recharts';

const DataVisualizer = ({ data, columns, visualizationType, onVisualizationTypeChange }) => {
  const [xAxisColumn, setXAxisColumn] = useState('');
  const [yAxisColumn, setYAxisColumn] = useState('');
  const [colorBy, setColorBy] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [aggregateFunction, setAggregateFunction] = useState('sum');

  // Get only numeric columns for y-axis and color
  const numericColumns = useMemo(() =>
    columns.filter(col => col.include && col.dataType === 'numeric'),
    [columns]
  );

  // Get categorical columns for x-axis and grouping
  const categoricalColumns = useMemo(() =>
    columns.filter(col => col.include && col.dataType !== 'numeric'),
    [columns]
  );

  // Get all included columns
  const includedColumns = useMemo(() =>
    columns.filter(col => col.include),
    [columns]
  );

  // Initialize default selections if needed
  useMemo(() => {
    if (!xAxisColumn && categoricalColumns.length > 0) {
      setXAxisColumn(categoricalColumns[0].name);
    }

    if (!yAxisColumn && numericColumns.length > 0) {
      setYAxisColumn(numericColumns[0].name);
    }
  }, [categoricalColumns, numericColumns, xAxisColumn, yAxisColumn]);

  const prepareChartData = () => {
    if (!xAxisColumn || !yAxisColumn) {
      return [];
    }

    const xColIndex = columns.findIndex(col => col.name === xAxisColumn);
    const yColIndex = columns.findIndex(col => col.name === yAxisColumn);

    if (xColIndex === -1 || yColIndex === -1) {
      return [];
    }

    // Prepare data based on grouping
    if (groupBy) {
      const groupColIndex = columns.findIndex(col => col.name === groupBy);

      if (groupColIndex === -1) {
        return [];
      }

      // Group data
      const groupedData = {};

      data.forEach(row => {
        const xValue = row[xColIndex] || 'Undefined';
        const yValue = parseFloat(row[yColIndex]) || 0;
        const groupValue = row[groupColIndex] || 'Unknown';

        if (!groupedData[xValue]) {
          groupedData[xValue] = {};
        }

        if (!groupedData[xValue][groupValue]) {
          groupedData[xValue][groupValue] = [];
        }

        groupedData[xValue][groupValue].push(yValue);
      });

      // Aggregate data
      return Object.entries(groupedData).map(([xValue, groups]) => {
        const result = { name: xValue };

        Object.entries(groups).forEach(([groupValue, values]) => {
          result[groupValue] = aggregateValues(values, aggregateFunction);
        });

        return result;
      });
    } else {
      // No grouping - simple aggregation by x-axis
      const aggregatedData = {};

      data.forEach(row => {
        const xValue = row[xColIndex] || 'Undefined';
        const yValue = parseFloat(row[yColIndex]) || 0;

        if (!aggregatedData[xValue]) {
          aggregatedData[xValue] = [];
        }

        aggregatedData[xValue].push(yValue);
      });

      return Object.entries(aggregatedData).map(([xValue, values]) => ({
        name: xValue,
        value: aggregateValues(values, aggregateFunction)
      }));
    }
  };

  const aggregateValues = (values, func) => {
    if (!values.length) return 0;

    switch (func) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values.reduce((sum, val) => sum + val, 0);
    }
  };

  const getChartColors = () => {
    return [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
      '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
    ];
  };

  const renderVisualizationSelector = () => (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => onVisualizationTypeChange('table')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationType === 'table'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        Table
      </button>
      <button
        onClick={() => onVisualizationTypeChange('bar')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationType === 'bar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        Bar Chart
      </button>
      <button
        onClick={() => onVisualizationTypeChange('line')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationType === 'line'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        Line Chart
      </button>
      <button
        onClick={() => onVisualizationTypeChange('pie')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationType === 'pie'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        Pie Chart
      </button>
      <button
        onClick={() => onVisualizationTypeChange('scatter')}
        className={`px-3 py-1 rounded text-sm ${
          visualizationType === 'scatter'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        Scatter Plot
      </button>
    </div>
  );

  const renderChartControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          X-Axis
        </label>
        <select
          value={xAxisColumn}
          onChange={(e) => setXAxisColumn(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select X-Axis</option>
          {includedColumns.map((col) => (
            <option key={col.name} value={col.name}>
              {col.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Y-Axis
        </label>
        <select
          value={yAxisColumn}
          onChange={(e) => setYAxisColumn(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select Y-Axis</option>
          {numericColumns.map((col) => (
            <option key={col.name} value={col.name}>
              {col.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group By
        </label>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">No Grouping</option>
          {categoricalColumns.map((col) => (
            <option key={col.name} value={col.name}>
              {col.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aggregate Function
        </label>
        <select
          value={aggregateFunction}
          onChange={(e) => setAggregateFunction(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="min">Minimum</option>
          <option value="max">Maximum</option>
          <option value="count">Count</option>
        </select>
      </div>
    </div>
  );

  const renderChart = () => {
    const chartData = prepareChartData();

    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {!xAxisColumn || !yAxisColumn
              ? 'Please select X and Y axes'
              : 'No data available for the selected options'}
          </p>
        </div>
      );
    }

    const chartColors = getChartColors();
    const xColDisplay = columns.find(col => col.name === xAxisColumn)?.displayName || xAxisColumn;
    const yColDisplay = columns.find(col => col.name === yAxisColumn)?.displayName || yAxisColumn;

    switch (visualizationType) {
      case 'bar':
        return renderBarChart(chartData, chartColors, xColDisplay, yColDisplay);
      case 'line':
        return renderLineChart(chartData, chartColors, xColDisplay, yColDisplay);
      case 'pie':
        return renderPieChart(chartData, chartColors);
      case 'scatter':
        return renderScatterChart(chartData, chartColors, xColDisplay, yColDisplay);
      default:
        return renderDataTable(chartData);
    }
  };

  const renderBarChart = (chartData, chartColors, xLabel, yLabel) => {
    const dataKeys = Object.keys(chartData[0]).filter(key => key !== 'name');

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={{ value: xLabel, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            {dataKeys.length > 1 ? (
              // Multiple series (grouped)
              dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={chartColors[index % chartColors.length]}
                  name={key}
                />
              ))
            ) : (
              // Single series
              <Bar dataKey="value" fill={chartColors[0]} name={yLabel} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = (chartData, chartColors, xLabel, yLabel) => {
    const dataKeys = Object.keys(chartData[0]).filter(key => key !== 'name');

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={{ value: xLabel, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            {dataKeys.length > 1 ? (
              // Multiple series (grouped)
              dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={chartColors[index % chartColors.length]}
                  name={key}
                  activeDot={{ r: 8 }}
                />
              ))
            ) : (
              // Single series
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColors[0]}
                name={yLabel}
                activeDot={{ r: 8 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = (chartData, chartColors) => {
    // For pie charts, we need to use the 'value' property for the pie segments
    const pieData = chartData.map(item => ({
      name: item.name,
      value: typeof item.value !== 'undefined' ? item.value :
             // If using grouped data, sum all group values
             Object.keys(item)
               .filter(key => key !== 'name')
               .reduce((sum, key) => sum + item[key], 0)
    }));

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={130}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderScatterChart = (chartData, chartColors, xLabel, yLabel) => {
    // For scatter plots, we need the raw data points
    const xColIndex = columns.findIndex(col => col.name === xAxisColumn);
    const yColIndex = columns.findIndex(col => col.name === yAxisColumn);

    const scatterData = data
      .filter(row => !isNaN(parseFloat(row[xColIndex])) && !isNaN(parseFloat(row[yColIndex])))
      .map(row => ({
        x: parseFloat(row[xColIndex]),
        y: parseFloat(row[yColIndex])
      }));

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              label={{ value: xLabel, position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name={`${xLabel} vs ${yLabel}`} data={scatterData} fill={chartColors[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDataTable = (chartData) => {
    // For table visualization, show the processed aggregated data
    return (
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {columns.find(col => col.name === xAxisColumn)?.displayName || 'Category'}
              </th>
              {groupBy ? (
                // If grouped, show group columns
                [...new Set(chartData.flatMap(item =>
                  Object.keys(item).filter(key => key !== 'name')
                ))].map(group => (
                  <th
                    key={group}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {group}
                  </th>
                ))
              ) : (
                // If not grouped, show single value column
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {columns.find(col => col.name === yAxisColumn)?.displayName || 'Value'}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {chartData.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {row.name}
                </td>

                                {groupBy ? (
                                  // If grouped, show all group values
                                  [...new Set(chartData.flatMap(item =>
                                    Object.keys(item).filter(key => key !== 'name')
                                  ))].map(group => (
                                    <td
                                      key={group}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                      {typeof row[group] !== 'undefined'
                                        ? row[group].toLocaleString()
                                        : '-'}
                                    </td>
                                  ))
                                ) : (
                                  // If not grouped, show the single value
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {row.value.toLocaleString()}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  };

                  return (
                    <div>
                      {renderVisualizationSelector()}
                      {renderChartControls()}
                      {renderChart()}
                    </div>
                  );
                }

                export default DataVisualizer;