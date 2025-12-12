import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/Common/AppHeader';

const MainLayout = () => {
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <AppHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;