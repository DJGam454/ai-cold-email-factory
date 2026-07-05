import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CompanySetup from './components/CompanySetup';
import EmailGenerator from './components/EmailGenerator';
import BatchHistory from './components/BatchHistory';
import EmailResults from './components/EmailResults';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<CompanySetup />} />
            <Route path="/generate" element={<EmailGenerator />} />
            <Route path="/batches" element={<BatchHistory />} />
            <Route path="/emails/:batchId" element={<EmailResults />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
