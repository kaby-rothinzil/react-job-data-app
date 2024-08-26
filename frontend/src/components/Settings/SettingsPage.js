import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    REACT_APP_AWS_ACCESS_KEY_ID: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
    REACT_APP_AWS_SECRET_ACCESS_KEY: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
    REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION || '',
    REACT_APP_DEFAULT_S3_BUCKET: process.env.REACT_APP_DEFAULT_S3_BUCKET || '',
    REACT_APP_DEFAULT_WORKGROUP: process.env.REACT_APP_DEFAULT_WORKGROUP || '',
    REACT_APP_REDSHIFT_DB_NAME: process.env.REACT_APP_REDSHIFT_DB_NAME || '',
  });

  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const settingsLabels = {
    REACT_APP_AWS_ACCESS_KEY_ID: 'AWS Access Key ID',
    REACT_APP_AWS_SECRET_ACCESS_KEY: 'AWS Secret Access Key',
    REACT_APP_AWS_REGION: 'AWS Region',
    REACT_APP_DEFAULT_S3_BUCKET: 'Default S3 Bucket Name',
    REACT_APP_DEFAULT_WORKGROUP: 'Default Workgroup',
    REACT_APP_REDSHIFT_DB_NAME: 'Redshift Database Name',
  };

  useEffect(() => {
    // Load settings from localStorage on component mount
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...JSON.parse(savedSettings)
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Save settings to localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('http://localhost:5000/api/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult({ success: true, message: data.message, schemas: data.schemas });
      } else {
        setTestResult({ success: false, message: data.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection. Please check if the backend server is running.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(settingsLabels).map(([key, label]) => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label}</label>
                <input
                    type="text"
                    name={key}
                    id={key}
                    value={settings[key]}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
          ))}
          <button
              type="submit"
              disabled={isSaving}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isSaving ? <LoadingSpinner /> : 'Save Settings'}
          </button>
        </form>
        <button
            onClick={testConnection}
            disabled={isTesting}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {isTesting ? <LoadingSpinner /> : 'Test Connection'}
        </button>
        {testResult && (
            <div className={`mt-4 p-4 rounded-md ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <p>{testResult.message}</p>
              {testResult.schemas && (
                  <div>
                    <p>Available schemas:</p>
                    <ul>
                      {testResult.schemas.map((schema, index) => (
                          <li key={index}>{schema}</li>
                      ))}
                    </ul>
                  </div>
              )}
            </div>
        )}
      </div>
  );
};

export default SettingsPage;