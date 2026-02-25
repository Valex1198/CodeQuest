import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../AuthContext"; // <-- use AuthContext

export default function Login() {
  const { signIn } = useContext(AuthContext); // <-- get signIn
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(username, password); // <-- use username now
      alert("✅ Login successful!");
      navigate("/profile"); // redirect after login
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Check your credentials.");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Log In</h1>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          {/* Username input instead of email */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-green-400 hover:underline">
            Register here
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
