import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  LogOut, 
  Sparkles,
  Zap,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customer Enquiries', path: '/customers', icon: Users },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            CustomerAI <span className="text-xs bg-indigo-500/20 text-indigo-400 font-semibold px-1.5 py-0.5 rounded">Hub</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-normal">Business Management</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Owner Portal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* AI Assistant Banner */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-900/50 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Enquiry Intelligence</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Automated customer qualification, intent categorization & response approval.
        </p>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <div className="overflow-hidden text-left">
            <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
              <span>{user?.name || 'Owner'}</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email || 'owner@business.com'}</div>
            <div className="text-[10px] text-indigo-400 font-medium">Business Owner</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

