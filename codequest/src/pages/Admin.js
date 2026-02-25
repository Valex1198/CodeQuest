import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null); // Track which user is being edited
  const [editForm, setEditForm] = useState({ username: "", email: "" });

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8055/items/users");
        const data = await response.json();

        if (response.ok) {
          setUsers(data.data || []);
        } else {
          alert("❌ Failed to fetch users: " + (data.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        alert("⚠️ Could not connect to server.");
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`http://localhost:8055/items/users/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ User deleted successfully");
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert("❌ Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("⚠️ Could not connect to server.");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const response = await fetch(`http://localhost:8055/items/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        alert("✅ Role updated successfully");
        setUsers(
          users.map((u) =>
            u.id === id ? { ...u, role: newRole } : u
          )
        );
      } else {
        alert("❌ Failed to update role");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert("⚠️ Could not connect to server.");
    }
  };

  const startEditing = (u) => {
    setEditingUser(u.id);
    setEditForm({ username: u.username, email: u.email });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({ username: "", email: "" });
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:8055/items/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        alert("✅ User updated successfully");
        setUsers(
          users.map((u) =>
            u.id === id ? { ...u, ...editForm } : u
          )
        );
        cancelEditing();
      } else {
        alert("❌ Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("⚠️ Could not connect to server.");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg font-bold">
        🚫 Access Denied — Admins only
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="w-full border border-gray-600 text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3 border-b border-gray-600">Avatar</th>
              <th className="p-3 border-b border-gray-600">ID</th>
              <th className="p-3 border-b border-gray-600">Username</th>
              <th className="p-3 border-b border-gray-600">Email</th>
              <th className="p-3 border-b border-gray-600">Role</th>
              <th className="p-3 border-b border-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-800">
                {/* Avatar column */}
                <td className="p-3 border-b border-gray-600">
                  <img
                    src={u.avatar || "/avatars/avatar1.png"} // fallback avatar
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>
                <td className="p-3 border-b border-gray-600">{u.id}</td>
                <td className="p-3 border-b border-gray-600">
                  {editingUser === u.id ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      className="bg-gray-700 text-white p-1 rounded"
                    />
                  ) : (
                    u.username
                  )}
                </td>
                <td className="p-3 border-b border-gray-600">
                  {editingUser === u.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="bg-gray-700 text-white p-1 rounded"
                    />
                  ) : (
                    u.email
                  )}
                </td>
                <td className="p-3 border-b border-gray-600">{u.role}</td>
                <td className="p-3 border-b border-gray-600 space-x-2">
                  {editingUser === u.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(u.id)}
                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-500 px-3 py-1 rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(u)}
                        className="bg-purple-600 px-3 py-1 rounded hover:bg-purple-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      {u.role !== "admin" ? (
                        <button
                          onClick={() => handleRoleChange(u.id, "admin")}
                          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(u.id, "student")}
                          className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700"
                        >
                          Demote to Student
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
