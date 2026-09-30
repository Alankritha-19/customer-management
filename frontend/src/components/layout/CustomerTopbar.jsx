import { useAuth } from '../../context/AuthContext';

export function CustomerTopbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Customer Service & Enquiry Hub
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
            Customer Account
          </span>
          <span className="font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
