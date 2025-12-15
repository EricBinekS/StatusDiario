import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import rumoLogo from '/rumo-logo.svg'; 
import pcmLogo from '/logo_pcm.svg';
import { LayoutDashboard, BarChart3, RefreshCw } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useOverview } from '../hooks/useOverview';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOverview = location.pathname === '/overview';

  // Hooks para o botão de refresh global
  const { refetch: refetchDash, loading: loadDash } = useDashboard();
  const { refetch: refetchOver, loading: loadOver } = useOverview();

  const handleRefresh = () => {
    if (isOverview) refetchOver();
    else refetchDash();
  };

  const isLoading = isOverview ? loadOver : loadDash;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Cabeçalho Azul Escuro (Identidade Original) */}
      <header className="bg-[#1e3a8a] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4">
          
          {/* Linha Superior: Logos e Título */}
          <div className="h-16 flex items-center justify-between border-b border-blue-800/50">
            <div className="flex items-center gap-4">
              <img src={rumoLogo} alt="Rumo" className="h-8 w-auto brightness-0 invert" />
              <div className="h-6 w-px bg-blue-700"></div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Status Diário</h1>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider">Controle Operacional & Gerencial</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Botão de Atualizar Global */}
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                {isLoading ? "Atualizando..." : "Atualizar Dados"}
              </button>
              <img src={pcmLogo} alt="PCM" className="h-10 w-auto brightness-0 invert opacity-80" />
            </div>
          </div>

          {/* Linha Inferior: Abas de Navegação (Para você não se perder mais) */}
          <div className="flex items-end gap-1 pt-2">
            <NavTab 
              active={!isOverview} 
              onClick={() => navigate('/')} 
              icon={<LayoutDashboard size={16} />}
              label="Painel Operacional"
            />
            <NavTab 
              active={isOverview} 
              onClick={() => navigate('/overview')} 
              icon={<BarChart3 size={16} />}
              label="Visão Gerencial"
            />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-grow p-4 md:p-6 overflow-x-hidden">
        <div className="max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Componente de Aba (Estilo "Pasta")
const NavTab = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-t-lg transition-all duration-200
      ${active 
        ? 'bg-slate-100 text-[#1e3a8a] shadow-[0_-2px_10px_rgba(0,0,0,0.1)] translate-y-[1px]' 
        : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800 hover:text-white mb-1'}
    `}
  >
    {icon}
    {label}
  </button>
);

export default MainLayout;