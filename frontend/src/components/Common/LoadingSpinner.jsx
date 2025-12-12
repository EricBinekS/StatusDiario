import React from 'react';

const LoadingSpinner = ({ message = "Carregando dados..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 w-full">
      <div className="relative">
        <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-blue-900 border-t-transparent"></div>
      </div>
      <p className="mt-4 text-gray-500 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;