'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar.js';
import Header from '@/components/Header.js';
import { YearProvider } from '@/components/YearContext.js';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <YearProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
        {/* Sidebar navigation */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main content container */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </YearProvider>
  );
}
