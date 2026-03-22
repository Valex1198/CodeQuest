// =====================================================
// CodingGameScene.js (UPDATED WITH TIMER)
// =====================================================
import Phaser from "phaser";
import CodingGame from "../assets/CodingGame.png";
import CodeGameMap from "../assets/CodeGame.json";
import KeyboardSpriteSheet from "../assets/Keyboard.png";
import KeyboardJSON from "../assets/Keyboard.json";
import { codeEditorHTML, getCodeTemplate } from "../utils/codeEditorUtil.js";
import {
  loadWebFont,
  createDOMElement,
  initCodeMirror,
  createButton,
  createIOBox,
  createTaskButton,
  checkCondition,
} from "../utils/CodingUtil.js";
import { updateCodeTask, getSave } from "../utils/saveManager.js";
import tasksJSON from "../assets/codingTasks.json";
import { showTaskCompletionOverlay } from "../utils/completeTaskUtil";
import { submitCode as runCodeWithPiston } from "../utils/pistonApi.js";
import { KeyboardManager } from "../utils/KeyboardManager.js";
export class CodingGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "CodingGameScene" });

    this.screenTaskObj = null;
    this.codeEditorDiv = null;
    this.ioArea = null;
    this.language = "Python";
    this.userId = null;
    this.slotId = null;
    this.cmObj = null;

    this.TOTAL_TIME = 900; // 15 minutes
  }

  preload() {
    this.load.image("codingArena", CodingGame);
    this.load.tilemapTiledJSON("codeGame", CodeGameMap);
    this.load.atlas("keyboard", KeyboardSpriteSheet, KeyboardJSON);
  }

  async create(data) {
    console.log("🚀 [CodingGameScene] Creating scene...");

    const storedUser = JSON.parse(localStorage.getItem("user"));
    this.userId = storedUser?.id || 1;
    this.slotId = data?.slotId ?? data?.loadSlot ?? 1;
    this.language = data?.language || "Python";

    this.returnX = data?.playerX;
    this.returnY = data?.playerY;
    this.returnScene = data?.returnScene || "Comlab3Scene";

    // --------------------------------------------------
    // START TIMER OVERLAY (never paused)
    // --------------------------------------------------
    if (!this.scene.isActive("TimerOverlayScene")) {
      this.scene.launch("TimerOverlayScene");
    }

    // --------------------------------------------------
    // BACKGROUND
    // --------------------------------------------------
    this.arena = this.add
      .image(480, 270, "codingArena")
      .setOrigin(0.5)
      .setDepth(1);

    // --------------------------------------------------
    // KEYBOARD (Dynamic & Reactive)
    // --------------------------------------------------
    this.keyboard = new KeyboardManager(this, 740, 457, KeyboardSpriteSheet);

    // --------------------------------------------------
    // MAP & UI OBJECTS
    // --------------------------------------------------
    const map = this.make.tilemap({ key: "codeGame" });
    const uiLayer = map.getObjectLayer("UI");
    if (!uiLayer) return;

    const objs = {};
    uiLayer.objects.forEach((o) => (objs[o.name] = o));
    this.screenTaskObj = objs.screenTask;
    this.cancelDOM = this.add.dom(20, this.sys.canvas.height - 20).createFromHTML(`
  <div id="cancelButton" style="
    font-family: 'Press Start 2P';
    font-size: 18px;
    color: #ff4444;
    cursor: pointer;
    user-select: none;
  ">CANCEL</div>
`).setOrigin(0, 1).setScrollFactor(0);

const cancelEl = document.getElementById("cancelButton");
cancelEl.addEventListener("mouseenter", () => (cancelEl.style.color = "#ff8888"));
cancelEl.addEventListener("mouseleave", () => (cancelEl.style.color = "#ff4444"));
cancelEl.addEventListener("click", () => {
  // Stop timer
  const timerScene = this.scene.get("TimerOverlayScene");
  timerScene?.stopTimer();
  this.scene.stop("TimerOverlayScene");

  // Clear editor/IO
  this.ioArea.inputField.textContent = "";
  this.ioArea.outputField.textContent = "";
  this.cmObj.editor.dispatch({
    changes: { from: 0, to: this.cmObj.editor.state.doc.length, insert: "" },
  });

  // Resume previous scene
  this.scene.stop("CodingGameScene");
  this.scene.resume(this.returnScene, {
    playerX: this.returnX,
    playerY: this.returnY,
    slotId: this.slotId,
    language: this.language,
  });
});

    // --------------------------------------------------
    // LOAD FONT
    // --------------------------------------------------
    await loadWebFont(
      this,
      "Press Start 2P",
      new URL("../fonts/fonts.css", import.meta.url).href
    );

    // --------------------------------------------------
    // CODE EDITOR & IO
    // --------------------------------------------------
    const codeEditor = createDOMElement(
      this,
      objs.codeBox,
      codeEditorHTML(objs.codeBox.width, objs.codeBox.height)
    );

    this.ioArea = createIOBox(this, objs.outputBox);
    this.codeEditorDiv = codeEditor;
    const codeInputDiv = codeEditor.getChildByID("codeInput");

    // --------------------------------------------------
    // INIT CODEMIRROR
    // --------------------------------------------------
    const langIdMap = { Python: 1, Java: 2, "C++": 3 };
    const langId = langIdMap[this.language] || 1;
    this.cmObj = await initCodeMirror(codeInputDiv, langId);

    // --------------------------------------------------
    // DETERMINE STARTING TASK
    // --------------------------------------------------
    const saveData = await getSave(this.userId, this.slotId);
    const savedCodingTasks = saveData?.codingTasks?.[this.language] || {};
    
    // Priority: 1. Passed startingLevel, 2. Next incomplete level, 3. Default to 1
    let startingTaskLevel = data?.startingLevel;

    if (!startingTaskLevel) {
      for (const key of Object.keys(tasksJSON[this.language]).sort(
        (a, b) => a - b
      )) {
        if (!savedCodingTasks[key]?.completed) {
          startingTaskLevel = Number(key);
          break;
        }
      }
    }
    
    if (!startingTaskLevel) startingTaskLevel = 1;

    this.cmObj.editor.dispatch({
      changes: {
        from: 0,
        to: this.cmObj.editor.state.doc.length,
        insert: getCodeTemplate(langId),
      },
    });

    // Prevent Phaser input stealing
    this.cmObj.editor.dom.addEventListener("keydown", (e) =>
      e.stopPropagation()
    );
    this.cmObj.editor.dom.addEventListener("keyup", (e) =>
      e.stopPropagation()
    );
    this.ioArea.inputField.addEventListener("keydown", (e) =>
      e.stopPropagation()
    );

    this.cmObj.editor.focus();

    // --------------------------------------------------
    // RESET BUTTON
    // --------------------------------------------------
    createButton(
      this,
      objs.Reset,
      "RESET",
      { fontFamily: "Press Start 2P", fontSize: "12px", color: "#ff0000" },
      () => {
        this.cmObj.editor.dispatch({
          changes: {
            from: 0,
            to: this.cmObj.editor.state.doc.length,
            insert: getCodeTemplate(langId),
          },
        });
        this.ioArea.inputField.textContent = "";
        this.ioArea.outputField.textContent = "";
      }
    );

    // --------------------------------------------------
    // RUN / SUBMIT CODE (WITH TIMER & PISTON)
    // --------------------------------------------------
const runCode = async (taskLevel = startingTaskLevel) => {
  const code = this.cmObj.editor.state.doc.toString();
  const task = tasksJSON[this.language][taskLevel];
  const input = task.sampleInput || "";

  // Condition check (optional custom checks)
  if (task.condition) {
    const conditionResult = checkCondition(code, task.condition);
    if (conditionResult !== true) {
      this.ioArea.outputField.textContent = conditionResult + " ❌";
      return;
    }
  }

  this.ioArea.outputField.textContent = "Running...";

  try {
    // Execute code using Piston
    const result = await runCodeWithPiston(code, this.language, input);

    if (!result) {
      this.ioArea.outputField.textContent = "Error contacting Piston API ❌";
      return;
    }

    // Compare output
    const completed = (result.stdout?.trim() ?? "") === (task.sampleOutput?.trim() ?? "");

    // Display output
    this.ioArea.outputField.textContent = completed
      ? result.stdout + " ✅"
      : (result.stderr || result.stdout) + " ❌";

    // Save task attempt
    await updateCodeTask(
      this.userId,
      this.slotId,
      this.language,
      taskLevel,
      completed ? 100 : 0, // base score 100 if correct
      completed
    );

    // Timer-based bonus if correct
    if (completed) {
      const timerScene = this.scene.get("TimerOverlayScene");
      const timeLeft = timerScene?.getTimeLeft() ?? 0;
      const timeBonus = Math.floor((timeLeft / this.TOTAL_TIME) * 50);
      const score = 100 + timeBonus;

      // Update task with bonus score
      await updateCodeTask(
        this.userId,
        this.slotId,
        this.language,
        taskLevel,
        score,
        true
      );

      const hud = this.scene.get("HudOverlay");
      if (hud?.updateTotalScore) await hud.updateTotalScore();

      // Stop timer
      timerScene?.stopTimer();
      this.scene.stop("TimerOverlayScene");

      // Show completion overlay
      const comlabScene = this.scene.get("Comlab3Scene");
      if (comlabScene) {
        showTaskCompletionOverlay(comlabScene, taskLevel);
      }

      // Return to Comlab scene after short delay
      this.time.delayedCall(2000, () => {
        this.scene.stop("CodingGameScene");
        this.scene.resume("Comlab3Scene", {
          playerX: this.returnX,
          playerY: this.returnY,
          slotId: this.slotId,
          language: this.language,
          taskCompleted: taskLevel,
        });
      });
    }
  } catch (err) {
    console.error("Error running code with Piston:", err);
    this.ioArea.outputField.textContent = "Error executing code ❌";
  }
};

    createButton(
      this,
      objs.Submit,
      "SUBMIT",
      { fontFamily: "Press Start 2P", fontSize: "12px", color: "#ffffff" },
      () => runCode()
    );

    // --------------------------------------------------
    // TASK BUTTON
    // --------------------------------------------------
    const taskData = tasksJSON[this.language][startingTaskLevel];
    const { viewLabel, hitbox } = createTaskButton(
      this,
      this.screenTaskObj,
      this.codeEditorDiv,
      this.ioArea,
      taskData
    );

    viewLabel.setDepth(10);
    hitbox.setDepth(11);
  }

  update() {
    // Scene update logic
  }
}
