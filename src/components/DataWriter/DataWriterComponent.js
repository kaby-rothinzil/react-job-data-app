import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';

const DataWriterComponent = () => {
    const [s3Path, setS3Path] = useState('');
    const [schema, setSchema] = useState('');
    const [tableName, setTableName] = useState('');
    const [writing, setWriting] = useState(false);
    const [writeStatus, setWriteStatus] = useState('');

    const validateS3Path = (path) => {
        const s3Regex = /^s3:\/\/[\w.-]+\/.*$/;
        return s3Regex.test(path);
    };

    const handleWrite = async () => {
        if (!s3Path || !schema || !tableName) {
            setWriteStatus('Please fill in all fields.');
            return;
        }

        if (!validateS3Path(s3Path)) {
            setWriteStatus('Invalid S3 path. It should be in the format s3://bucket-name/path/to/file');
            return;
        }

        setWriting(true);
        setWriteStatus('Writing to Redshift...');

        try {
            const response = await fetch('http://localhost:5000/api/write-to-redshift-from-s3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    s3_path: s3Path,
                    schema: schema,
                    tableName: tableName,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setWriteStatus(result.message || 'Write operation completed successfully');
        } catch (error) {
            console.error('Error:', error);
            setWriteStatus(`An error occurred: ${error.message}. Please check if the backend server is running.`);
        } finally {
            setWriting(false);
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">DataWriter</h1>
            <p className="text-sm text-gray-600">Use this component to write data from an S3 file to a Redshift table.</p>
            <div>
                <label htmlFor="s3Path" className="block text-sm font-medium text-gray-700">S3 Path</label>
                <input
                    type="text"
                    id="s3Path"
                    value={s3Path}
                    onChange={(e) => setS3Path(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="s3://your-bucket/your-file.csv"
                />
            </div>
            <div>
                <label htmlFor="schema" className="block text-sm font-medium text-gray-700">Schema</label>
                <input
                    type="text"
                    id="schema"
                    value={schema}
                    onChange={(e) => setSchema(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="public"
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
                    placeholder="your_table_name"
                />
            </div>
            <button
                onClick={handleWrite}
                disabled={writing}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            >
                {writing ? <LoadingSpinner /> : 'Write to Redshift'}
            </button>
            {writeStatus && <p className="text-sm text-gray-600">{writeStatus}</p>}
        </div>
    );
};

export default DataWriterComponent;