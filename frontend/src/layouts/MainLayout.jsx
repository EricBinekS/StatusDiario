import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import rumoLogo from '/rumo-logo.svg'; 
import pcmLogo from '/logo_pcm.svg';
import { LayoutDashboard, BarChart3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchAPI } from '../services/api'; // Importe a função de API

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 Minutos

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOverview = location.pathname === '/overview';
  
  const [dbLastUpdate, setDbLastUpdate] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Função que busca a data real do banco
  const checkDbStatus = useCallback(async () => {
    try {
      const data = await fetchAPI('/last-update');
      if (data && data.last_updated_at) {
        const dbDate = new Date(data.last_updated_at);
        setDbLastUpdate(dbDate);
        
        // Recalcula o tempo restante baseado na hora exata do banco
        const now = new Date();
        const diff = now.getTime() - dbDate.getTime();
        const remaining = REFRESH_INTERVAL_MS - diff;
        
        // Se ainda estiver no prazo, define os segundos. Se estourou, fica 0.
        setSecondsLeft(Math.max(0, Math.floor(remaining / 1000)));
      }
    } catch (error) {
      console.error("Erro ao checar status:", error);
    }
  }, []);

  // 1. Polling: Verifica o banco a cada 30 segundos para ver se houve nova migração
  useEffect(() => {
    checkDbStatus(); // Checa na hora que abre
    const interval = setInterval(checkDbStatus, 30000); 
    return () => clearInterval(interval);
  }, [checkDbStatus]);

  // 2. Timer Visual: Decrementa 1 segundo localmente para fluidez
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Formatação da data para exibição
  const formatLastUpdateVal = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-[#1e293b]">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 h-16 px-6 flex items-center justify-between shadow-sm transition-all">
        {/* Logo e Título */}
        <div className="flex items-center gap-6">
          <img src={rumoLogo} alt="Rumo" className="h-7 w-auto" />
          <div className="h-6 w-px bg-gray-300/50 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">STATUS DIÁRIO</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">PAINEL PCM</p>
          </div>
        </div>

        {/* Navegação Central */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100/70 p-1 rounded-full flex items-center gap-1 border border-gray-200/50 backdrop-blur-sm">
          <NavPill active={!isOverview} onClick={() => navigate('/')} icon={<LayoutDashboard size={14} />} label="Operacional" />
          <NavPill active={isOverview} onClick={() => navigate('/overview')} icon={<BarChart3 size={14} />} label="Gerencial" />
        </nav>

        {/* Lado Direito: Timer e Status */}
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-4 text-right">
            
            {/* Display da Última Atualização */}
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Última Atualização</p>
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-700 tabular-nums">
                <span>{formatLastUpdateVal(dbLastUpdate)}</span>
                <CheckCircle2 size={12} className="text-green-500" />
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200/60"></div>
            
            {/* Componente do Timer */}
            <UpdateTimer seconds={secondsLeft} />
          
          </div>
          <div className="h-8 w-px bg-gray-200/60 hidden md:block"></div>
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
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ease-out ${active ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}>
    {icon} {label}
  </button>
);

const UpdateTimer = ({ seconds }) => {
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  
  // Calcula progresso circular (100% = 600s, 0% = 0s)
  const percentage = (seconds / 600) * 100;
  const isExpired = seconds === 0;

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
          {isExpired ? "Aguardando Atualização" : "Próxima Atualização"}
        </p>
        <p className={`text-xs font-mono font-bold flex items-center justify-end gap-1.5 tabular-nums ${isExpired ? 'text-red-500' : 'text-slate-700'}`}>
          {formatTime(seconds)} 
          {isExpired ? (
            <AlertCircle size={12} className="text-red-500 animate-pulse" />
          ) : (
            <Clock size={12} className="text-blue-600 animate-pulse" />
          )}
        </p>
      </div>
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* SVG Circular do Timer */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          <path 
            className={`${isExpired ? 'text-red-500' : 'text-blue-600'} transition-all duration-1000 ease-linear`}
            strokeDasharray={`${percentage}, 100`} 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    </div>
  );
};

export default MainLayout;