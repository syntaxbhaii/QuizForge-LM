import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Search, UserCheck, Trash2, Edit2, ShieldAlert, Key, Plus, X, UserPlus } from "lucide-react";

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("student");
  const [editIsActive, setEditIsActive] = useState(true);

  // New User Creation State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [adding, setAdding] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await API.get(`/users/?search=${search}`);
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to load user directories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleUpdate = async (id) => {
    try {
      await API.put(`/users/${id}`, {
        role: editRole,
        is_active: editIsActive
      });
      toast.success("User configuration updated!");
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      toast.error("You cannot delete your own administrator account!");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this user? All their exam attempt scores and records will be deleted!")) {
      return;
    }
    try {
      await API.delete(`/users/${id}`);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setAdding(true);
    try {
      await API.post("/users/", {
        full_name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      toast.success("User created successfully!");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("student");
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            User Directory Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            List user profiles, modify system roles, and revoke platform access.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-semibold rounded-xl shadow-md transition self-start"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-premium">
        <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name or email address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-none bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Users List table */}
      {users.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-6 font-semibold">User Details</th>
                  <th className="p-6 font-semibold">Email</th>
                  <th className="p-6 font-semibold">Role</th>
                  <th className="p-6 font-semibold">Status</th>
                  <th className="p-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-6">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {u.full_name}
                      </p>
                      <span className="text-[10px] text-slate-400">UID: #{u.id}</span>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-slate-400 font-medium">
                      {u.email}
                    </td>
                    <td className="p-6">
                      {editingId === u.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="px-2 py-1 rounded border border-slate-250 bg-transparent text-xs dark:bg-slate-900"
                        >
                          <option value="student">student</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      {editingId === u.id ? (
                        <select
                          value={String(editIsActive)}
                          onChange={(e) => setEditIsActive(e.target.value === "true")}
                          className="px-2 py-1 rounded border border-slate-250 bg-transparent text-xs dark:bg-slate-900"
                        >
                          <option value="true">Active</option>
                          <option value="false">Suspended</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                              : "text-red-600 bg-red-50 dark:bg-red-950/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      {editingId === u.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(u.id)}
                            className="px-3 py-1.5 bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white rounded-lg text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(u)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-amber-500 transition"
                            title="Edit Role/Access"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={u.id === currentUser?.id}
                            onClick={() => handleDelete(u.id)}
                            className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition disabled:opacity-30"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-slate-400">
          <UserCheck className="w-16 h-16 mb-4 stroke-1 text-slate-350" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No users found</p>
          <p className="text-sm text-slate-500 mt-1">Try resetting your search query.</p>
        </div>
      )}

      {/* Creation Modal form */}
      {showAddForm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-glass space-y-6 animate-fade-in animate-duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Add New User
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biswa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@quizforge.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Platform Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none dark:bg-slate-900"
                >
                  <option value="student" className="dark:bg-slate-900">Student</option>
                  <option value="admin" className="dark:bg-slate-900">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
                >
                  {adding ? "Saving..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageUsers;
