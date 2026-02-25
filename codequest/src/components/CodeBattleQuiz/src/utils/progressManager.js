// --- progressManager.js ---
// Handles both API calls AND game progress saving

const API_URL = "http://localhost:8055/items/game_saves";

/** =====================
 *  📦 1. Basic API handlers
 * ===================== */
export async function fetchSaves(userId) {
  try {
    const res = await fetch(`${API_URL}?filter[user][_eq]=${userId}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("❌ Failed to fetch saves:", err);
    return [];
  }
}

export async function saveToSlot(userId, slotId, saveData) {
  try {
    // Check if existing record exists (so we PATCH instead of POST)
    const existing = await fetchSaves(userId);
    const record = existing.find((s) => s.slot_id === slotId);

    if (record) {
      await fetch(`${API_URL}/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          save_json: JSON.stringify(saveData),
          updated_on: new Date(),
        }),
      });
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userId,
          slot_id: slotId,
          save_json: JSON.stringify(saveData),
          created_on: new Date(),
        }),
      });
    }

    console.log(`✅ Game saved in slot ${slotId}`);
  } catch (err) {
    console.error("❌ Failed to save slot:", err);
  }
}

export async function clearSaveSlot(userId, slotId) {
  try {
    const existing = await fetchSaves(userId);
    const record = existing.find((s) => s.slot_id === slotId);
    if (record) {
      await fetch(`${API_URL}/${record.id}`, { method: "DELETE" });
    }
  } catch (err) {
    console.error("❌ Failed to clear slot:", err);
  }
}

/** =====================
 *  🕹️ 2. Game logic helpers
 * ===================== */

/**
 * Save the current player's position and scene
 * @param {Phaser.Scene} scene - current Phaser scene
 * @param {Phaser.GameObjects.Sprite} player - player instance
 * @param {number} slotId - save slot number
 */
export async function saveGameProgress(scene, player, slotId = 1) {
  if (!scene || !player) {
    console.warn("⚠️ Missing scene or player for save");
    return;
  }

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id || 1;

  const saveData = {
    scene: scene.scene.key,
    x: player.x,
    y: player.y,
    date: new Date().toLocaleString(),
  };

  await saveToSlot(userId, slotId, saveData);

  // Optional visual feedback
  const text = scene.add.text(player.x, player.y - 50, "💾 Saved!", {
    fontSize: "16px",
    color: "#00ff00",
    stroke: "#000",
    strokeThickness: 3,
  });
  text.setScrollFactor(0).setDepth(1000);

  scene.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 1000,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

/**
 * Load a save slot (returns parsed save_json or null)
 */
export async function loadGameProgress(userId, slotId = 1) {
  const saves = await fetchSaves(userId);
  const record = saves.find((s) => s.slot_id === slotId);
  return record ? JSON.parse(record.save_json) : null;
}
