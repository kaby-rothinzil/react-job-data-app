import React, { useState, useEffect } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const DataUploaderComponent = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const uploadData = async () => {
        if (!file) {
            setUploadStatus('Please select a file first.');
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading...');

        try {
            const s3Client = new S3Client({
                region: settings.REACT_APP_AWS_REGION,
                credentials: {
                    accessKeyId: settings.REACT_APP_AWS_ACCESS_KEY_ID,
                    secretAccessKey: settings.REACT_APP_AWS_SECRET_ACCESS_KEY,
                },
            });

            const params = {
                Bucket: settings.REACT_APP_DEFAULT_S3_BUCKET,
                Key: `uploads/${file.name}`,
                Body: file,
            };

            await s3Client.send(new PutObjectCommand(params));
            setUploadStatus('File uploaded successfully to S3!');
        } catch (error) {
            console.error('Error:', error);
            setUploadStatus(`An error occurred during upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">DataUploader</h1>
            <div>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-violet-50 file:text-violet-700
                        hover:file:bg-violet-100"
                />
            </div>
            <button
                onClick={uploadData}
                disabled={uploading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
                {uploading ? 'Uploading...' : 'Upload to S3'}
            </button>
            {uploadStatus && <p className="text-sm text-gray-600">{uploadStatus}</p>}
        </div>
    );
};

export default DataUploaderComponent;