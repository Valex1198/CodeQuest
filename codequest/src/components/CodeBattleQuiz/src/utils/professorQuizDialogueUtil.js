// professorQuizDialogueUtil.js
import Phaser from "phaser";
import { getSave } from "./saveManager";

/**
 * Opens a Professor Quiz dialogue overlay
 * Now uses a separate scene to ensure consistent 1:1 scaling (matching professorDialogUtil)
 */
export function openProfessorQuizDialogue(parentScene, data) {
  const sceneKey = "ProfessorQuizDialogUIScene";

  // Add the scene if it doesn't exist
  if (!parentScene.scene.get(sceneKey)) {
    parentScene.scene.add(sceneKey, ProfessorQuizDialogUIScene, false);
  }

  // Pause parent and launch UI
  parentScene.scene.pause(parentScene.scene.key);
  parentScene.scene.launch(sceneKey, {
    ...data,
    parentScene: parentScene.scene.key,
  });
}

class ProfessorQuizDialogUIScene extends Phaser.Scene {
  constructor() {
    super({ key: "ProfessorQuizDialogUIScene" });
  }

  async create(data) {
    const { width, height } = this.scale;
    const { slot, language, quizData = {}, onLevelSelect, parentScene } = data;

    // -----------------------------
    // Overlay rectangle
    // -----------------------------
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1000);

    // Dialogue box - Exact same dimensions and logic as CodingGame's dialog
    const boxWidth = Math.min(420, width * 0.9);
    const boxHeight = Math.min(320, height * 0.8);

    const html = `
      <div class="phaser-dom" style="
        width:${boxWidth}px;
        height:${boxHeight}px;
        box-sizing:border-box;
        background:rgba(0,0,0,0.9);
        border:2px solid white;
        border-radius:8px;
        padding:12px;
        font-family:'Press Start 2P';
        color:white;
        display:flex;
        flex-direction:column;
      ">
        <div style="color:#ffff00;text-align:center;font-size:12px;margin-bottom:8px;">
          👋 Welcome to the Quiz Lab
        </div>
        <div id="levels" style="flex:1;overflow-y:auto;"></div>
        <div style="font-size:8px;text-align:center;opacity:0.6;">
          ENTER to close
        </div>
      </div>
    `;

    const dom = this.add.dom(width / 2, height / 2)
      .createFromHTML(html)
      .setOrigin(0.5)
      .setDepth(1001);

    // Load completed quiz data from save
    const user = JSON.parse(localStorage.getItem("user")) || { id: 1 };
    const save = await getSave(user.id, slot);
    const completed = save?.quiz?.[language] || {};

    const list = dom.getChildByID("levels");

    for (let i = 1; i <= 10; i++) {
      const lvlData = completed[String(i)] || { completed: false, score: 0 };

      const unlocked =
        i === 1 || 
        completed[String(i)]?.completed === true || 
        completed[String(i-1)]?.completed === true;

      const btn = document.createElement("div");
      btn.textContent = `LEVEL ${i}${lvlData.completed ? ` ✓ (${lvlData.score || 0})` : ""}`;
      btn.style.padding = "6px";
      btn.style.marginBottom = "4px";
      btn.style.fontSize = "9px";
      btn.style.textAlign = "center";
      btn.style.borderRadius = "4px";
      btn.style.cursor = unlocked ? "pointer" : "default";
      btn.style.color = unlocked ? "#00ff00" : "#777";
      btn.style.background = unlocked
        ? "rgba(0,255,0,0.15)"
        : "rgba(255,255,255,0.05)";

      if (unlocked) {
        btn.onclick = () => {
          overlay.destroy();
          dom.destroy();
          this.scene.stop();
          // We resume parent or let parent handle launch
          if (onLevelSelect) onLevelSelect(i, quizData);
        };
      }

      list.appendChild(btn);
    }

    const closeUI = () => {
      overlay.destroy();
      dom.destroy();
      this.scene.stop();
      this.scene.resume(parentScene);
    };

    this.input.keyboard.once("keydown-ENTER", closeUI);
  }
}
