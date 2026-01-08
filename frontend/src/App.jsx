// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/Dashboard/index';
import OverviewPage from './pages/Overview/index';
import LoginPage from './pages/Login/index';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
        } />

        <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="overview" element={<OverviewPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;