import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invitationService } from '../services/invitationService';
import { NotificationDropdown } from './NotificationDropdown';

interface NavItem {
  to: string;
  label: string;
  color: string;
  badge?: number;
}

export const MobileNav: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch pending invitations count
  useEffect(() => {
    let isMounted = true;

    const fetchPendingInvitations = async () => {
      try {
        const response = await invitationService.getReceivedInvitations();
        const pending = response.items.filter((inv) => inv.status === 'pending');
        if (isMounted) {
          setPendingCount(pending.length);
        }
      } catch {
        // Silently fail - badge will just show 0
        if (isMounted) {
          setPendingCount(0);
        }
      }
    };

    fetchPendingInvitations();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', color: 'bg-gray-600' },
    { to: '/leagues/create', label: 'Create League', color: 'bg-purple-600' },
    { to: '/leagues/join', label: 'Join League', color: 'bg-indigo-600' },
    { to: '/my-leagues', label: 'My Leagues', color: 'bg-amber-600' },
    { to: '/my-teams', label: 'My Teams', color: 'bg-orange-600' },
    { to: '/invitations', label: 'Invitations', color: 'bg-teal-600', badge: pendingCount },
    { to: '/sent-invitations', label: 'Sent Invitations', color: 'bg-cyan-600' },
    { to: '/leagues', label: 'Browse Leagues', color: 'bg-green-600' },
    { to: '/drivers', label: 'Drivers', color: 'bg-pink-600' },
    { to: '/constructors', label: 'Constructors', color: 'bg-rose-600' },
    { to: '/races', label: 'Race Calendar', color: 'bg-red-600' },
    { to: '/notifications', label: 'Notifications', color: 'bg-violet-600' },
    { to: '/help', label: 'Help', color: 'bg-indigo-500' },
    { to: '/settings', label: 'Settings', color: 'bg-slate-600' },
    { to: '/profile', label: 'Profile', color: 'bg-blue-600' },
  ];

  return (
    <div className="mobile-nav" ref={menuRef}>
      {/* Mobile Header */}
      <div className="mobile-nav-header">
        <Link to="/dashboard" className="mobile-nav-brand">
          FantasyF1
        </Link>
        <div className="mobile-nav-actions">
          <NotificationDropdown />
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <span className={`hamburger-line ${isOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${isOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${isOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isOpen ? 'open' : ''}`} />

      {/* Mobile Menu Drawer */}
      <nav className={`mobile-menu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button
            className="mobile-menu-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-menu-user">
          <span className="user-greeting">
            Welcome, {user?.full_name || user?.username}
          </span>
        </div>

        <div className="mobile-menu-items">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`mobile-nav-item ${location.pathname === item.to ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className={`nav-indicator ${item.color}`} />
              <span className="nav-label">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="mobile-menu-footer">
          <button onClick={handleLogout} className="mobile-logout-btn">
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MobileNav;
