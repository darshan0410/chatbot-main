// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AITutor from './components/AITutor';
import HomePage from './components/MockInterview/HomePage';
import InterviewPage from './components/MockInterview/InterviewPage';
import HistoryPage from './components/MockInterview/HistoryPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
      <AITutor />
    </div>
  );
}

export default App;