import React, { useState, useEffect } from "react";
import { getAdminUsers, updateUserStatus, updateUserRole, AdminUser } from "../../services/adminService";
import "./AdminUsersPage.scss";

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { users } = await getAdminUsers();
      setUsers(users);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      console.error("Failed to update user status:", err);
    }
  };

  const handleRoleChange = async (userId: number, newRole: "user" | "admin") => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" ? user.isActive : !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="admin-users">
      <header className="admin-users__header">
        <h1>User Management</h1>
        <p>Manage user accounts, roles, and permissions</p>
      </header>

      <div className="admin-users__filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-users__search"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}>
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="admin-users__loading">Loading users...</div>
      ) : (
        <table className="admin-users__table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Teams</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as "user" | "admin")}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span className={`admin-users__status ${user.isActive ? "admin-users__status--active" : "admin-users__status--inactive"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{user.teamsCount}</td>
                <td>{new Date(user.lastLogin).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleStatusToggle(user.id, user.isActive)}>
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsersPage;
