import React from 'react';
import { Construction, MessageCircle } from 'lucide-react';

const MaintenanceScreen = ({ moduleName = "nesta área" }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500 w-full h-full flex-1">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-full mb-6 ring-1 ring-yellow-200 dark:ring-yellow-700/50 shadow-lg shadow-yellow-100 dark:shadow-none">
        <Construction size={64} className="text-yellow-600 dark:text-yellow-500" />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
        Manutenção: {moduleName}
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
        Estamos realizando melhorias no módulo <strong>{moduleName}</strong> para entregar dados e funcionalidades ainda melhores. <br/>
        Por favor, aguarde ou entre em contato com o suporte.
      </p>

      <a 
        href={`https://wa.me/5541998630158?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20sobre%20a%20libera%C3%A7%C3%A3o%20do%20m%C3%B3dulo%20${moduleName}.`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-1 group"
      >
        <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
        Falar com Suporte
      </a>
    </div>
  );
};

export default MaintenanceScreen;