import React from 'react';
import { MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full mt-auto flex flex-col md:flex-row justify-between items-center gap-2 border-t border-gray-200 dark:border-slate-700 pt-3 px-6 pb-4 bg-[#f4f6f8] dark:bg-slate-900 transition-colors">
      <div className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
        <span>Desenvolvido por <strong className="text-gray-600 dark:text-slate-400">Eric Binek</strong></span>
        <span className="mx-1.5 opacity-50">•</span>
        <span>v4.2</span>
        <span className="mx-1.5 opacity-50">•</span>
        <span>{new Date().getFullYear()}</span>
      </div>

      <a 
          href="https://wa.me/5541998630158?text=Ol%C3%A1%2C%20estou%20com%20d%C3%BAvidas%20no%20Dashboard." 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group no-underline"
      >
          <MessageCircle size={14} className="text-white fill-white/20" />
          <span className="font-bold text-[10px] tracking-wide">Suporte WhatsApp</span>
      </a>
    </footer>
  );
};

export default Footer;