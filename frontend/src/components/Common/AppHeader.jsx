import React from 'react';
import rumoLogo from '/rumo-logo.svg'; 
import pcmLogo from '/logo_pcm.svg';

const AppHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 h-16">
      <div className="max-w-[1920px] mx-auto px-4 h-full flex items-center justify-between">
        {/* Lado Esquerdo: Logo Rumo */}
        <div className="flex items-center">
          <img src={rumoLogo} alt="Rumo Logística" className="h-8 w-auto" />
          <div className="h-6 w-px bg-gray-300 mx-4 hidden sm:block"></div>
          <h1 className="text-lg font-semibold text-gray-700 hidden sm:block">
            Status Diário
          </h1>
        </div>

        {/* Lado Direito: Logo PCM e Título */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Sistema de Monitoramento</p>
            <p className="text-sm font-bold text-blue-900">Painel PCM</p>
          </div>
          <img src={pcmLogo} alt="PCM" className="h-10 w-auto" />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;