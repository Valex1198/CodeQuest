export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-6 py-12 flex justify-center">
      <div className="max-w-4xl w-full">

        {/* Title */}
        <h1 className="text-5xl font-extrabold mb-6 text-center text-yellow-400">
          About CodeQuest
        </h1>

        {/* Intro */}
        <p className="text-lg text-gray-300 mb-8 text-center">
          CodeQuest is a game-based learning web application designed to make
          programming fun, interactive, and accessible for beginners.
        </p>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">

          <section>
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">
              🎮 What is CodeQuest?
            </h2>
            <p className="text-gray-300 leading-relaxed">
              CodeQuest combines quizzes, mini-games, and interactive challenges
              to help learners understand the fundamentals of programming.
              Instead of traditional lectures, players learn by playing,
              solving problems, and progressing through game-like experiences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              🧠 Learning Approach
            </h2>
            <p className="text-gray-300 leading-relaxed">
              The game uses gamification techniques such as levels, instant
              feedback, and challenges to reinforce key programming concepts.
              Players can practice logic, syntax, and problem-solving skills
              in an engaging environment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-2">
              💻 Supported Languages
            </h2>
            <p className="text-gray-300 leading-relaxed">
              CodeQuest supports multiple programming languages, including
              <span className="font-semibold text-white"> Java</span>,
              <span className="font-semibold text-white"> C++</span>, and
              <span className="font-semibold text-white"> Python</span>.
              Language selection happens inside the game to keep the experience
              immersive and flexible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              🎓 Purpose
            </h2>
            <p className="text-gray-300 leading-relaxed">
              This project was developed as an educational tool and academic
              project to demonstrate how game-based learning can improve
              motivation and understanding in programming education.
            </p>
          </section>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-10">
          © {new Date().getFullYear()} CodeQuest — Learn by Playing
        </p>
      </div>
    </div>
  );
}
