import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");   // ❌ error
  const [successMessage, setSuccessMessage] = useState(""); // ✅ success

  const navigate = useNavigate();

  // ✅ Regex for: min 8 chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!passwordRegex.test(password)) {
      setErrorMessage(
        "❌ Password must be at least 8 characters long, include an uppercase letter, a number, and a special character."
      );
      setSuccessMessage("");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8055/items/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log("Directus response:", data);

      if (!response.ok) {
        const message = data.errors
          ? data.errors.map((err) => err.message).join(", ")
          : data.message || "Unknown error";
        setErrorMessage("❌ Registration failed: " + message);
        setSuccessMessage("");
      } else {
        setSuccessMessage("✅ Registration successful! Redirecting to login...");
        setErrorMessage("");
        setUsername("");
        setEmail("");
        setPassword("");

        // ✅ Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setErrorMessage("❌ An error occurred. Check console for details.");
      setSuccessMessage("");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>

        {/* ❌ Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-600 text-white text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* ✅ Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 rounded bg-green-600 text-white text-sm text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded bg-gray-700 focus:outline-none"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded bg-gray-700 focus:outline-none"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded bg-gray-700 focus:outline-none w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log in here
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-gray-400 hover:text-white text-sm underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
