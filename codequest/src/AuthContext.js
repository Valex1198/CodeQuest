import { createContext, useState, useEffect, useContext } from "react";

// Create context
export const AuthContext = createContext();

// Custom hook
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on init
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login
  const signIn = async (username, password) => {
  try {
    const res = await fetch(
      `http://localhost:8055/items/users?filter[username][_eq]=${encodeURIComponent(
        username
      )}&fields=*,user_achievements.*,java.*,cplus.*,python.*`
    );

    const data = await res.json();
    const foundUser = data.data[0];

    if (!foundUser) throw new Error("User not found");
    if (foundUser.password !== password) throw new Error("Incorrect password");

    // Add fallback defaults
    const userData = {
      ...foundUser,
      avatar: foundUser.avatar || "/avatars/avatar1.png",
      role: foundUser.role || "User",
      date_created: foundUser.date_created || new Date().toISOString(),
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    return true;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
};


  // Logout
  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Update + sync with Directus
  const updateUser = async (updatedUser) => {
    try {
      if (!updatedUser.id) {
        throw new Error("User ID is missing — cannot update Directus.");
      }

      // PATCH request to Directus
      const res = await fetch(`http://localhost:8055/items/users/${updatedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) throw new Error("Failed to update user in Directus");

      const savedUser = await res.json();

      // Update React + localStorage
      setUser(savedUser.data);
      localStorage.setItem("user", JSON.stringify(savedUser.data));
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser: updateUser, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
