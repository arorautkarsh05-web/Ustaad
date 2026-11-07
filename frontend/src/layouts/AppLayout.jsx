import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Compute a readable page title based on path
  const getTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Mechanic Dashboard';
    if (path.startsWith('/profile')) return 'Ustaad Profile & ID';
    if (path.startsWith('/fitments/create')) return 'Record New Fitment';
    if (path.startsWith('/fitments')) return 'Fitment Passport';
    if (path.startsWith('/academy')) return 'Ustaad Academy';
    if (path.startsWith('/toolbank')) return 'ToolBank Hub';
    if (path.startsWith('/credits')) return 'Credits & Recognition';
    if (path.startsWith('/dealer/reservations')) return 'ToolBank Reservations';
    if (path.startsWith('/dealer')) return 'Dealer Dashboard';
    if (path.startsWith('/admin/mechanics')) return 'Mechanic Directory';
    if (path.startsWith('/admin/fitments')) return 'Fitment Verification';
    if (path.startsWith('/admin/courses')) return 'Course Management';
    if (path.startsWith('/admin/toolbank')) return 'ToolBank Inventory';
    if (path.startsWith('/admin/analytics')) return 'Analytics & Trends';
    if (path.startsWith('/admin/users')) return 'User Access Management';
    if (path.startsWith('/admin')) return 'Administrative Overview';
    return 'Eurogrip Ustaad Network';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} pageTitle={getTitle()} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

