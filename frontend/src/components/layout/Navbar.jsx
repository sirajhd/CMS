import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export function Navbar({ onOpenMobileMenu }) {
  const { user, role } = useAuth();

  return (
    <header className="h-16 bg-[#0d1117] border-b border-[#30363d] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:text-[#b4e600] hover:bg-[#21262d] lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs font-medium text-slate-400 font-mono">
          <span className="font-bold text-white uppercase tracking-wider">{user?.name}</span>
          <span className="text-[#30363d]">•</span>
          <span className="bg-[#161b22] border border-[#30363d] px-2.5 py-0.5 rounded-full text-[#b4e600] font-bold text-[11px] uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-xl bg-[#b4e600] text-black font-black text-xs flex items-center justify-center shadow-md">
          {user?.avatar || 'U'}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
