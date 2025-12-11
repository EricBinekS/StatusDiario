import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import OverviewPage from './pages/Overview/OverviewPage';
import './index.css';

function App() {
  // =========================================================================
  // 0. LÓGICA DE MANUTENÇÃO (MODO DE SEGURANÇA)
  // =========================================================================
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // ---> MUDE AQUI PARA LIGAR/DESLIGAR <---
  const MAINTENANCE_MODE = false; 
  const SECRET_PASS = 'pcm123'; // Para acessar use: /?admin=pcm123

  useEffect(() => {
    // 1. Verifica se já tem a permissão salva
    const hasAccess = localStorage.getItem('maintenance_bypass');
    
    // 2. Verifica se a URL tem a senha
    const params = new URLSearchParams(window.location.search);
    const secretKey = params.get('admin');

    if (hasAccess === 'true' || secretKey === SECRET_PASS) {
      setIsAuthorized(true);
      
      // Se entrou pela URL, salva o cookie eterno no navegador
      if (secretKey === SECRET_PASS) {
        localStorage.setItem('maintenance_bypass', 'true');
        // Limpa a URL para ficar limpa visualmente
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // A. TELA DE MANUTENÇÃO (Bloqueia tudo se ativo e não autorizado)
  if (MAINTENANCE_MODE && !isAuthorized) {
    return (
      <div style={{
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f4f4f9',
        color: '#333',
        fontFamily: 'sans-serif'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🚧</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Sistema em Atualização</h2>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Estamos implementando melhorias no Painel de Intervalos.</p>
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#999' }}>Equipe PCM</p>
      </div>
    );
  }

  // B. APLICATIVO NORMAL (Roteamento)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Rota Padrão: Painel */}
          <Route index element={<DashboardPage />} />
          
          {/* Nova Rota: Overview */}
          <Route path="overview" element={<OverviewPage />} />
          
          {/* Redirecionamento 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;