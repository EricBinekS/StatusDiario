import React from 'react';
import { NavLink } from 'react-router-dom'; 
import rumoLogo from '/rumo-logo.svg';
import logoPcm from '/logo_pcm.svg';

const AppHeader = ({ lastUpdate }) => {
  
  // Estilo do botão de navegação
  const navLinkClass = ({ isActive }) => 
    `px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${
      isActive 
        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  // CORREÇÃO: Formata o objeto Date para uma string legível (ex: 10/12/2024 15:30:00)
  // Se lastUpdate não for uma Data (ex: null ou string), mantém como está.
  const formattedDate = lastUpdate instanceof Date 
    ? lastUpdate.toLocaleString('pt-BR') 
    : lastUpdate;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-30 flex-none h-16 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      
      {/* Lado Esquerdo: Título e Logos */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#062e4e] tracking-tight m-0 leading-tight">
              PAINEL INTERVALOS - PCM
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
               {lastUpdate ? (
                 <>
                   {/* Aqui usamos a variável formatada (string) em vez do objeto Date */}
                   <span>Última Atualização: {formattedDate}</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 </>
               ) : (
                 <span>Carregando...</span>
               )}
            </div>
        </div>
      </div>

      {/* Centro: Navegação (Abas) */}
      <nav className="hidden md:flex items-center space-x-2 bg-gray-50/50 p-1 rounded-lg border border-gray-100">
        <NavLink to="/" className={navLinkClass} end>
          <span>Painel Operacional</span>
        </NavLink>
        
        <NavLink to="/overview" className={navLinkClass}>
          <span>Overview Gerencial</span>
        </NavLink>
      </nav>

      {/* Lado Direito: Logos */}
      <div className="flex items-center gap-4">
         <img src={rumoLogo} alt="Rumo" className="h-8 w-auto object-contain" />
         <div className="w-px h-6 bg-gray-300"></div>
         <img src={logoPcm} alt="PCM" className="h-8 w-auto object-contain" />
      </div>

    </header>
  );
};

export default AppHeader;