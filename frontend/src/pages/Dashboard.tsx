import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invitationService } from '../services/invitationService';
import { NotificationDropdown } from '../components/NotificationDropdown';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingInvitations = useCallback(async () => {
    try {
      const response = await invitationService.getReceivedInvitations();
      const pending = response.items.filter((inv) => inv.status === 'pending');
      setPendingCount(pending.length);
    } catch {
      // Silently fail - badge will just show 0
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">FantasyF1</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome, {user?.full_name || user?.username}
              </span>
              <Link
                to="/leagues/create"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Create League
              </Link>
              <Link
                to="/leagues/join"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Join League
              </Link>
              <Link
                to="/my-leagues"
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                My Leagues
              </Link>
              <Link
                to="/my-teams"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                My Teams
              </Link>
              <Link
                to="/invitations"
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2 relative"
              >
                Invitations
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
              <Link
                to="/sent-invitations"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Sent Invitations
              </Link>
              <Link
                to="/leagues"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Browse Leagues
              </Link>
              <Link
                to="/drivers"
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Drivers
              </Link>
              <Link
                to="/constructors"
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Constructors
              </Link>
              <Link
                to="/races"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Race Calendar
              </Link>
              <div className="mr-2">
                <NotificationDropdown />
              </div>
              <Link
                to="/profile"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to FantasyF1 Dashboard
              </h2>
              <p className="text-gray-600">
                Your fantasy F1 journey begins here. More features coming soon!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
