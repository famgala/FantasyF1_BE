import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import Navigation from "../../common/Navigation/Navigation";
import Footer from "../../common/Footer/Footer";
import "./AppLayout.scss";

/**
 * Main Application Layout Component
 * 
 * Provides consistent layout with Navigation, main content area, and Footer.
 * Wraps child routes with consistent layout structure.
 */
export const AppLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AppLayout;
