import { Link } from "react-router-dom";

export default function Jgames() {
  const games = [
    { id: 1, name: "Typing Catcher", desc: "Type falling words before they hit the ground." },
    { id: 2, name: "Code Battle Quiz", desc: "Fight bugs with quiz-powered attacks." },
    { id: 3, name: "Syntax Survivor", desc: "Battle with syntax logic (Rock-Paper-Scissors style)." },
    { id: 4, name: "Debug Tic-Tac-Toe", desc: "Classic tic-tac-toe, but powered by code questions." },
    { id: 5, name: "Code Hangman", desc: "Guess programming terms one letter at a time." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-center text-yellow-400 animate-pulse">
        Java Mini Games
      </h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-gray-800 rounded-3xl shadow-2xl p-6 flex flex-col justify-between transform hover:scale-105 transition-transform duration-300 border-4 border-purple-600 hover:border-yellow-400"
          >
            <div>
              <h2 className="text-2xl font-bold text-indigo-300 mb-2">{game.name}</h2>
              <p className="text-gray-400">{game.desc}</p>
            </div>
            {game.id === 1 ? (
              <Link
                to="/jhome1"
                className="mt-6 w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-center font-semibold shadow-lg"
              >
                Play
              </Link>
            ) : game.id === 2 ? (
              <Link
                to="/java2"
                className="mt-6 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-center font-semibold shadow-lg"
              >
                Play
              </Link>
            ) : (
              <button
                disabled
                className="mt-6 w-full py-3 rounded-xl bg-gray-600 text-gray-300 cursor-not-allowed font-semibold"
              >
                Coming Soon
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
