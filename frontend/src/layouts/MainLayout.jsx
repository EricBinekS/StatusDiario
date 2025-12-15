import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import rumoLogo from '/rumo-logo.svg'; 
import pcmLogo from '/logo_pcm.svg';
import { LayoutDashboard, BarChart3, Clock, CheckCircle2 } from 'lucide-react';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOverview = location.pathname === '/overview';
  const [lastUpdate] = useState(new Date());

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-[#1e293b]">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 h-16 px-6 flex items-center justify-between shadow-sm transition-all">
        <div className="flex items-center gap-6">
          <img src={rumoLogo} alt="Rumo" className="h-7 w-auto" />
          <div className="h-6 w-px bg-gray-300/50 hidden sm:block"></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">STATUS DIÁRIO</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">PAINEL PCM</p>
          </div>
        </div>

        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100/70 p-1 rounded-full flex items-center gap-1 border border-gray-200/50 backdrop-blur-sm">
          <NavPill active={!isOverview} onClick={() => navigate('/')} icon={<LayoutDashboard size={14} />} label="Operacional" />
          <NavPill active={isOverview} onClick={() => navigate('/overview')} icon={<BarChart3 size={14} />} label="Gerencial" />
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-4 text-right">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Última Atualização</p>
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-700 tabular-nums">
                <span>{lastUpdate.toLocaleTimeString('pt-BR')}</span>
                <CheckCircle2 size={12} className="text-green-500" />
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200/60"></div>
            <UpdateTimer />
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

const UpdateTimer = () => {
  const [secondsLeft, setSecondsLeft] = useState(600);
  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft((p) => (p <= 1 ? 600 : p - 1)), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Próxima Atualização</p>
        <p className="text-xs font-mono font-bold text-slate-700 flex items-center justify-end gap-1.5 tabular-nums">
          {formatTime(secondsLeft)} <Clock size={12} className="text-blue-600 animate-pulse" />
        </p>
      </div>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          <path className="text-blue-600 transition-all duration-1000 ease-linear" strokeDasharray={`${(secondsLeft / 600) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export default MainLayout;