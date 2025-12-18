import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import rumoLogo from '/rumo-logo.svg'; 
import pcmLogo from '/logo_pcm.svg';
// Adicionei Sun e Moon aos imports
import { LayoutDashboard, BarChart3, Clock, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';
import { fetchAPI } from '../services/api'; 

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; 

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOverview = location.pathname === '/overview';
  
  const [dbLastUpdate, setDbLastUpdate] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // --- LÓGICA DO TEMA ESCURO ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  // -----------------------------

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
    const interval = setInterval(checkDbStatus, 30000); 
    return () => clearInterval(interval);
  }, [checkDbStatus]);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const formatLastUpdateVal = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    // Adicionei dark:bg-slate-900 e dark:text-gray-100 ao container principal
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-900 font-sans text-[#1e293b] dark:text-slate-100 transition-colors duration-300">
      
      {/* Header com Dark Mode */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200/60 dark:border-slate-700 sticky top-0 z-50 h-16 px-6 flex items-center justify-between shadow-sm transition-all">
        
        {/* Logo e Título */}
        <div className="flex items-center gap-6">
          <img src={rumoLogo} alt="Rumo" className="h-7 w-auto" />
          <div className="h-6 w-px bg-gray-300/50 dark:bg-gray-600 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none">STATUS DIÁRIO</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">PAINEL PCM</p>
          </div>
        </div>

        {/* Navegação Central */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100/70 dark:bg-slate-700/50 p-1 rounded-full flex items-center gap-1 border border-gray-200/50 dark:border-slate-600 backdrop-blur-sm">
          <NavPill active={!isOverview} onClick={() => navigate('/')} icon={<LayoutDashboard size={14} />} label="Operacional" />
          <NavPill active={isOverview} onClick={() => navigate('/overview')} icon={<BarChart3 size={14} />} label="Gerencial" />
        </nav>

        {/* Lado Direito */}
        <div className="flex items-center gap-5">
            {/* Botão de Tema */}
            <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
                title="Alternar Tema"
            >
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
                <UpdateTimer seconds={secondsLeft} />
            </div>
            <div className="h-8 w-px bg-gray-200/60 dark:bg-slate-700 hidden md:block"></div>
            <img src={pcmLogo} alt="PCM" className="h-9 w-auto opacity-90" />
        </div>
      </header>

      <main className="p-4 max-w-[1920px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

const NavPill = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out ${active ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-sm ring-1 ring-gray-200 dark:ring-slate-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700'}`}>
    {icon} {label}
  </button>
);

const UpdateTimer = ({ seconds }) => {
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const percentage = (seconds / 600) * 100;
  const isExpired = seconds === 0;

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
          {isExpired ? "Aguardando Atualização" : "Próxima Atualização"}
        </p>
        <p className={`text-xs font-mono font-bold flex items-center justify-end gap-1.5 tabular-nums ${isExpired ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
          {formatTime(seconds)} 
          {isExpired ? (
            <AlertCircle size={12} className="text-red-500 animate-pulse" />
          ) : (
            <Clock size={12} className="text-blue-600 dark:text-blue-400 animate-pulse" />
          )}
        </p>
      </div>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path className="text-gray-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          <path 
            className={`${isExpired ? 'text-red-500' : 'text-blue-600 dark:text-blue-500'} transition-all duration-1000 ease-linear`}
            strokeDasharray={`${percentage}, 100`} 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
          />
        </svg>
      </div>
    </div>
  );
};

export default MainLayout;