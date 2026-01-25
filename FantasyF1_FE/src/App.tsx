import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import CreateLeaguePage from "./pages/CreateLeaguePage";
import JoinLeaguePage from "./pages/JoinLeaguePage";
import DraftRoomPage from "./pages/DraftRoomPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import "./App.scss";

/**
 * Main App Component
 * 
 * Sets up routing for the Fantasy F1 application.
 * Routes are organized by feature area.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<PlaceholderPage title="Terms of Service" />} />
          <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" />} />
          
          {/* Protected Routes - Wrapped with AppLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* League Routes */}
          <Route
            path="/create-league"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateLeaguePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/join-league"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <JoinLeaguePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Draft Routes */}
          <Route
            path="/leagues/:leagueId/races/:raceId/draft"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DraftRoomPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected placeholder routes with AppLayout */}
          <Route
            path="/leagues"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PlaceholderPage title="Leagues" />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/races"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PlaceholderPage title="Races" />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PlaceholderPage title="Profile" />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* 404 Fallback */}
          <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

/**
 * Placeholder component for routes not yet implemented
 * Will be replaced as stories are completed
 */
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="placeholder-page">
    <h1>{title}</h1>
    <p>This page is coming soon.</p>
    <a href="/">← Back to Home</a>
  </div>
);

export default App;
