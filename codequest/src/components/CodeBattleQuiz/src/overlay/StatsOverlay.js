import Phaser from "phaser";
import WebFont from "webfontloader";
import { getSave } from "../utils/saveManager.js";

export default class StatsOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "StatsOverlay", active: false });
    this.fontReady = false;
  }

  preload() {
    WebFont.load({
      custom: {
        families: ["Press Start 2P"],
        urls: [new URL("../fonts/fonts.css", import.meta.url).href],
      },
      active: () => {
        this.fontReady = true;
        console.log("✅ [StatsOverlay] Font loaded");
      },
      inactive: () => {
        console.warn("⚠️ Failed to load font for StatsOverlay.");
      },
    });
  }

  async create(data = {}) {
    this.previousScene = data.previousScene || null;
    this.player = data.player || {};
    this.language = data.language || "Python";
    this.saveSlot = data.saveSlot || 1;

    const { width, height } = this.scale;

    // Semi-transparent background
    this.background = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.9)
      .setOrigin(0)
      .setDepth(1);

    // Scrollable DOM box
    const boxWidth = 627;
    const boxHeight = 350;

    // Load save data for this slot
    const storedUser = JSON.parse(localStorage.getItem("user")) || { id: 1 };
    const saveData = await getSave(storedUser.id, this.saveSlot) || {};

    const quizStats = saveData?.quiz?.[this.language] || {};
    const codingStats = saveData?.codingTasks?.[this.language] || {};

    // Calculate completion % for progress bars
    const quizCompleted = Object.values(quizStats).filter(s => s.completed).length;
    const codingCompleted = Object.values(codingStats).filter(s => s.completed).length;
    const quizPercent = Math.round((quizCompleted / 10) * 100);
    const codingPercent = Math.round((codingCompleted / 10) * 100);

    // Generate two-column HTML with gamified style
    let statsHTML = `
      <div style="display:flex; justify-content:space-between; font-size:12px; gap:10px;">
        <!-- Quiz Column -->
        <div style="width:48%; background-color:#1E2A47; padding:8px; border-radius:8px;">
          <div style="text-align:center; font-weight:bold; color:#ffff00; margin-bottom:6px;">Quiz</div>
          <div style="height:6px; background:#555; border-radius:3px; margin-bottom:8px;">
            <div style="width:${quizPercent}%; background:#00ff00; height:100%; border-radius:3px;"></div>
          </div>
    `;
    for (let i = 1; i <= 10; i++) {
      const info = quizStats[i] || { completed: false, score: 0 };
      const color = info.completed ? "#00ff00" : "#ff5555";
      const symbol = info.completed ? "✓" : "✗";
      statsHTML += `
        <div style="margin-bottom:4px; background-color: rgba(255,255,255,0.05); padding:2px 4px; border-radius:4px; color:${color};">
          Level ${i}: ${symbol} (${info.score})
        </div>
      `;
    }
    statsHTML += `</div>`; // end quiz column

    // Coding Tasks Column
    statsHTML += `
      <div style="width:48%; background-color:#1A472A; padding:8px; border-radius:8px;">
        <div style="text-align:center; font-weight:bold; color:#ffff00; margin-bottom:6px;">Coding Tasks</div>
        <div style="height:6px; background:#555; border-radius:3px; margin-bottom:8px;">
          <div style="width:${codingPercent}%; background:#00ff00; height:100%; border-radius:3px;"></div>
        </div>
    `;
    for (let i = 1; i <= 10; i++) {
      const info = codingStats[i] || { completed: false, score: 0, attempts: 0 };
      const color = info.completed ? "#00ff00" : "#ff5555";
      const symbol = info.completed ? "✓" : "✗";
      statsHTML += `
        <div style="margin-bottom:4px; background-color: rgba(255,255,255,0.05); padding:2px 4px; border-radius:4px; color:${color};">
          Task ${i}: ${symbol} (${info.score})
        </div>
      `;
    }
    statsHTML += `</div></div>`; // end coding column + flex container

    // Full DOM HTML
    const html = `
      <div id="statsBox" style="
        width: ${boxWidth}px;
        height: ${boxHeight}px;
        background-color: rgba(0,0,0,0.85);
        padding: 16px;
        overflow-y: auto;
        border: 2px solid #ffffff;
        border-radius: 8px;
        font-family: 'Press Start 2P';
        color: #ffffff;
        box-sizing: border-box;
      ">
        <div style="text-align:center; font-size:16px; font-weight:bold; color:#ffff00; margin-bottom:12px; background-color:#222; padding:6px; border-radius:4px;">
          ${this.language} Stats - Slot ${this.saveSlot}
        </div>
        ${statsHTML}
      </div>
    `;

    this.statsBoxDiv = this.add
      .dom(width / 2, height / 2)
      .createFromHTML(html)
      .setOrigin(0.5)
      .setDepth(2);

    // Click-to-close text
    this.clickText = this.add.text(width / 2, height - 40, "CLICK TO CLOSE", {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#ffffff",
    })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.closeOverlay());

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Hide HUD while overlay is open
    if (this.previousScene) {
      const prevScene = this.scene.get(this.previousScene);
      if (prevScene?.scene?.isActive("HudOverlay")) {
        this.scene.setVisible(false, "HudOverlay");
      }
    }
  }

  closeOverlay() {
    this.cameras.main.fadeOut(250, 0, 0, 0);

    this.time.delayedCall(250, () => {
      this.scene.stop("StatsOverlay");

      // Show HUD again if it exists
      if (this.previousScene) {
        const prevScene = this.scene.get(this.previousScene);
        if (prevScene?.scene?.isActive("HudOverlay")) {
          this.scene.setVisible(true, "HudOverlay");
          this.scene.bringToTop("HudOverlay");
        }
        this.scene.resume(this.previousScene);
      }
    });
  }
}
