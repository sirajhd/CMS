import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { NotificationDropdown } from './NotificationDropdown';
import { 
  Menu,
  ChevronRight,
  HardHat
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('cms_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cms_sidebar_collapsed', String(next));
      } catch (err) {
        console.error('Failed to save sidebar state:', err);
      }
      return next;
    });
  };

  const userRole = user?.role || 'Admin';

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return ['Overview', `${userRole} Dashboard`];
    if (path.startsWith('/projects/') && path !== '/projects') return ['Directory', 'Projects', 'Site Dossier'];
    if (path.startsWith('/projects')) return ['Directory', 'Projects'];
    if (path.startsWith('/requests')) return ['Operations', 'Requisitions & Approvals'];
    if (path.startsWith('/users')) return ['Management', 'Stakeholder Directory'];
    if (path.startsWith('/payments')) return ['Financials', 'Disbursements'];
    if (path.startsWith('/materials')) return ['Logistics', 'Materials Tracking'];
    if (path.startsWith('/documents')) return ['Repository', 'Documents Archive'];
    if (path.startsWith('/activities')) return ['Audit Trail', 'Project Activities'];
    return ['System', 'Workspace'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#0b0f14] text-[#f0f6fc] flex overflow-hidden">
      {/* Responsive Sidebar (Mobile Drawer + Collapsible Desktop Rail) */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0b0f14]">
        {/* Sticky Header Navbar */}
        <header className="h-16 flex-shrink-0 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          {/* Left: Mobile Hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161b22] border border-[#30363d] md:hidden transition-colors cursor-pointer flex-shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs Navigation */}
            <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 sm:gap-2 text-xs truncate font-mono">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                  <span
                    className={cn(
                      'truncate',
                      idx === breadcrumbs.length - 1
                        ? 'font-bold text-white'
                        : 'text-slate-500 hidden sm:inline'
                    )}
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Notifications, Role Pill, User Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* System Alerts & Notifications Popover */}
            <NotificationDropdown />

            <div className="h-5 w-px bg-[#30363d] hidden sm:block" />

            {/* Stakeholder Identity */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[150px]">
                  {user?.name || 'User'}
                </p>
                <span className="text-[10px] font-bold text-[#b4e600] uppercase tracking-wider font-mono">
                  {userRole}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#b4e600] text-black font-black text-xs flex items-center justify-center shadow-md flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body (Independently scrollable) */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 md:p-8 bg-[#0b0f14] text-[#f0f6fc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
