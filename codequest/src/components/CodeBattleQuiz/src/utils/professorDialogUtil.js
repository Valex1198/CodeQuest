import Phaser from "phaser";
import { getSave } from "./saveManager";

export function openProfessorDialog(parentScene, data) {
  const sceneKey = "ProfessorDialogUIScene";

  if (!parentScene.scene.get(sceneKey)) {
    parentScene.scene.add(sceneKey, ProfessorDialogUIScene, false);
  }

  parentScene.scene.pause(parentScene.scene.key);

  parentScene.scene.launch(sceneKey, {
    ...data,
    parentScene: parentScene.scene.key,
  });
}

class ProfessorDialogUIScene extends Phaser.Scene {
  constructor() {
    super({ key: "ProfessorDialogUIScene" });
  }

  async create(data) {
    const { width, height } = this.scale;
    const { slot, language, parentScene } = data;

    // -----------------------------
    // Overlay rectangle
    // -----------------------------
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1000);

    const boxWidth = Math.min(420, width * 0.9);
    const boxHeight = Math.min(320, height * 0.8);

    // -----------------------------
    // Dialogue HTML
    // -----------------------------
    const html = `
      <div class="phaser-dom" style="
        width:${boxWidth}px;
        height:${boxHeight}px;
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
          👋 Welcome to the Coding Lab
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

    // -----------------------------
    // Load save data
    // -----------------------------
    const user = JSON.parse(localStorage.getItem("user")) || { id: 1 };
    const save = await getSave(user.id, slot);
    const completed = save?.codingTasks?.[language] || {};

    const list = dom.getChildByID("levels");

    // -----------------------------
    // Generate level buttons
    // -----------------------------
    for (let i = 1; i <= 10; i++) {
      const lvlData = completed[i] || { completed: false, score: 0 };
      
      // Fixed logic: Unlock if it's Level 1, if it's already completed (replay), 
      // or if the previous level was completed.
      const unlocked = 
        i === 1 || 
        completed[i]?.completed === true || 
        completed[i-1]?.completed === true;

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
          // Destroy overlay & DOM before launching CodingGameScene
          overlay.destroy();
          dom.destroy();

          this.scene.stop();
          this.scene.start("CodingGameScene", {
            loadSlot: slot,
            language,
            startingLevel: i,
          });
          this.scene.bringToTop("CodingGameScene");
        };
      }

      list.appendChild(btn);
    }

    // -----------------------------
    // ENTER to close
    // -----------------------------
    const enterListener = () => {
      overlay.destroy();
      dom.destroy();
      this.scene.stop();
      this.scene.resume(parentScene);
    };

    this.input.keyboard.once("keydown-ENTER", enterListener);
    }
    }