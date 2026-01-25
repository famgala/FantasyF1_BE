import React, { useEffect, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../../services/authService";

/**
 * ProtectedRoute component props
 */
interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected Route Component
 * 
 * Guards routes that require authentication. Redirects to homepage
 * if user is not authenticated.
 * 
 * Usage:
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * @param props - Component props containing the protected children
 * @returns Either the protected children or Navigate to homepage
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  // Optional: Log protected route access for debugging
  useEffect(() => {
    if (authenticated) {
      console.log("[ProtectedRoute] User accessing protected route:", location.pathname);
    }
  }, [authenticated, location.pathname]);

  if (!authenticated) {
    // Redirect to homepage with intent to return after login
    // This preserves the returnUrl in the URL state
    console.log("[ProtectedRoute] Unauthorized access, redirecting to homepage");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
