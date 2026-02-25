import { useState } from "react";
import CodeBattleQuiz from "../components/CodeBattleQuiz/CBQ";

export default function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">

        {/* 🌌 Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-black animate-gradient"></div>

        {/* 🟣 Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full opacity-30 blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600 rounded-full opacity-30 blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-600 rounded-full opacity-20 blur-3xl animate-float-slower"></div>

        {/* 🧠 Grid Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* 🎮 Title Content */}
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse">
            CodeQuest
          </h1>

          <p className="text-xl text-gray-300 mb-12">
            A fun, game-based way to learn programming through quizzes,
            challenges, and mini-games.
          </p>

          <button
            onClick={() => setStarted(true)}
            className="px-14 py-5 text-2xl font-bold rounded-2xl 
                       bg-gradient-to-r from-green-400 to-emerald-500 
                       hover:scale-110 transition-transform duration-300
                       shadow-[0_0_40px_rgba(0,255,150,0.8)]"
          >
            ▶ Start Adventure
          </button>

          <p className="mt-6 text-gray-400 text-sm">
            Press Start to begin your quest
          </p>
        </div>
      </div>
    );
  }

  // 🎯 Game Launch
  return <CodeBattleQuiz />;
}
