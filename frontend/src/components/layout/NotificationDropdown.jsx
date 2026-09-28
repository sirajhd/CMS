import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_NOTIFICATIONS } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';

export function NotificationDropdown() {
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleNotifications = notifications.filter(
    (n) => n.targetRole === role || role === 'Admin'
  );

  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.targetRole === role || role === 'Admin' ? { ...n, read: true } : n))
    );
  };

  const markOneAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-slate-400 hover:bg-[#21262d] hover:text-[#b4e600] transition-colors relative border border-transparent hover:border-[#30363d]"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#b4e600] rounded-full ring-2 ring-[#0b0f14] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[#161b22] rounded-2xl shadow-2xl border border-[#30363d] z-50 overflow-hidden text-left">
          <div className="p-3.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">System Alerts</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{unreadCount} UNREAD INCIDENTS</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#b4e600] hover:text-[#cbf800] flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#30363d]/50">
            {roleNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No active notifications registered.
              </div>
            ) : (
              roleNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markOneAsRead(notif.id)}
                  className={`p-3.5 hover:bg-[#21262d] transition-colors cursor-pointer text-xs space-y-1 ${!notif.read ? 'bg-[#b4e600]/5' : ''
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white tracking-wide">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#b4e600] mt-1 flex-shrink-0 ring-2 ring-[#b4e600]/30" />
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5 font-mono">
                    <Clock className="w-3 h-3 text-[#b4e600]" />
                    <span>{formatDateTime(notif.time)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
