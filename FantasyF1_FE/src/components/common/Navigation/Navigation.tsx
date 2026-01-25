import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./Navigation.scss";

/**
 * Navigation component
 * 
 * Provides responsive navigation with main header,
 * navigation links, notification bell, and user menu.
 */
const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadNotifications, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  /**
   * Navigation items configuration
   */
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/leagues", label: "Leagues", icon: "🏆" },
    { path: "/races", label: "Races", icon: "🏁" },
    { path: "/drivers", label: "Drivers", icon: "👨‍🦱" },
  ];

  /**
   * Close mobile menu on route change
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * Close dropdowns when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu") && !target.closest(".user-toggle")) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest(".notification-dropdown") && !target.closest(".notification-bell")) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Check if route is active
   */
  const isActive = (path: string): boolean => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  /**
   * Toggle user menu
   */
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsNotificationDropdownOpen(false);
  };

  /**
   * Toggle notification dropdown
   */
  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsUserMenuOpen(false);
  };

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="navigation__container">
        {/* Logo/Brand */}
        <div className="navigation__logo">
          <Link to="/dashboard" className="logo-link" aria-label="Fantasy F1 Home">
            <span className="logo-icon">🏎️</span>
            <span className="logo-text">Fantasy F1</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="navigation__links navigation__links--desktop">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? "nav-link--active" : ""}`}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="navigation__actions">
          {/* Notification Bell */}
          <button
            className="notification-bell"
            onClick={toggleNotificationDropdown}
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ""}`}
            aria-expanded={isNotificationDropdownOpen}
            aria-haspopup="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="bell-icon"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="notification-badge" aria-label={`${unreadNotifications} unread notifications`}>
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationDropdownOpen && (
            <div className="notification-dropdown" role="dialog" aria-modal="false">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button
                  className="mark-all-read"
                  aria-label="Mark all notifications as read"
                >
                  Mark all as read
                </button>
              </div>
              <div className="notification-list">
                <p className="no-notifications">No new notifications</p>
              </div>
            </div>
          )}

          {/* User Menu */}
          <div className="user-menu-container">
            <button
              className="user-toggle"
              onClick={toggleUserMenu}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div className="user-avatar">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || "U"}
              </div>
              <svg
                className="chevron-down"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="user-menu" role="menu" aria-label="User menu">
                <div className="user-menu-header">
                  <div className="user-avatar large">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </div>
                  <div className="user-info">
                    <p className="user-name">{user?.full_name || user?.username}</p>
                    <p className="user-email">{user?.email}</p>
                  </div>
                </div>
                <hr className="user-menu-divider" />
                <div className="user-menu-items">
                  <Link
                    to="/profile"
                    className="user-menu-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="user-menu-item"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Settings</span>
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="user-menu-item user-menu-item--admin"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <hr className="user-menu-divider" />
                  <button
                    className="user-menu-item user-menu-item--danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-container">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? "mobile-nav-link--active" : ""}`}
                aria-current={isActive(item.path) ? "page" : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              to="/profile"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">👤</span>
              <span>Profile</span>
            </Link>
            <Link
              to="/settings"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">⚙️</span>
              <span>Settings</span>
            </Link>
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">🛡️</span>
                <span>Admin</span>
              </Link>
            )}
            <button
              className="mobile-nav-link mobile-nav-link--logout"
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Notification Dropdown Portal */}
      {isNotificationDropdownOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setIsNotificationDropdownOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navigation;
