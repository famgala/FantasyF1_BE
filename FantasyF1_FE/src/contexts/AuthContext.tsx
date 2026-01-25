import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { isAuthenticated, logout, getAccessToken } from "../services/authService";

/**
 * Decodes JWT token to get expiration time
 * @param token - JWT access token
 * @returns Expiration timestamp in milliseconds, or null if invalid
 */
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch (e) {
    return null;
  }
};

/**
 * Auth Context Interface
 */
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { username: string; email: string } | null;
  sessionWarningVisible: boolean;
  sessionRemainingTime: number;
  logout: () => void;
  refreshAuth: () => void;
  dismissSessionWarning: () => void;
}

/**
 * Auth Context
 * 
 * Provides authentication state and methods across the application.
 * Tracks session expiration and provides warnings before automatic logout.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Session timeout warning threshold (5 minutes before expiration)
 */
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Auth Provider Component
 * 
 * Wraps the application to provide auth context.
 * Monitors localStorage for token changes and tracks session expiration.
 * Shows warning modal 5 minutes before session expires.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticatedState, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [sessionWarningVisible, setSessionWarningVisible] = useState(false);
  const [sessionRemainingTime, setSessionRemainingTime] = useState(0);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Parse user info from JWT token
   * @param token - JWT access token
   * @returns User info or null
   */
  const parseUserFromToken = (token: string): { username: string; email: string } | null => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.sub
        ? { username: decoded.sub || "", email: decoded.email || "" }
        : null;
    } catch (e) {
      return null;
    }
  };

  /**
   * Clear all session timers
   */
  const clearTimers = useCallback(() => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      setWarningTimer(null);
    }
  }, [sessionTimer, warningTimer]);

  /**
   * Schedule session timeout warning and logout
   * @param expirationTime - Token expiration timestamp in milliseconds
   */
  const scheduleSessionTimeout = useCallback((expirationTime: number) => {
    clearTimers();

    const now = Date.now();
    const timeToExpiration = expirationTime - now;

    // Clear session state
    setSessionWarningVisible(false);
    setSessionRemainingTime(0);

    if (timeToExpiration <= 0) {
      // Token already expired, logout immediately
      handleLogout();
      return;
    }

    // Schedule warning (5 minutes before expiration)
    const warningTime = timeToExpiration - SESSION_WARNING_THRESHOLD;
    if (warningTime > 0) {
      const timerId = setTimeout(() => {
        const remaining = Math.ceil((expirationTime - Date.now()) / 1000);
        setSessionRemainingTime(remaining);
        setSessionWarningVisible(true);
      }, warningTime);
      setWarningTimer(timerId as unknown as NodeJS.Timeout);
    }

    // Schedule automatic logout at expiration
    const logoutTimerId = setTimeout(() => {
      setSessionWarningVisible(false);
      handleLogout();
    }, timeToExpiration);
    setSessionTimer(logoutTimerId as unknown as NodeJS.Timeout);
  }, [clearTimers]);

  /**
   * Check authentication status and setup session tracking
   */
  const checkAuth = useCallback(() => {
    const token = getAccessToken();
    const authStatus = isAuthenticated();

    setIsAuthenticated(authStatus);
    setIsLoading(false);

    if (token && authStatus) {
      const userInfo = parseUserFromToken(token);
      setUser(userInfo);

      // Setup session timeout tracking
      const expirationTime = getTokenExpiration(token);
      if (expirationTime) {
        scheduleSessionTimeout(expirationTime);
      }
    } else {
      setUser(null);
      clearTimers();
    }
  }, [scheduleSessionTimeout, clearTimers]);

  /**
   * Logout handler - clears auth state, timers, and tokens
   */
  const handleLogout = useCallback(() => {
    clearTimers();
    logout();
    setIsAuthenticated(false);
    setUser(null);
    setSessionWarningVisible(false);
    setSessionRemainingTime(0);
  }, [clearTimers]);

  /**
   * Refresh auth status (called after login/register)
   */
  const refreshAuth = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Dismiss session warning modal
   */
  const dismissSessionWarning = useCallback(() => {
    setSessionWarningVisible(false);
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for storage changes (for multi-tab auth sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "refresh_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearTimers();
    };
  }, [checkAuth, clearTimers]);

  const value: AuthContextType = {
    isAuthenticated: isAuthenticatedState,
    isLoading,
    user,
    sessionWarningVisible,
    sessionRemainingTime,
    logout: handleLogout,
    refreshAuth,
    dismissSessionWarning,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
