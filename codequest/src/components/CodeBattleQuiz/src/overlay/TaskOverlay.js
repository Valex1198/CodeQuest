import Phaser from "phaser";
import WebFont from "webfontloader";

export default class TaskOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "TaskOverlay", active: false });
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
        console.log("✅ [TaskOverlay] Font loaded");
      },
      inactive: () => console.warn("⚠️ [TaskOverlay] Failed to load font for TaskOverlay."),
    });
  }

  create(data = {}) {
    const { width, height } = this.scale;
    this.previousScene = data.previousScene || "CodingGameScene";

    // Pause previous scene if active
    if (this.scene.isActive(this.previousScene)) {
      this.scene.pause(this.previousScene);
    }

    console.log("🚀 [TaskOverlay] Opening overlay for", this.previousScene, data.task);

    this.disableHTML();

    // Dark semi-transparent background
    this.background = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(999);

    // Panel as simple rectangle
    const panelWidth = Math.min(640, width * 0.9);
    const panelHeight = Math.min(360, height * 0.8);

    this.panel = this.add
      .rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x111111, 0.95)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(1000);

    // Task DOM box
    if (data.task) {
      const task = data.task;
      
      // Generate Test Case HTML
      let testCaseHtml = "";
      if (task.testCases) {
        task.testCases.forEach((tc, index) => {
          if (!tc.hidden) {
            testCaseHtml += `
              <div style="font-size:10px; color:#00ff00; margin-top:8px;">Test Case ${index + 1}:</div>
              <div style="font-size:9px; color:#aaa; margin-left:8px;">Input: ${tc.input || "none"}</div>
              <div style="font-size:9px; color:#00ffff; margin-left:8px;">Expected: ${tc.output}</div>
            `;
          }
        });
      } else {
        // Fallback for old format
        if (task.sampleInput) testCaseHtml += `<div style="font-size:11px; color:#00ff00; margin-bottom:12px;">Sample Input:<br>${task.sampleInput}</div>`;
        if (task.sampleOutput) testCaseHtml += `<div style="font-size:11px; color:#00ffff; margin-bottom:12px;">Expected Output:<br>${task.sampleOutput}</div>`;
      }

      const html = `
        <div id="taskBox" style="
          width: ${panelWidth - 32}px;
          height: ${panelHeight - 32}px;
          background-color: rgba(0,0,0,0);
          padding: 16px;
          overflow-y: auto;
          font-family: 'Press Start 2P';
          color: #ffffff;
          box-sizing: border-box;
        ">
          <div style="text-align:center; font-size:14px; color:#ffff00; margin-bottom:16px;">
            ${task.title}
          </div>
          <div style="font-size:12px; margin-bottom:12px;">${task.description}</div>
          ${testCaseHtml}
          ${task.hint ? `<div style="font-size:10px; color:#ff8800; margin-top:16px; margin-bottom:12px;">Hint: ${task.hint}</div>` : ""}
        </div>
      `;

      this.taskBoxDiv = this.add
        .dom(width / 2, height / 2)
        .createFromHTML(html)
        .setOrigin(0.5)
        .setDepth(1001);
    }

    // Click-to-close text
    this.clickText = this.add.text(width / 2, height - 40, "CLICK TO CLOSE", {
      fontFamily: '"Press Start 2P"',
      fontSize: "10px",
      color: "#ffffff",
    })
      .setOrigin(0.5)
      .setDepth(1002)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true });

    this.clickText.on("pointerdown", () => this.closeOverlay());

    // ESC key closes overlay
    this.input.keyboard.once("keydown-ESC", () => this.closeOverlay());

    // Fade in overlay
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Bring overlay to top
    this.scene.bringToTop();
  }

  disableHTML() {
    const code = document.getElementById("codeInput")?.parentElement;
    const output = document.getElementById("outputText")?.parentElement;

    if (code) {
      code.style.pointerEvents = "none";
      code.style.opacity = "0";
    }
    if (output) {
      output.style.pointerEvents = "none";
      output.style.opacity = "0";
    }

    console.log("🟢 [TaskOverlay] Code editor + IO disabled");
  }

  enableHTML() {
    const code = document.getElementById("codeInput")?.parentElement;
    const output = document.getElementById("outputText")?.parentElement;

    if (code) {
      code.style.pointerEvents = "auto";
      code.style.opacity = "1";
      const cmTextarea = code.querySelector("textarea");
      if (cmTextarea) cmTextarea.focus();
    }
    if (output) {
      output.style.pointerEvents = "auto";
      output.style.opacity = "1";
    }

    console.log("🟢 [TaskOverlay] Code editor + IO restored");
  }

  closeOverlay() {
    console.log("🟢 [TaskOverlay] Closing overlay...");
    this.cameras.main.fadeOut(250, 0, 0, 0);

    this.time.delayedCall(250, () => {
      this.enableHTML();
      this.scene.stop();
      if (this.scene.isActive(this.previousScene)) {
        this.scene.resume(this.previousScene);
        this.scene.bringToTop(this.previousScene);
      }
      console.log("✅ [TaskOverlay] Overlay closed and previous scene resumed");
    });
  }
}
