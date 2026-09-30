import { Outlet } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { CustomerTopbar } from './CustomerTopbar';

export function CustomerLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <CustomerTopbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CustomerLayout;
