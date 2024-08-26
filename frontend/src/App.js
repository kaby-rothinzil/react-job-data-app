import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

const DataMapperPage = lazy(() => import('./components/DataMapper/DataMapperPage'));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));
const DataUploaderComponent = lazy(() => import('./components/DataUploader/DataUploaderComponent'));
const DataWriterComponent = lazy(() => import('./components/DataWriter/DataWriterComponent'));
const DataEditorComponent = lazy(() => import('./components/DataEditor/DataEditorComponent'));

function App() {
    return (
        <Router>
            <ErrorBoundary>
                <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/" element={<DataMapperPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/uploader" element={<DataUploaderComponent />} />
                            <Route path="/writer" element={<DataWriterComponent />} />
                            <Route path="/editor" element={<DataEditorComponent />} />
                        </Routes>
                    </Suspense>
                </Layout>
            </ErrorBoundary>
        </Router>
    );
}

export default App;