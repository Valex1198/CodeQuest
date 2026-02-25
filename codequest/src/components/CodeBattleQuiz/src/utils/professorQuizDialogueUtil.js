// professorQuizDialogueUtil.js
import Phaser from "phaser";
import { getSave } from "./saveManager";

/**
 * Opens a Professor Quiz dialogue overlay
 * Cleans up DOM & overlay before launching QuizGame
 * @param {Phaser.Scene} parentScene
 * @param {object} data - { slot, language, quizData, onLevelSelect }
 */
export async function openProfessorQuizDialogue(parentScene, data) {
  const { slot, language, quizData = {}, onLevelSelect } = data;

  // Ensure font loaded
  if (!document.fonts.check("12px 'Press Start 2P'")) {
    await document.fonts.load("12px 'Press Start 2P'");
  }

  const cam = parentScene.cameras.main;
  const camCenter = cam.midPoint;

  // Overlay rectangle
  const overlay = parentScene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.6)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(1000);

  // Dialogue box
  const boxWidth = Math.min(420, cam.width * 0.9);
  const boxHeight = Math.min(320, cam.height * 0.8);

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
        ESC to close
      </div>
    </div>
  `;

  const dom = parentScene.add.dom(camCenter.x, camCenter.y)
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
    i === 1 ||                                  // Level 1 always unlocked
    completed[String(i)]?.completed ||          // Allow replay if already completed
    completed[String(i - 1)]?.completed;        // Unlock if previous completed

    const btn = document.createElement("div");
    btn.textContent = `LEVEL ${i}${lvlData.completed ? ` ✓ (${lvlData.score})` : ""}`;
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
        cleanup(); // destroy DOM & overlay before launching QuizGame
        if (onLevelSelect) onLevelSelect(i, quizData);
      };
    }

    list.appendChild(btn);
  }

  function cleanup() {
    overlay?.destroy();
    dom?.destroy();
    parentScene.input.keyboard.removeListener("keydown-ESC", escListener);
  }

  const escListener = () => cleanup();
  parentScene.input.keyboard.once("keydown-ESC", escListener);
}
