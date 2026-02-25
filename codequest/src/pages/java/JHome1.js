import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";

function Java1Home() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [statsMap, setStatsMap] = useState({});

  useEffect(() => {
    if (!user) return;

    async function fetchLeaderboard() {
      try {
        const res = await fetch(
          `http://localhost:8055/items/java1_scores?fields=*,user_id.id,user_id.username,user_id.avatar&sort[]=-score&limit=50`
        );
        const data = await res.json();

        if (data?.data) {
          setLeaderboard(data.data.slice(0, 10)); // Top 10

          const map = {};
          data.data.forEach(entry => {
            const uid = entry.user_id?.id;
            if (!uid) return;

            if (!map[uid]) {
              map[uid] = {
                highestScore: 0,
                highestCorrect: 0,
                highestWrong: 0,
                maxStreak: 0,
                gamesPlayed: 0,
                avatar: entry.user_id.avatar || "/avatars/avatar1.png",
                username: entry.user_id.username || "Unknown",
              };
            }

            map[uid].highestScore = Math.max(map[uid].highestScore, entry.score || 0);
            map[uid].highestCorrect = Math.max(map[uid].highestCorrect, entry.correct_answers || 0);
            map[uid].highestWrong = Math.max(map[uid].highestWrong, entry.wrong_answers || 0);
            map[uid].maxStreak = Math.max(map[uid].maxStreak, entry.streak || 0);

            // Use games_played directly from entry
            map[uid].gamesPlayed = Math.max(map[uid].gamesPlayed, entry.games_played || 0);
          });

          setStatsMap(map);
          setSelectedUserId(user.id); // default to logged-in user
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [user]);

  const selectedUserStats = statsMap[selectedUserId] || {
    highestScore: 0,
    highestCorrect: 0,
    highestWrong: 0,
    maxStreak: 0,
    gamesPlayed: 0,
    avatar: "/avatars/avatar1.png",
    username: "Unknown",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white p-6">
      <h1 className="text-5xl font-extrabold mb-8 text-center neon-text">
        Java1 Game Hub
      </h1>

      <div className="flex flex-1 gap-8">
        {/* Leaderboard */}
        <div className="w-1/3 bg-gray-800 rounded-xl p-6 border-4 border-purple-600 shadow-neon overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6 text-center neon-text">Leaderboard</h2>
          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-gray-400">No scores yet.</p>
          ) : (
            leaderboard.map((entry, idx) => {
              const uid = entry.user_id?.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 mb-3 rounded-lg cursor-pointer ${
                    idx === 0 ? "bg-yellow-500 text-black font-bold shadow-md" : "bg-gray-700"
                  } hover:bg-purple-700 transition`}
                  onClick={() => uid && setSelectedUserId(uid)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={entry.user_id?.avatar || "/avatars/avatar1.png"}
                      alt={entry.user_id?.username || "User avatar"}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <span>{entry.user_id?.username || "Unknown"}</span>
                  </div>
                  <span>{entry.score}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Stats Panel */}
        <div className="w-2/3 bg-gray-800 rounded-xl p-8 border-4 border-blue-500 shadow-neon flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold neon-text">{selectedUserStats.username}'s Stats</h2>

          <div className="flex flex-col items-center mb-4">
            <img
              src={selectedUserStats.avatar || "/avatars/avatar1.png"}
              alt={selectedUserStats.username || "Player avatar"}
              className="w-24 h-24 rounded-full border-4 border-white object-cover mb-2"
            />
            <p className="font-bold text-xl">{selectedUserStats.username}</p>
          </div>

          <div className="w-full grid grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 flex flex-col items-center shadow-neon hover:scale-105 transition">
              <span className="text-yellow-400 text-2xl">🏆</span>
              <p className="font-bold">{selectedUserStats.highestScore}</p>
              <p className="text-sm text-gray-300">High Score</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 flex flex-col items-center shadow-neon hover:scale-105 transition">
              <span className="text-green-400 text-2xl">✅</span>
              <p className="font-bold">{selectedUserStats.highestCorrect}</p>
              <p className="text-sm text-gray-300">Max Correct</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 flex flex-col items-center shadow-neon hover:scale-105 transition">
              <span className="text-red-400 text-2xl">❌</span>
              <p className="font-bold">{selectedUserStats.highestWrong}</p>
              <p className="text-sm text-gray-300">Max Wrong</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 flex flex-col items-center shadow-neon hover:scale-105 transition">
              <span className="text-purple-400 text-2xl">🔥</span>
              <p className="font-bold">{selectedUserStats.maxStreak}</p>
              <p className="text-sm text-gray-300">Max Streak</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 flex flex-col items-center shadow-neon hover:scale-105 transition">
              <span className="text-blue-400 text-2xl">🎮</span>
              <p className="font-bold">{selectedUserStats.gamesPlayed}</p>
              <p className="text-sm text-gray-300">Games Played</p>
            </div>
          </div>

          {/* Start Game button */}
          {user && (
            <Link
              to="/java1"
              className="mt-8 px-12 py-4 bg-green-500 rounded-xl font-extrabold text-2xl neon-button hover:neon-hover hover:scale-105 transition"
            >
              Start Game
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .neon-text { text-shadow: 0 0 3px #fff,0 0 10px #8A2BE2,0 0 10px #8A2BE2,0 0 30px #00FFFF; }
        .shadow-neon { box-shadow: 0 0 3px #8A2BE2,0 0 10px #00FFFF,0 0 10px #8A2BE2; }
        .neon-button { text-shadow:0 0 3px #927575ff,0 0 6px #00FF00,0 0 10px #00FF00; box-shadow:0 0 6px #00FF00,0 0 12px #00FF00,0 0 15px #00FF00; }
        .neon-hover { text-shadow:0 0 3px #8b6262ff,0 0 10px #00FF00,0 0 15px #00FF00; box-shadow:0 0 8px #00FF00,0 0 14px #00FF00,0 0 20px #00FF00; }
      `}</style>
    </div>
  );
}

export default Java1Home;
