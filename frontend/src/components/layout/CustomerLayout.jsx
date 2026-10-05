import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { CustomerTopbar } from './CustomerTopbar';

export function CustomerLayout() {
  return (
    <div className="flex min-h-screen text-[#f5ede6] antialiased">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CustomerTopbar />
        <main className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerLayout;
