import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../AuthContext";

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden px-6">

      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-black animate-gradient"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600 rounded-full opacity-30 blur-3xl animate-float"></div>
      <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-pink-600 rounded-full opacity-20 blur-3xl animate-float-slower"></div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-3xl">

        {/* Video Banner */}
        <div className="w-full max-w-5xl aspect-[16/5] mb-8 relative mx-auto rounded-2xl overflow-hidden shadow-2xl">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/loading.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse">
          CodeQuest
        </h1>

        {/* Welcome Message */}
        <p className="mb-8 text-lg text-gray-300">
          {user
            ? `Welcome back, ${user.username}! 🚀`
            : "Welcome to CodeQuest — learn programming by playing games! 🎮"}
        </p>

        {/* Buttons */}
        <div className="flex justify-center space-x-4">
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-8 py-3 bg-blue-500 rounded-2xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 bg-green-500 rounded-2xl hover:bg-green-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Register
              </Link>
            </>
          ) : (
            <Link
              to="/main"
              className="px-8 py-3 bg-purple-500 rounded-2xl hover:bg-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Explore
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-gray-500 text-sm w-full text-center">
        CodeQuest — Learn by Playing 🎓
      </p>
    </div>
  );
}
