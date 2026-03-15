// playerLoader.js
import { createPlayer } from "./player";
import { getSave, setSave } from "./saveManager";

export async function loadPlayer(scene, data, defaultX, defaultY) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id || 1;
  const slotId = data?.loadSlot || 1;

  // Get existing save
  let saveData = await getSave(userId, slotId);

  if (!saveData) {
    saveData = {
      scene: scene.scene.key,
      x: defaultX,
      y: defaultY,
      date: new Date().toLocaleDateString(),
      language: "Python", // default language
    };
    await setSave(
      userId,
      slotId,
      { scene: { key: scene.scene.key } },
      { x: defaultX, y: defaultY },
      "Python"
    );
  }

  // Create player
  let player = null;
  try {
    player = createPlayer(scene, saveData.x, saveData.y);
  } catch (err) {
    console.error("Failed to create player:", err);
  }

  if (!player) {
    console.error("Player undefined! Using default position.");
    player = createPlayer(scene, defaultX, defaultY);
  }

  // Dynamically import the JSON based on language
  let quizData = null;
  try {
    switch (saveData.language) {
      case "Java":
        quizData = (await import("../assets/JavaQuestions.json")).default;
        break;
      case "C++":
        quizData = (await import("../assets/C++Questions.json")).default;
        break;
      case "Python":
      default:
        quizData = (await import("../assets/PythonQuestions.json")).default;
        break;
    }
  } catch (err) {
    console.error("Failed to load quiz data:", err);
  }

  // Sync inventory and flags with save data
  const user = JSON.parse(localStorage.getItem("user")) || {};
  user.inventory = saveData.inventory || [];
  user.flags = saveData.flags || {};
  user.currentSlot = slotId;
  localStorage.setItem("user", JSON.stringify(user));

  return {
    player,
    slot: slotId,
    saveData,
    language: saveData.language || "Python",
    quizData,
  };
}
