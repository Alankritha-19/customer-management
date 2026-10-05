import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  LogOut, 
  Sparkles,
  Compass
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
    <aside className="w-68 shrink-0 min-h-screen p-4 flex flex-col justify-between">
      {/* Warm Taupe Glass Container matching reference aesthetics */}
      <div className="glass-panel-warm rounded-3xl h-full flex flex-col justify-between overflow-hidden shadow-2xl border border-[rgba(245,230,211,0.2)]">
        
        {/* Brand Header */}
        <div>
          <div className="p-6 border-b border-[rgba(245,230,211,0.12)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[rgba(235,214,195,0.25)] to-[rgba(142,116,103,0.3)] border border-[rgba(245,230,211,0.3)] flex items-center justify-center text-[#faf6f0] shadow-inner">
              <Compass className="w-5 h-5 text-[#f3e7db]" />
            </div>
            <div>
              <h1 className="font-editorial text-xl font-normal tracking-wide text-[#faf6f0] leading-none">
                AURELIA
              </h1>
              <p className="text-[10px] font-sans-ui uppercase tracking-luxury text-[#c4ada0] mt-1">
                Executive Desk
              </p>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-medium tracking-luxury uppercase text-[#a99587]">
              Command Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium tracking-wide transition-all ${
                      isActive
                        ? 'bg-[rgba(245,230,211,0.18)] text-[#faf6f0] border border-[rgba(245,230,211,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                        : 'text-[#baa293] hover:text-[#faf6f0] hover:bg-[rgba(255,255,255,0.06)] border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-85" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-3">
          {/* AI Banner */}
          <div className="p-4 rounded-2xl bg-[rgba(20,7,12,0.45)] border border-[rgba(245,230,211,0.12)] text-xs">
            <div className="flex items-center gap-2 text-[#ecdcc9] font-medium mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c8a47e]" />
              <span className="font-editorial text-sm tracking-wide">Autonomous Studio</span>
            </div>
            <p className="text-[#a99587] text-[11px] leading-relaxed font-light">
              Intent qualification, client synthesis & private responses.
            </p>
          </div>

          {/* User Profile Footer */}
          <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(245,230,211,0.1)] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[rgba(200,164,126,0.2)] border border-[rgba(245,230,211,0.25)] text-[#faf6f0] flex items-center justify-center font-editorial text-sm font-semibold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-xs font-medium text-[#faf6f0] truncate">
                  {user?.name || 'Managing Director'}
                </div>
                <div className="text-[10px] text-[#a99587] tracking-wider uppercase truncate">
                  {user?.email || 'director@aurelia.com'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-2 rounded-xl text-[#baa293] hover:text-[#fca5a5] hover:bg-[rgba(180,28,56,0.15)] border border-transparent hover:border-[rgba(244,63,94,0.2)] transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
};
