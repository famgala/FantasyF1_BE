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
import { RaceCalendarPage } from "./pages/RaceCalendarPage";
import RaceDetailPage from "./pages/RaceDetailPage";
import RaceResultsPage from "./pages/RaceResultsPage";
import { ScoringPage } from "./pages/ScoringPage";
import DriverListPage from "./pages/DriverListPage";
import DriverProfilePage from "./pages/DriverProfilePage";
import { ProfilePage } from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminLeaguesPage from "./pages/AdminLeaguesPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminRaceManagementPage from "./pages/AdminRaceManagementPage";
import { AdminNotificationsPage } from "./pages/AdminNotificationsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationContainer } from "./components/notifications/NotificationContainer";
import "./App.scss";

/**
 * Main App Content Component
 * 
 * Wraps the application routes with authentication and notification providers.
 */
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
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
                  <RaceCalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/races/:raceId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RaceDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/races/:raceId/results"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RaceResultsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/constructors/:constructorId/scoring"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ScoringPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Driver Routes */}
          <Route
            path="/drivers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DriverListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drivers/:status"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DriverListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drivers/:driverId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DriverProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminUsersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/leagues"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminLeaguesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminLogsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/races"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRaceManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminNotificationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {/* Toast Notifications Container */}
      {isAuthenticated && <NotificationContainer />}
    </>
  );
};

/**
 * Main App Component
 * 
 * Sets up routing for the Fantasy F1 application.
 * Routes are organized by feature area.
 * Wraps the entire app with AuthProvider and NotificationProvider.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContentWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Wrapper to access auth context for NotificationProvider
 */
const AppContentWrapper: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NotificationProvider isAuthenticated={isAuthenticated}>
      <AppContent />
    </NotificationProvider>
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
