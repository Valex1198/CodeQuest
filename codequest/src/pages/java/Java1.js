import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const javaSyntax = [
  "public", "class", "static", "void", "int",
  "String", "new", "return", "if", "else",
  "while", "for", "boolean", "true", "false"
];

function Java1() {
  const { user } = useAuth();

  const formattedDate = user?.date_created
    ? new Date(user.date_created).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "N/A";

  const [falling, setFalling] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(10);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [explodingIds, setExplodingIds] = useState([]);
  const [flashIds, setFlashIds] = useState([]);
  const [borderGlow, setBorderGlow] = useState("");
  const [combo, setCombo] = useState(0);
  const [comboWord, setComboWord] = useState("");
  const [floatingScores, setFloatingScores] = useState([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const randomLetter = () => {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
};

    const getGlitchCount = (score) => {
      if (score >= 500) return 3;
      if (score >= 400) return 2;
      if (score >= 300) return 1;
      return 0;
    };

    const pickRandomIndices = (word, count) => {
      const indices = [];
      while (indices.length < count) {
        const rand = Math.floor(Math.random() * word.length);
        if (!indices.includes(rand)) indices.push(rand);
      }
      return indices;
    };

  const [glitchLetters, setGlitchLetters] = useState({}); 
// { [fallingItemId]: [indices] } to track which letters glitch per word

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [streakGlow, setStreakGlow] = useState("");

  const gameAreaRef = useRef(null);
  const fallingRef = useRef([]);
  const comboRef = useRef(0);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  const maxLives = 10;
  const maxComboTier = 20;

  const comboWords = [
    { word: "ok", min: 1, max: 2, class: "combo-yellow" },
    { word: "nice!", min: 3, max: 5, class: "combo-orange" },
    { word: "great!", min: 6, max: 8, class: "combo-green" },
    { word: "awesome!!", min: 9, max: 11, class: "combo-blue" },
    { word: "epic!!!", min: 12, max: 14, class: "combo-purple" },
    { word: "INSANE!!!", min: 15, max: 17, class: "combo-fire" },
    { word: "WTF!?!?", min: 18, max: maxComboTier, class: "combo-rainbow" }
  ];

  const getComboEntry = (count) => {
    if (count > maxComboTier) return comboWords[comboWords.length - 1];
    return comboWords.find(c => count >= c.min && count <= c.max);
  };

  const saveScoreToDirectus = async () => {
    if (!user) return;
    try {
      const headers = { "Content-Type": "application/json" };
      if (user.token) headers.Authorization = `Bearer ${user.token}`;

      const res = await fetch(`http://localhost:8055/items/java1_scores?filter[user_id][_eq]=${user.id}`, { headers });
      const data = await res.json();
      const existing = data?.data?.[0];

      if (existing) {
        await fetch(`http://localhost:8055/items/java1_scores/${existing.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            score: Math.max(score, existing.score),
            correct_answers: Math.max(correctAnswers, existing.correct_answers),
            wrong_answers: Math.max(wrongAnswers, existing.wrong_answers),
            streak: Math.max(maxStreak, existing.streak),
            games_played: existing.games_played + 1
          }),
        });
      } else {
        await fetch(`http://localhost:8055/items/java1_scores`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: user.id,
            score,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            streak: maxStreak,
            games_played: 1
          }),
        });
      }
    } catch (error) {
      console.error("❌ Error saving score:", error);
    }
  };

  useEffect(() => { if (gameOver) saveScoreToDirectus(); }, [gameOver]);

  const startGame = () => {
    setFalling([]);
    setScore(0);
    setLives(maxLives);
    setInput("");
    setGameOver(false);
    setRunning(true);
    setBorderGlow("");
    setCombo(0);
    setComboWord("");
    setFloatingScores([]);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setStreak(0);
    setMaxStreak(0);
    setStreakGlow("");
    setGamesPlayed(g => g + 1);
    fallingRef.current = [];
    setSpeedMultiplier(1);
  };

  // Spawn words
  useEffect(() => {
    if (!running || gameOver) return;
    const spawnInterval = setInterval(() => {
      const isBonus = Math.random() < 0.2;
      const word = isBonus ? "BONUS" : javaSyntax[Math.floor(Math.random() * javaSyntax.length)];
      const newItem = { id: Date.now() + Math.random(), text: word, top: 0, left: Math.random() * 80, progress: "", bonus: isBonus };
      fallingRef.current.push(newItem);
      setFalling([...fallingRef.current]);
    }, 2000);
    return () => clearInterval(spawnInterval);
  }, [running, gameOver]);

  // Animate falling with difficulty scaling
  // Animate falling with difficulty scaling + glitch
// Inside your "Animate falling with difficulty scaling + glitch" useEffect
useEffect(() => {
  if (!running || gameOver) return;

  const fallInterval = setInterval(() => {
    const extraSpeed = Math.floor(score / 150) * 0.5; // +0.5 every 150 points
    setSpeedMultiplier(1 + extraSpeed);
    const currentSpeed = 1 + extraSpeed;

    fallingRef.current = fallingRef.current.map(item => {
      // Compute glitch count and clamp to max letters available
      let glitchCount = getGlitchCount(score);
      const maxAvailable = Math.max(item.text.length - 1, 0); // exclude first letter
      glitchCount = Math.min(glitchCount, maxAvailable);

      // Pick which indices will glitch for this word
      let indices = glitchLetters[item.id];
      if (!indices) {
        indices = pickRandomIndices(item.text.slice(1), glitchCount).map(i => i + 1);
        setGlitchLetters(prev => ({ ...prev, [item.id]: indices }));
      }

      // Build display text safely
      const displayText = (item.text || "").split("").map((char, idx) => {
        if (idx === 0) return char; // always first letter
        if (indices.includes(idx)) return randomLetter(); // glitch letters
        return char;
      }).join("");

      // Slight left/right flicker effect
      const glitchChance = Math.min(0.05 + score / 1000, 0.3);
      let newLeft = item.left;
      let isGlitching = false;
      if (Math.random() < glitchChance) {
        const glitchAmount = (Math.random() - 0.5) * 6; // shift -3 to +3 %
        newLeft = Math.min(Math.max(item.left + glitchAmount, 0), 95);
        isGlitching = true;
      }

      return { ...item, top: item.top + currentSpeed, left: newLeft, glitch: isGlitching, displayText };
    });

    const gameAreaHeight = gameAreaRef.current?.offsetHeight || 550;

    fallingRef.current = fallingRef.current.filter(item => {
      if (item.top >= gameAreaHeight - 30) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) { setGameOver(true); setRunning(false); }
          return newLives;
        });
        setCombo(0); setComboWord(""); setStreak(0);
        setWrongAnswers(w => w + 1);
        setStreakGlow("fail"); setTimeout(() => setStreakGlow(""), 300);
        return false;
      }
      return true;
    });

    setFalling([...fallingRef.current]);
  }, 50);

  return () => clearInterval(fallInterval);
}, [running, gameOver, score]);

  



  // Typing input logic (CASE-SENSITIVE)
  useEffect(() => {
    if (!running || gameOver) return;

    const handleKeyDown = (e) => {
      if (e.key === "Backspace") { setInput(prev => prev.slice(0, -1)); return; }
      if (e.key.length === 1) {
        const key = e.key;
        const firstWord = fallingRef.current.sort((a, b) => a.id - b.id)[0];
        if (!firstWord) return;
        const newProgress = firstWord.progress + key;

        if (firstWord.text.startsWith(newProgress)) {
          fallingRef.current = fallingRef.current.map(w => w.id === firstWord.id ? { ...w, progress: newProgress } : w);
          if (newProgress === firstWord.text) {
            const completedId = firstWord.id;
            setInput(""); setExplodingIds(prev => [...prev, completedId]);
            setBorderGlow("success"); setTimeout(() => setBorderGlow(""), 300);

            if (firstWord.bonus) setLives(l => Math.min(l + 1, maxLives));
            setCorrectAnswers(c => c + 1);
            setStreak(s => { const newS = s + 1; setMaxStreak(m => Math.max(m, newS)); setStreakGlow("success"); setTimeout(() => setStreakGlow(""), 300); return newS; });

            const nextCombo = comboRef.current + 1;
            const entry = getComboEntry(nextCombo);
            setCombo(nextCombo); setComboWord(entry?.word || "");
            const earned = 1 * nextCombo;
            setFloatingScores(prev => [...prev, { id: Date.now(), x: firstWord.left, y: firstWord.top, value: `+${earned}` }]);
            setScore(s => s + earned);

            setTimeout(() => {
              fallingRef.current = fallingRef.current.filter(w => w.id !== completedId);
              setFalling([...fallingRef.current]);
              setExplodingIds(prev => prev.filter(id => id !== completedId));
            }, 500);
          }
          setInput(newProgress); setFalling([...fallingRef.current]);
        } else {
          setInput(""); setFlashIds(prev => [...prev, firstWord.id]); setCombo(0); setComboWord("");
          setBorderGlow("fail"); setTimeout(() => setBorderGlow(""), 300);
          setWrongAnswers(w => w + 1); setStreak(0); setStreakGlow("fail"); setTimeout(() => setStreakGlow(""), 300);
          setLives(l => { const newL = l - 0.5; if (newL <= 0) { setGameOver(true); setRunning(false); } return newL; });
          setTimeout(() => setFlashIds(prev => prev.filter(id => id !== firstWord.id)), 200);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [running, gameOver]);

  const healthPercent = (lives / maxLives) * 100;
  const healthColor = healthPercent > 66 ? "#00ff00" : healthPercent > 33 ? "#ffff00" : "#ff0000";
  const healthGlow = healthPercent > 66
    ? "0 0 8px rgba(0,255,0,0.7) inset, 0 0 10px rgba(0,255,0,0.9)"
    : healthPercent > 33
    ? "0 0 8px rgba(255,255,0,0.7) inset, 0 0 10px rgba(255,255,0,0.9)"
    : "0 0 12px rgba(255,0,0,0.8) inset, 0 0 14px rgba(255,0,0,1)";
  const comboEntry = combo > 0 ? getComboEntry(combo) : null;

  return (
    <div className="flex flex-row items-start justify-center min-h-screen bg-gray-900 text-white p-6">
      {/* Stats panel */}
      <div className="w-64 p-4 space-y-4 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold">Player Stats</h2>
        <div className="flex flex-col items-center">
          <img src={user?.avatar || "/avatars/avatar1.png"} alt="Player avatar" className="w-20 h-20 rounded-full border-2 border-white object-cover mb-2" />
          <p className="font-semibold">{user?.username || "Guest"}</p>
          <p className="text-xs text-gray-400">{user?.email || "No email"}</p>
          <p className="text-xs text-gray-400">{user?.role || "Player"}</p>
          <p className="text-xs text-gray-400">Joined: {formattedDate}</p>
          <Link to="/profile" className="mt-2 text-sm text-blue-400 hover:underline">View Profile</Link>
        </div>

        <p>🏆 Score: {score}</p>
        <p>✅ Correct: {correctAnswers}</p>
        <p>❌ Wrong: {wrongAnswers}</p>
        <p className={`flex items-center gap-2 ${streakGlow === "success" ? "streak-success" : streakGlow === "fail" ? "streak-fail" : ""}`}>
          🔥 Streak: <span className="font-bold">{streak}</span>
        </p>
        <p>🎮 Games Played: {gamesPlayed}</p>
        <p>⚡ Speed: x{speedMultiplier.toFixed(1)}</p>

        <div className="flex flex-col gap-2">
  {!running && !gameOver && (
    <>
      <button 
        onClick={startGame} 
        className="px-3 py-1 bg-green-500 rounded-lg text-white font-bold w-full"
      >
        Start
      </button>

      {/* Go Back Button below Start */}
      <Link 
        to="/jhome1" 
        className="px-3 py-1 bg-blue-500 rounded-lg text-white font-bold w-full text-center hover:bg-blue-600"
      >
        Go Back
      </Link>
    </>
  )}

  {running && (
    <>
      <button 
        onClick={() => { setRunning(false); setGameOver(true); }} 
        className="px-3 py-1 bg-red-500 rounded-lg text-white font-bold w-full"
      >
        End
      </button>

      {/* Go Back Button below End */}
        <Link 
          to="/jhome1" 
          className="px-3 py-1 bg-blue-500 rounded-lg text-white font-bold w-full text-center hover:bg-blue-600"
        >
          Go Back
        </Link>

    </>
  )}
</div>

      </div>

      

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Java Syntax Falling Game</h1>
        <p className="mb-2">Type the Java syntax before it hits the ground!</p>
        <p className="text-lg mb-2">Score: {score}</p>

        <div className="w-64 h-6 bg-gray-700 rounded-lg mb-4 overflow-hidden relative border-2 border-gray-500">
          <div
            className={`h-full rounded-lg transition-all duration-300 ${healthPercent <= 33 ? "pulse-glow" : ""}`}
            style={{ width: `${healthPercent}%`, background: healthColor, boxShadow: healthGlow }}
          />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-white font-bold text-sm pointer-events-none">
            {lives}/{maxLives}
          </div>
        </div>

        <p className="mb-4 text-yellow-300">Your Input: {input}</p>

        {gameOver && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl text-red-400 font-bold mb-2">Game Over</h2>
            <p className="mb-4">Final Score: {score}</p>
            <button onClick={startGame} className="px-6 py-2 bg-blue-500 rounded-lg text-white font-bold">Restart</button>
          </div>
        )}

        <div
          ref={gameAreaRef}
          className={`relative w-[700px] h-[550px] rounded-lg overflow-hidden mt-6 transition-all duration-300
            ${borderGlow === "success" ? "border-neon-blue shadow-neon-blue" :
              borderGlow === "fail" ? "border-neon-red shadow-neon-red" :
              combo >= maxComboTier ? "border-rainbow-rave" :
              "border-white border-4"} bg-black`}
        >
          {comboEntry && (
            <div className="absolute top-3 right-3 combo-tilt">
              <div className={`text-2xl font-bold combo-badge ${comboEntry.class}`}>
                (x{combo} {comboEntry.word})
              </div>
            </div>
          )}

          {falling.map(item => (
            <div
              key={item.id}
              className={`absolute text-xl font-bold transition-all duration-100
                ${explodingIds.includes(item.id) ? "animate-explode" : ""} 
                ${flashIds.includes(item.id) ? "flash-red" : ""} 
                ${item.bonus ? "bonus-glow" : ""} 
                ${item.glitch ? "flicker-glitch" : ""}`}
              style={{ top: `${item.top}px`, left: `${item.left}%` }}
            >
              <span className="text-green-400">{item.progress}</span>
              <span>{(item.displayText || item.text).slice(item.progress.length)}</span>
            </div>
          ))}


          {floatingScores.map(fs => (
            <div
              key={fs.id}
              className="absolute text-green-400 font-bold animate-float-score"
              style={{ top: `${fs.y}px`, left: `${fs.x}%` }}
              onAnimationEnd={() => setFloatingScores(prev => prev.filter(p => p.id !== fs.id))}
            >
              {fs.value}
            </div>
          ))}
        </div>

        {/* Styles */}
        <style>{`

          @keyframes glitchFlicker {
            0%, 100% { opacity: 1; }
            25%, 75% { opacity: 0.4; }
            50% { opacity: 0.6; }
          }
          .flicker-glitch {
            animation: glitchFlicker 0.1s linear infinite;
          }
          
          .glitch-letter {
            color: white;
            text-shadow: 0 0 8px white, 0 0 12px white;
            font-weight: bold;
          } 

          @keyframes explode { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.7; } 100% { transform: scale(0); opacity: 0; } }
          .animate-explode { animation: explode 0.5s forwards; color: red; }
          @keyframes flash { 0%,100% { color: green; } 50% { color: red; } }
          .flash-red { animation: flash 0.2s; }
          @keyframes pulse { 0%,100% { box-shadow: 0 0 12px rgba(255,0,0,0.8) inset, 0 0 14px rgba(255,0,0,1); } 50% { box-shadow: 0 0 20px rgba(255,0,0,1) inset, 0 0 25px rgba(255,0,0,1); } }
          .pulse-glow { animation: pulse 1s infinite; }
          @keyframes bonus { 0%,100% { text-shadow: 0 0 8px gold, 0 0 12px orange; } 50% { text-shadow: 0 0 16px gold, 0 0 24px orange; } }
          .bonus-glow { animation: bonus 1s infinite; color: gold; }
          .combo-tilt { transform: rotate(-15deg); transform-origin: 100% 0%; }
          .combo-badge { animation: comboGrow 0.8s ease-in-out infinite; }
          @keyframes comboGrow { 0%,100% { transform: scale(1); } 50% { transform: scale(1.25); } }
          .combo-yellow { color: yellow; text-shadow: 0 0 8px yellow; }
          .combo-orange { color: orange; text-shadow: 0 0 8px orange; }
          .combo-green  { color: #00ff7f; text-shadow: 0 0 8px #00ff7f; }
          .combo-blue   { color: #00bfff; text-shadow: 0 0 8px #1e90ff; }
          .combo-purple { color: #ba55d3; text-shadow: 0 0 12px #9400d3; }
          @keyframes fire { 0%,100% { color: #ff4500; text-shadow: 0 0 15px #ff6347; } 50% { color: #ffff00; text-shadow: 0 0 20px #ffa500; } }
          .combo-fire { animation: comboGrow 0.8s ease-in-out infinite, fire 0.7s infinite; }
          @keyframes rainbow { 0% { color: red; } 20% { color: orange; } 40% { color: yellow; } 60% { color: lime; } 80% { color: cyan; } 100% { color: magenta; } }
          .combo-rainbow { animation: comboGrow 0.8s ease-in-out infinite, rainbow 1.2s linear infinite; }
          @keyframes floatScore { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
          .animate-float-score { animation: floatScore 1s forwards; }
          .border-neon-blue { border: 4px solid #8A2BE2; box-shadow: 0 0 10px #8A2BE2, 0 0 20px #00FFFF; }
          .border-neon-red  { border: 4px solid #8B0000; box-shadow: 0 0 10px #8B0000, 0 0 20px #FF0000; }
          @keyframes borderRainbow { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
          .border-rainbow-rave { position: relative; border-radius: 12px; z-index: 0; }
          .border-rainbow-rave::before { content: ""; position: absolute; inset: 0; padding: 4px; border-radius: inherit; background: linear-gradient(270deg, red, orange, yellow, lime, cyan, magenta, red); background-size: 600% 600%; animation: borderRainbow 4s linear infinite; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; z-index: -1; }
          .streak-success { color: #dbeafe; text-shadow: 0 0 8px #8A2BE2, 0 0 16px #7c3aed; }
          .streak-fail    { color: #ffdede; text-shadow: 0 0 8px #ff4500, 0 0 16px #ff0000; }
        `}</style>
      </div>
    </div>
  );
}

export default Java1;
