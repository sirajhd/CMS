import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HardHat, 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  FileText, 
  CreditCard, 
  Boxes, 
  Activity, 
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Building2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const { user, role, company, logout } = useAuth();
  const location = useLocation();
  const userRole = role || user?.role || 'Admin';

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'SuperAdmin':
        return '/superadmin/dashboard';
      case 'House Holder':
        return '/householder/dashboard';
      case 'Engineer':
        return '/engineer/dashboard';
      case 'Manager':
        return '/manager/dashboard';
      default:
        return '/admin/dashboard';
    }
  };

  const allNavItems = [
    // Super Admin Navigation
    {
      label: 'Platform Overview',
      path: '/superadmin/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['SuperAdmin']
    },
    {
      label: 'Companies / Tenants',
      path: '/superadmin/companies',
      icon: Building2,
      allowedRoles: ['SuperAdmin']
    },
    {
      label: 'Platform Audit Trail',
      path: '/superadmin/audit-logs',
      icon: ShieldCheck,
      allowedRoles: ['SuperAdmin']
    },

    // Company Tenant Workspace Navigation
    { 
      label: 'Dashboard', 
      path: getDashboardPath(), 
      icon: LayoutDashboard,
      allowedRoles: ['Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
    { 
      label: 'Projects', 
      path: '/projects', 
      icon: FolderKanban, 
      allowedRoles: ['Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
    { 
      label: 'Requests', 
      path: '/requests', 
      icon: FileQuestion, 
      allowedRoles: ['Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
    { 
      label: 'Users', 
      path: '/users', 
      icon: Users, 
      allowedRoles: ['Admin'] 
    },
    { 
      label: 'Payments', 
      path: '/payments', 
      icon: CreditCard, 
      allowedRoles: ['Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
    { 
      label: 'Materials', 
      path: '/materials', 
      icon: Boxes, 
      allowedRoles: ['Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
    { 
      label: 'Documents', 
      path: '/documents', 
      icon: FileText, 
      allowedRoles: ['Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
    { 
      label: 'Activities', 
      path: '/activities', 
      icon: Activity, 
      allowedRoles: ['SuperAdmin', 'Admin', 'House Holder', 'Engineer', 'Manager'] 
    },
  ];

  const visibleNav = allNavItems.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. MOBILE OFF-CANVAS DRAWER OVERLAY & ASIDE (< md screens) */}
      {/* ------------------------------------------------------------- */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs transition-opacity duration-300 md:hidden animate-in fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full h-[100dvh] bg-[#0d1117] border-r border-[#30363d] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl md:hidden overflow-hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Mobile Navigation"
      >
        {/* Mobile Header (Fixed Top) */}
        <div className="h-16 flex-shrink-0 px-4 flex items-center justify-between border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[#b4e600] text-black rounded-xl shadow-md ring-2 ring-[#b4e600]/20 flex-shrink-0">
              <HardHat className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="truncate">
              <span className="font-black text-white text-sm tracking-wider uppercase block truncate">
                {user?.company?.name || 'HDtech-CMS'}
              </span>
              <span className="text-[10px] text-[#b4e600] uppercase font-mono tracking-widest block font-bold truncate">
                {user?.company?.code ? `${user.company.code} • ` : ''}{userRole}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#0d1117] transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Nav Links (Independently Scrollable Middle) */}
        <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-1.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = 
              location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onCloseMobile}
                className={`
                  flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                  ${isActive
                    ? 'bg-[#b4e600] text-black shadow-lg shadow-[#b4e600]/10 scale-[1.01]'
                    : 'text-slate-400 hover:bg-[#161b22] hover:text-white border border-transparent hover:border-[#30363d]'}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile User Dossier Card & Sign Out (Fixed Bottom) */}
        <div className="flex-shrink-0 mt-auto p-3 border-t border-[#30363d] bg-[#161b22]">
          <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#b4e600] text-black font-black text-xs flex items-center justify-center flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{user?.title || userRole}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. TABLET & DESKTOP FIXED SIDEBAR (>= md screens)           */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-[#0d1117] border-r border-[#30363d] text-slate-300 transition-all duration-300 ease-in-out h-full h-screen h-[100dvh] flex-shrink-0 select-none overflow-hidden sticky top-0 z-20',
          isCollapsed ? 'w-20' : 'w-64'
        )}
        aria-label="Desktop Navigation"
      >
        {/* Header & Logo (Fixed Top) */}
        <div className="h-16 flex-shrink-0 px-4 flex items-center justify-between border-b border-[#30363d] bg-[#0d1117]">
          <div className={cn('flex items-center gap-3 min-w-0 transition-all', isCollapsed && 'justify-center w-full')}>
            <div className="p-2 bg-[#b4e600] text-black rounded-xl shadow-xs ring-2 ring-[#b4e600]/30 flex-shrink-0">
              <HardHat className="w-5 h-5 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-sm font-black text-white tracking-wider uppercase truncate" title={user?.company?.name || 'HDtech-CMS'}>
                  {user?.company?.name || 'HDtech-CMS'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b4e600] font-mono truncate block">
                  {user?.company?.code ? `${user.company.code} • ` : ''}{userRole}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Nav Items (Independently Scrollable Middle) */}
        <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-1.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = 
              location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

            return (
              <NavLink
                key={item.label}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`
                  group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                  ${isActive 
                    ? 'bg-[#b4e600] text-black font-black shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-[#161b22]'}
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
              >
                <Icon className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Tooltip on Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Fixed Bottom: Collapse Toggle & User Profile / Sign Out */}
        <div className="flex-shrink-0 mt-auto p-3 border-t border-[#30363d] space-y-2 bg-[#0d1117]">
          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Rail'}
            className={cn(
              'w-full py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161b22] border border-transparent hover:border-[#30363d] transition-colors flex items-center text-xs font-bold uppercase tracking-wider cursor-pointer',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {!isCollapsed && <span className="text-[10px] text-slate-500 font-mono">Collapse Sidebar</span>}
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#b4e600]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* User Dossier & Sign Out Button */}
          <div className={cn(
            'rounded-xl bg-[#161b22] border border-[#30363d] flex items-center transition-all',
            isCollapsed ? 'p-2 justify-center' : 'p-2.5 justify-between'
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-8 h-8 rounded-lg bg-[#b4e600] text-black flex items-center justify-center font-black text-xs flex-shrink-0"
                title={`${user?.name} (${userRole})`}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{user?.title || userRole}</p>
                </div>
              )}
            </div>

            {isCollapsed ? (
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="hidden"
              />
            ) : (
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#0d1117] transition-colors cursor-pointer flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
