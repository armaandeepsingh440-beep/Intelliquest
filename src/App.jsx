import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Background3D from './components/Background3D';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminDashboard from './pages/AdminDashboard';
import { FirebaseProvider } from './context/FirebaseContext';

function App() {
  return (
    <FirebaseProvider>
      <Router>
        <Background3D />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register/:eventId" element={<RegistrationPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        
      </Router>
    </FirebaseProvider>
  );
}

export default App;
