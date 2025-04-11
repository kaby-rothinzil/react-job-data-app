// Path: src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Fix imports by ensuring they point to the correct file paths and components
const DataMapperPage = lazy(() => import('./components/DataMapper/DataMapperPage'));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));
const DataUploaderComponent = lazy(() => import('./components/DataUploader/DataUploaderComponent'));
const DataWriterComponent = lazy(() => import('./components/DataWriter/DataWriterComponent'));
const DataEditorComponent = lazy(() => import('./components/DataEditor/DataEditorComponent'));
const SnippetWriterComponent = lazy(() => import('./components/SnippetWriter/SnippetWriterComponent'));
// Fix DataCanvas import - import directly from the index file
const DataCanvasComponent = lazy(() => import('./components/DataCanvas'));

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
                            <Route path="/snippetwriter" element={<SnippetWriterComponent />} />
                            <Route path="/datacanvas" element={<DataCanvasComponent />} />
                        </Routes>
                    </Suspense>
                </Layout>
            </ErrorBoundary>
        </Router>
    );
}

export default App;