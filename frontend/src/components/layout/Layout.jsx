import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0 bg-[#0B0F19]">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-[#0B0F19]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
