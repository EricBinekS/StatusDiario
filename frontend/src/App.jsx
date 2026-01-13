import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from "@azure/msal-react"; 
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/Dashboard/index';
import OverviewPage from './pages/Overview/index';
import LoginPage from './pages/Login/index';
import { InteractionStatus } from "@azure/msal-browser"; 

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  if (inProgress !== InteractionStatus.None) {
      return <div className="min-h-screen flex items-center justify-center">Carregando autenticação...</div>;
  }
  
  const [searchParams] = useSearchParams();
  const botKey = searchParams.get('bot_key');
  const isBotAuthorized = botKey && (botKey === import.meta.env.VITE_BOT_BYPASS_KEY);

  if (!isAuthenticated && !isBotAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  if (inProgress !== InteractionStatus.None) {
      return <div className="min-h-screen flex items-center justify-center">Verificando acesso...</div>;
  }

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