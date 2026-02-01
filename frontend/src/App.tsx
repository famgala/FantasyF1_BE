import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import BrowseLeagues from './pages/BrowseLeagues';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueDetail from './pages/LeagueDetail';
import EditLeague from './pages/EditLeague';
import MyLeagues from './pages/MyLeagues';
import SendInvitations from './pages/SendInvitations';
import ReceivedInvitations from './pages/ReceivedInvitations';
import SentInvitations from './pages/SentInvitations';
import LeagueInvitations from './pages/LeagueInvitations';
import LeagueRoles from './pages/LeagueRoles';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
            path="/my-leagues"
            element={
              <ProtectedRoute>
                <MyLeagues />
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

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;