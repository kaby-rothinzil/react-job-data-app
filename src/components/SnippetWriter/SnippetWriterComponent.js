import React, { useState } from 'react';
import Papa from 'papaparse';
import LoadingSpinner from '../LoadingSpinner';

const SnippetWriterComponent = () => {
  const [files, setFiles] = useState({
    input1: null,
    input2: null,
    output: null
  });

  const [csvData, setCsvData] = useState({
    input1: null,
    input2: null,
    output: null
  });

  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [snippetType, setSnippetType] = useState('sql-redshift');

  const handleFileChange = (fileType) => (event) => {
    const file = event.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
      parseCSV(file, fileType);
    }
  };

  const parseCSV = (file, fileType) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(prev => ({ ...prev, [fileType]: results.data }));
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setError(`Error parsing ${fileType} CSV: ${error.message}`);
      }
    });
  };

  const handleSnippetTypeChange = (e) => {
    setSnippetType(e.target.value);
  };

  const generateSnippet = async () => {
    if (!files.input1 || !files.input2 || !files.output) {
      setError('Please upload all three CSV files first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare the data to send to OpenAI API
      const input1Sample = csvData.input1.slice(0, 5);
      const input2Sample = csvData.input2.slice(0, 5);
      const outputSample = csvData.output.slice(0, 5);

      // Extract column names
      const input1Columns = Object.keys(csvData.input1[0] || {});
      const input2Columns = Object.keys(csvData.input2[0] || {});
      const outputColumns = Object.keys(csvData.output[0] || {});

      // Different prompts based on snippet type
      let systemPrompt = "";
      let userPrompt = "";
      let codeLanguage = "";
      let codePattern = null;

      switch(snippetType) {
        case 'sql-redshift':
          systemPrompt = "You are an expert in Amazon Redshift SQL. Given two input tables and a desired output table, generate the SQL query that transforms the input data to match the output data.";
          userPrompt = `Generate Redshift SQL that transforms the input tables into the output table format.`;
          codeLanguage = "sql";
          codePattern = /```sql\n([\s\S]*?)```|```\n([\s\S]*?)```|`([\s\S]*?)`|(SELECT[\s\S]*)/i;
          break;
        case 'sql-databricks':
          systemPrompt = "You are an expert in Databricks SQL. Given two input tables and a desired output table, generate the SQL query that transforms the input data to match the output data.";
          userPrompt = `Generate Databricks SQL that transforms the input tables into the output table format. Use Databricks SQL syntax with its specific functions and optimizations.`;
          codeLanguage = "sql";
          codePattern = /```sql\n([\s\S]*?)```|```\n([\s\S]*?)```|`([\s\S]*?)`|(SELECT[\s\S]*)/i;
          break;
        case 'pyspark':
          systemPrompt = "You are an expert in Apache PySpark. Given two input tables and a desired output table, generate the PySpark code that transforms the input data to match the output data.";
          userPrompt = `Generate PySpark code that transforms the input DataFrames into the output DataFrame format. Use PySpark's DataFrame API.`;
          codeLanguage = "python";
          codePattern = /```python\n([\s\S]*?)```|```\n([\s\S]*?)```|`([\s\S]*?)`/i;
          break;
        default:
          systemPrompt = "You are an expert SQL developer. Given two input tables and a desired output table, generate the SQL query that transforms the input data to match the output data.";
          userPrompt = `Generate SQL that transforms the input tables into the output table format.`;
          codeLanguage = "sql";
          codePattern = /```sql\n([\s\S]*?)```|```\n([\s\S]*?)```|`([\s\S]*?)`|(SELECT[\s\S]*)/i;
      }

      const requestData = {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `${userPrompt}

            Input Table 1 (${files.input1.name}):
            Columns: ${input1Columns.join(', ')}
            Sample data:
            ${JSON.stringify(input1Sample, null, 2)}

            Input Table 2 (${files.input2.name}):
            Columns: ${input2Columns.join(', ')}
            Sample data:
            ${JSON.stringify(input2Sample, null, 2)}

            Desired Output Table (${files.output.name}):
            Columns: ${outputColumns.join(', ')}
            Sample data:
            ${JSON.stringify(outputSample, null, 2)}

            Please generate ${snippetType === 'pyspark' ? 'PySpark code' : 'a SQL query'} that would transform data from the input tables to produce the output table. Assume that the tables are stored with the following names:
            - table1 or df1 for ${files.input1.name.replace(/\.[^/.]+$/, "")}
            - table2 or df2 for ${files.input2.name.replace(/\.[^/.]+$/, "")}

            Focus only on the transformation logic needed to achieve the output format. The code should be complete and ready to run.`
          }
        ],
        temperature: 0.1
      };

      const API_KEY = "";
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestData)
      });

      console.log("API Key available:", process.env.REACT_APP_OPENAI_API_KEY ? "Yes" : "No");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const snippetContent = data.choices[0].message.content;

      // Extract code from the response (it might be wrapped in markdown code blocks)
      const match = codePattern.exec(snippetContent);

      if (match) {
        // Use the first matching group that contains content
        const extractedSnippet = match[1] || match[2] || match[3] || match[4];
        setGeneratedSnippet(extractedSnippet.trim());
      } else {
        setGeneratedSnippet(snippetContent.trim());
      }

    } catch (error) {
      console.error('Error generating code snippet:', error);
      setError(`Failed to generate code: ${error.message}`);
      setGeneratedSnippet('');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCSVPreview = (data, title) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const previewData = data.slice(0, 5); // Show first 5 rows

    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium">{title} Preview:</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getLanguageLabel = () => {
    switch(snippetType) {
      case 'sql-redshift': return 'Redshift SQL';
      case 'sql-databricks': return 'Databricks SQL';
      case 'pyspark': return 'PySpark';
      default: return 'Code';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">SnippetWriter</h1>
      <p className="text-gray-600">
        Upload two input CSV files and one desired output CSV file. The application will generate
        code snippets that transform the input data to match the output.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Input Dataset 1</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange('input1')}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100"
          />
          {files.input1 && <p className="mt-2 text-sm text-gray-500">{files.input1.name}</p>}
        </div>

        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Input Dataset 2</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange('input2')}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100"
          />
          {files.input2 && <p className="mt-2 text-sm text-gray-500">{files.input2.name}</p>}
        </div>

        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Desired Output</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange('output')}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100"
          />
          {files.output && <p className="mt-2 text-sm text-gray-500">{files.output.name}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-64">
          <label htmlFor="snippet-type" className="block text-sm font-medium text-gray-700 mb-1">
            Code Type
          </label>
          <select
            id="snippet-type"
            value={snippetType}
            onChange={handleSnippetTypeChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="sql-redshift">SQL (Redshift)</option>
            <option value="sql-databricks">SQL (Databricks)</option>
            <option value="pyspark">PySpark</option>
          </select>
        </div>

        <button
          onClick={generateSnippet}
          disabled={isLoading || !files.input1 || !files.input2 || !files.output}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? <LoadingSpinner /> : `Generate ${getLanguageLabel()} Snippet`}
        </button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {csvData.input1 && renderCSVPreview(csvData.input1, 'Input Dataset 1')}
      {csvData.input2 && renderCSVPreview(csvData.input2, 'Input Dataset 2')}
      {csvData.output && renderCSVPreview(csvData.output, 'Desired Output')}

      {generatedSnippet && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">Generated {getLanguageLabel()} Snippet</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{generatedSnippet}</pre>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedSnippet);
              alert('Code snippet copied to clipboard!');
            }}
            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
};

export default SnippetWriterComponent;