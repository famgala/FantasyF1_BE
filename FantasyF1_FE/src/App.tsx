import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationContainer } from "./components/notifications/NotificationContainer";
import { SkipNavigation } from "./components/accessibility/SkipNavigation";
import { LoadingPage } from "./components/loading/LoadingPage";
import "./App.scss";

// Code split pages with React.lazy for better performance
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CreateLeaguePage = lazy(() => import("./pages/CreateLeaguePage"));
const JoinLeaguePage = lazy(() => import("./pages/JoinLeaguePage"));
const DraftRoomPage = lazy(() => import("./pages/DraftRoomPage"));
const RaceCalendarPage = lazy(() => import("./pages/RaceCalendarPage"));
const RaceDetailPage = lazy(() => import("./pages/RaceDetailPage"));
const RaceResultsPage = lazy(() => import("./pages/RaceResultsPage"));
const ScoringPage = lazy(() => import("./pages/ScoringPage"));
const DriverListPage = lazy(() => import("./pages/DriverListPage"));
const DriverProfilePage = lazy(() => import("./pages/DriverProfilePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminLeaguesPage = lazy(() => import("./pages/AdminLeaguesPage"));
const AdminLogsPage = lazy(() => import("./pages/AdminLogsPage"));
const AdminRaceManagementPage = lazy(() => import("./pages/AdminRaceManagementPage"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

/**
 * Main App Content Component
 * 
 * Wraps the application routes with authentication and notification providers.
 */
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <SkipNavigation />
      <div className="app" id="main-content">
        <Suspense fallback={<LoadingPage />}>
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
        </Suspense>
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
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="placeholder-page">
    <h1>{title}</h1>
    <p>This page is coming soon.</p>
    <a href="/">← Back to Home</a>
  </div>
);

export default App;
