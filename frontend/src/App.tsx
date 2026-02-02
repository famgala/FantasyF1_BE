import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import AdminErrorLogs from './pages/AdminErrorLogs';
import AdminHealth from './pages/AdminHealth';
import AdminUsers from './pages/AdminUsers';
import BrowseLeagues from './pages/BrowseLeagues';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueDetail from './pages/LeagueDetail';
import EditLeague from './pages/EditLeague';
import MyLeagues from './pages/MyLeagues';
import MyTeams from './pages/MyTeams';
import TeamDetailPage from './pages/TeamDetail';
import SendInvitations from './pages/SendInvitations';
import ReceivedInvitations from './pages/ReceivedInvitations';
import SentInvitations from './pages/SentInvitations';
import LeagueInvitations from './pages/LeagueInvitations';
import LeagueRoles from './pages/LeagueRoles';
import AddPicks from './pages/AddPicks';
import CreateDraftOrder from './pages/CreateDraftOrder';
import ViewDraftOrder from './pages/ViewDraftOrder';
import DraftStatus from './pages/DraftStatus';
import MakeDraftPick from './pages/MakeDraftPick';
import DraftBoard from './pages/DraftBoard';
import LeagueLeaderboard from './pages/LeagueLeaderboard';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Constructors from './pages/Constructors';
import RaceCalendar from './pages/RaceCalendar';
import RaceDetail from './pages/RaceDetail';
import RaceResults from './pages/RaceResults';
import Notifications from './pages/Notifications';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues"
            element={
              <ProtectedRoute>
                <BrowseLeagues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/create"
            element={
              <ProtectedRoute>
                <CreateLeague />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/join"
            element={
              <ProtectedRoute>
                <JoinLeague />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id"
            element={
              <ProtectedRoute>
                <LeagueDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/edit"
            element={
              <ProtectedRoute>
                <EditLeague />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/invite"
            element={
              <ProtectedRoute>
                <SendInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/invitations"
            element={
              <ProtectedRoute>
                <LeagueInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/roles"
            element={
              <ProtectedRoute>
                <LeagueRoles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/create-draft-order"
            element={
              <ProtectedRoute>
                <CreateDraftOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/draft-order"
            element={
              <ProtectedRoute>
                <ViewDraftOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/draft-status"
            element={
              <ProtectedRoute>
                <DraftStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/make-draft-pick"
            element={
              <ProtectedRoute>
                <MakeDraftPick />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/draft-board"
            element={
              <ProtectedRoute>
                <DraftBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues/:id/leaderboard"
            element={
              <ProtectedRoute>
                <LeagueLeaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-leagues"
            element={
              <ProtectedRoute>
                <MyLeagues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-teams"
            element={
              <ProtectedRoute>
                <MyTeams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <TeamDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:teamId/picks/:raceId"
            element={
              <ProtectedRoute>
                <AddPicks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <ProtectedRoute>
                <ReceivedInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sent-invitations"
            element={
              <ProtectedRoute>
                <SentInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <ProtectedRoute>
                <Drivers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers/:id"
            element={
              <ProtectedRoute>
                <DriverDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/constructors"
            element={
              <ProtectedRoute>
                <Constructors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/races"
            element={
              <ProtectedRoute>
                <RaceCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/races/:id"
            element={
              <ProtectedRoute>
                <RaceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/races/:id/results"
            element={
              <ProtectedRoute>
                <RaceResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/error-logs"
            element={
              <ProtectedRoute>
                <AdminErrorLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/health"
            element={
              <ProtectedRoute>
                <AdminHealth />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Default redirect - catch all unmatched routes */}
          <Route path="/404" element={<Navigate to="/" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;