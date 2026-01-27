import React, { useState, useEffect } from "react";
import { getAdminLeagues, AdminLeague } from "../../services/adminService";
import "./AdminLeaguesPage.scss";

const AdminLeaguesPage: React.FC = () => {
  const [leagues, setLeagues] = useState<AdminLeague[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadLeagues(); }, []);

  const loadLeagues = async () => {
    setIsLoading(true);
    try {
      const { leagues } = await getAdminLeagues();
      setLeagues(leagues);
    } catch (err) {
      console.error("Failed to load leagues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeagues = leagues.filter((league: AdminLeague) =>
    league.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-leagues">
      <header className="admin-leagues__header">
        <h1>League Management</h1>
        <p>View and manage all leagues</p>
      </header>

      <div className="admin-leagues__filters">
        <input
          type="text"
          placeholder="Search leagues..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="admin-leagues__search"
        />
      </div>

      {isLoading ? (
        <div className="admin-leagues__loading">Loading leagues...</div>
      ) : (
        <table className="admin-leagues__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Commissioner</th>
              <th>Members</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeagues.map((league: AdminLeague) => (
              <tr key={league.id}>
                <td>{league.name}</td>
                <td>{league.commissioner}</td>
                <td>{league.membersCount}/{league.maxMembers}</td>
                <td>
                  <span className={`admin-leagues__status admin-leagues__status--${league.status}`}>
                    {league.status}
                  </span>
                </td>
                <td>{new Date(league.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminLeaguesPage;
