import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Main from "./pages/Main";
import Jgames from "./pages/java/Jgames";
import Java1 from "./pages/java/Java1";
import Java2 from "./pages/java/Java2";
import JHome1 from "./pages/java/JHome1";

import { useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { User, LogOut } from "lucide-react"; // icons

// Navbar component
function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/"); // Redirect to Home page
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <nav className="bg-black text-white p-4 shadow-lg">
      <ul className="flex items-center justify-between w-full">
        {/* Left links */}
        <div className="flex space-x-6">
          <li>
            <Link
              to="/"
              className="hover:text-gray-400 font-semibold transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="hover:text-gray-400 font-semibold transition-colors"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="hover:text-gray-400 font-semibold transition-colors"
            >
              Contact
            </Link>
          </li>
        </div>

        {/* Right profile / auth section */}
        <div className="flex items-center space-x-4 relative dropdown-container">
          {user ? (
            <>
              {/* Show Admin button if user is admin */}
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded font-semibold transition"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white focus:outline-none"
              >
                <img
                  src={user?.avatar || "/profile-icon.png"} // dynamic user avatar
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-gray-800 text-white rounded-xl shadow-lg overflow-hidden text-sm z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 font-medium hover:bg-green-600 transition-colors duration-200"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} /> Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 font-medium hover:bg-red-600 transition-colors duration-200"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="hover:text-gray-400 font-semibold transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </ul>
    </nav>
  );
}

// Main App content
function AppContent() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = true;
  }, []);

  return (
    <>
      {/* Background music */}
      <audio ref={audioRef} src="/background.mp4" />

      {/* Music toggle button */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 z-50 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full shadow-lg transition"
      >
        {isPlaying ? "🎵" : "🔇"}
      </button>

      {/* Navbar */}
      <Navbar />

      {/* Page routes */}
      <div className="bg-gray-900 text-white min-h-screen p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/main" element={<Main />} />
          <Route path="/Jgames" element={<Jgames />} />
          <Route path="/java1" element={<Java1 />} />
          <Route path="/java2" element={<Java2 />} />
          <Route path="/jhome1" element={<JHome1 />} />
        </Routes>
      </div>
    </>
  );
}

// App wrapper
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
