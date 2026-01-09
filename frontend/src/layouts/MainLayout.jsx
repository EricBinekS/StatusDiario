import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/Common/AppHeader';
import Footer from '../components/Common/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-900 font-sans text-[#1e293b] dark:text-slate-100 transition-colors duration-300 flex flex-col">
      
      {/* 1. Header Modularizado */}
      <AppHeader />

      {/* 2. Conteúdo Principal */}
      <main className="p-4 max-w-[1920px] mx-auto flex-1 w-full">
        <Outlet />
      </main>

      {/* 3. Rodapé Modularizado */}
      <Footer />
      
    </div>
  );
};

export default MainLayout;