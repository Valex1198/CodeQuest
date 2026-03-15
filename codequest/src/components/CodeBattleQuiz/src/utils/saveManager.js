// utils/saveManager.js
import { createPlayer } from "./player";

const DIRECTUS_URL = "http://localhost:8055";
const COLLECTION = "game_saves";

// --------------------------------------------------
// Helper: create default quiz structure
// --------------------------------------------------
export function createDefaultQuizSave(languages = ["Python", "C++", "Java"], levels = 5) {
  const quiz = {};
  languages.forEach(lang => {
    quiz[lang] = {};
    for (let i = 1; i <= levels; i++) {
      quiz[lang][i] = { completed: false, score: 0 };
    }
  });
  return quiz;
}

// --------------------------------------------------
// LIST SAVES
// --------------------------------------------------
export async function listSaves(userId, slotCount = 3) {
  try {
    const res = await fetch(`${DIRECTUS_URL}/items/${COLLECTION}?filter[user][_eq]=${userId}`);
    if (!res.ok) throw new Error("Failed to load saves");
    const data = await res.json();
    const saves = [];
    for (let i = 1; i <= slotCount; i++) {
      const slot = data.data.find((s) => s.slot_id === i);
      saves.push(slot ? JSON.parse(slot.save_json) : null);
    }
    return saves;
  } catch {
    const saves = [];
    for (let i = 1; i <= slotCount; i++) {
      const raw = localStorage.getItem(`gameSave_${i}`);
      saves.push(raw ? JSON.parse(raw) : null);
    }
    return saves;
  }
}

// --------------------------------------------------
// GET SAVE
// --------------------------------------------------
export async function getSave(userId, slotId) {
  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/${COLLECTION}?filter[user][_eq]=${userId}&filter[slot_id][_eq]=${slotId}`
    );
    const data = await res.json();
    if (data.data.length === 0) return null;
    return JSON.parse(data.data[0].save_json);
  } catch {
    const raw = localStorage.getItem(`gameSave_${slotId}`);
    return raw ? JSON.parse(raw) : null;
  }
}

// --------------------------------------------------
// CLEAR SAVE
// --------------------------------------------------
export async function clearSave(userId, slotId) {
  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/${COLLECTION}?filter[user][_eq]=${userId}&filter[slot_id][_eq]=${slotId}`
    );
    const data = await res.json();
    if (data.data.length > 0) {
      const recordId = data.data[0].id;
      await fetch(`${DIRECTUS_URL}/items/${COLLECTION}/${recordId}`, { method: "DELETE" });
    }
  } catch {}
  localStorage.removeItem(`gameSave_${slotId}`);
}

// --------------------------------------------------
// SET SAVE
// --------------------------------------------------
export async function setSave(
  userId,
  slotId,
  scene,
  player,
  language = "Python",
  quiz = null,
  codingTasks = null,
  isNewGame = false,
  taxi = null,
  inventory = null,
  flags = null
) {
  const now = new Date();
  const formattedDate = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
    now.getDate()
  ).padStart(2, "0")}/${String(now.getFullYear()).slice(-2)}`;

  let saveData = {};
  try {
    const existing = await getSave(userId, slotId);
    if (existing) saveData = existing;
  } catch {}

  if (scene) saveData.scene = scene.scene.key;
  if (player) {
    saveData.x = player.x;
    saveData.y = player.y;
  }

  // Save taxi position if provided
  if (taxi) {
    saveData.taxi = {
      scene: taxi.scene,
      x: taxi.x,
      y: taxi.y
    };
  }

  saveData.date = formattedDate;
  saveData.language = language;

  // Reset progress and taxi if isNewGame
  if (isNewGame) {
    saveData.quiz = createDefaultQuizSave();
    saveData.codingTasks = {};
    saveData.inventory = [];
    saveData.flags = {};
    saveData.taxi = null; // Ensure taxi is reset to its default Outside location
  } else {
    saveData.quiz = quiz || saveData.quiz || createDefaultQuizSave();
    saveData.codingTasks = codingTasks || saveData.codingTasks || {};
    saveData.inventory = inventory || saveData.inventory || [];
    saveData.flags = flags || saveData.flags || {};
  }

  try {
    const checkRes = await fetch(
      `${DIRECTUS_URL}/items/${COLLECTION}?filter[user][_eq]=${userId}&filter[slot_id][_eq]=${slotId}`
    );
    const checkData = await checkRes.json();

    const payload = { user: userId, slot_id: slotId, save_json: JSON.stringify(saveData) };

    if (checkData.data.length > 0) {
      const recordId = checkData.data[0].id;
      await fetch(`${DIRECTUS_URL}/items/${COLLECTION}/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${DIRECTUS_URL}/items/${COLLECTION}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    localStorage.setItem(`gameSave_${slotId}`, JSON.stringify(saveData));
  }
}


// --------------------------------------------------
// INIT PLAYER
// --------------------------------------------------
export async function initPlayer(scene, data, defaultX, defaultY) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id || 1;
  const slotId = data?.loadSlot || 1;

  let saveData = await getSave(userId, slotId);

  if (!saveData) {
    saveData = {
      scene: scene.scene.key,
      x: defaultX,
      y: defaultY,
      date: new Date().toLocaleDateString(),
      language: "Python",
      quiz: createDefaultQuizSave(),
      codingTasks: {}
    };
    await setSave(userId, slotId, scene, { x: defaultX, y: defaultY }, "Python", null, null, true);
  }

  const player = createPlayer(scene, saveData.x, saveData.y);

  return {
    player,
    slot: slotId,
    saveData,
    language: saveData.language || "Python",
  };
}

// --------------------------------------------------
// UPDATE QUIZ LEVEL PROGRESS
// --------------------------------------------------
export async function updateQuizLevel(userId, slotId, language, level, score) {
  const saveData = await getSave(userId, slotId);
  if (!saveData) return;

  if (!saveData.quiz) saveData.quiz = {};
  if (!saveData.quiz[language]) saveData.quiz[language] = {};

  saveData.quiz[language][level] = { completed: true, score };

  await setSave(userId, slotId, null, null, saveData.language ?? language, saveData.quiz);
}

// --------------------------------------------------
// UPDATE CODING TASK PROGRESS
// --------------------------------------------------
export async function updateCodeTask(userId, slotId, language, level, score, completed) {
  const saveData = await getSave(userId, slotId);
  if (!saveData) return;

  if (!saveData.codingTasks) saveData.codingTasks = {};
  if (!saveData.codingTasks[language]) saveData.codingTasks[language] = {};

  const taskData = saveData.codingTasks[language][level] || { completed: false, score: 0, attempts: 0 };
  taskData.attempts = (taskData.attempts || 0) + 1;
  taskData.score = score;
  taskData.completed = completed;

  saveData.codingTasks[language][level] = taskData;

  await setSave(userId, slotId, null, null, language, null, saveData.codingTasks);
}
