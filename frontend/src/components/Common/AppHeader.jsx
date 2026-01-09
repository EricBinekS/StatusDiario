import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CheckCircle2, Sun, Moon } from 'lucide-react';
import { fetchAPI } from '../../services/api';
import rumoLogo from '/rumo-logo.svg'; 
import pcmLogo from '/logo_pcm.svg';

// Importando os novos componentes
import NavPill from './NavPill';
import UpdateTimer from './UpdateTimer';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; 

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOverview = location.pathname === '/overview';
  
  const [dbLastUpdate, setDbLastUpdate] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // --- LÓGICA DO TEMA ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- LÓGICA DE DADOS/TIMER ---
  const checkDbStatus = useCallback(async () => {
    try {
      const data = await fetchAPI('/last-update');
      if (data && data.last_updated_at) {
        const dbDate = new Date(data.last_updated_at);
        setDbLastUpdate(dbDate);
        const now = new Date();
        const diff = now.getTime() - dbDate.getTime();
        const remaining = REFRESH_INTERVAL_MS - diff;
        setSecondsLeft(Math.max(0, Math.floor(remaining / 1000)));
      }
    } catch (error) {
      console.error("Erro ao checar status:", error);
    }
  }, []);

  useEffect(() => {
    checkDbStatus(); 
    const interval = setInterval(checkDbStatus, 120000); 
    return () => clearInterval(interval);
  }, [checkDbStatus]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  const formatLastUpdateVal = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200/60 dark:border-slate-700 sticky top-0 z-50 h-16 px-6 flex items-center justify-between shadow-sm transition-all">
        
        {/* 1. Logo */}
        <div className="flex items-center gap-6">
          <img src={rumoLogo} alt="Rumo" className="h-7 w-auto" />
          <div className="h-6 w-px bg-gray-300/50 dark:bg-gray-600 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none">STATUS DIÁRIO</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">PAINEL PCM</p>
          </div>
        </div>

        {/* 2. Navegação (Componente Separado) */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100/70 dark:bg-slate-700/50 p-1 rounded-full flex items-center gap-1 border border-gray-200/50 dark:border-slate-600 backdrop-blur-sm">
          <NavPill active={!isOverview} onClick={() => navigate('/')} icon={<LayoutDashboard size={14} />} label="Operacional" />
          <NavPill active={isOverview} onClick={() => navigate('/overview')} icon={<BarChart3 size={14} />} label="Gerencial" />
        </nav>

        {/* 3. Área da Direita */}
        <div className="flex items-center gap-5">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors" title="Alternar Tema">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="hidden md:flex items-center gap-4 text-right">
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Última Atualização</p>
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      <span>{formatLastUpdateVal(dbLastUpdate)}</span>
                      <CheckCircle2 size={12} className="text-green-500" />
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200/60 dark:bg-slate-700"></div>
                
                {/* Timer (Componente Separado) */}
                <UpdateTimer seconds={secondsLeft} />
            </div>
            <div className="h-8 w-px bg-gray-200/60 dark:bg-slate-700 hidden md:block"></div>
            <img src={pcmLogo} alt="PCM" className="h-9 w-auto opacity-90" />
        </div>
      </header>
  );
};

export default AppHeader;