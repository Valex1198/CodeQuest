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
    this.currentTestIndex = 0; 

    // Interactive Input Simulation State
    this.isCollectingInputs = false;
    this.promptIndex = 0;
    this.promptsFound = [];
    this.collectedInputs = [];
    this.currentTaskLevel = 1;

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
    this.cmObj.editor.focus();

    // --------------------------------------------------
    // INTERACTIVE INPUT HANDLER (VS CODE STYLE)
    // --------------------------------------------------
    this.handleInteractiveInput = async () => {
      const userInput = this.ioArea.inputField.textContent.trim();
      if (!userInput) return;

      // 1. Show the user's input in the terminal (like a real console)
      this.ioArea.outputField.textContent += userInput + "\n";
      this.collectedInputs.push(userInput);
      this.ioArea.inputField.textContent = "";
      this.promptIndex++;

      // 2. Are there more inputs needed?
      if (this.promptIndex < this.promptsFound.length) {
        this.ioArea.outputField.textContent += this.promptsFound[this.promptIndex];
      } else {
        // 3. DONE COLLECTING - Run the actual code with all inputs
        this.isCollectingInputs = false;
        this.ioArea.outputField.textContent += "\n[System] All inputs received. Executing...\n";
        await this.finishSubmission();
      }
    };

    // Prevent Phaser input stealing and handle INTERACTIVE ENTER
    this.ioArea.inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (this.isCollectingInputs) {
          this.handleInteractiveInput();
        } else {
          // If not in interactive mode, let them use Enter for spacing
          document.execCommand('insertLineBreak');
        }
        return;
      }
      this.keyboard.onKeyDown(e);
      e.stopPropagation();
    });

    this.ioArea.inputField.addEventListener("keyup", (e) => {
      this.keyboard.onKeyUp(e);
      e.stopPropagation();
    });

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
  this.currentTaskLevel = taskLevel;
  const code = this.cmObj.editor.state.doc.toString();
  const task = tasksJSON[this.language][taskLevel];

  // 1. Condition check (mustUse / mustNotUse)
  if (task.condition) {
    const conditionResult = checkCondition(code, task.condition);
    if (conditionResult !== true) {
      this.ioArea.outputField.textContent = conditionResult + " ❌";
      return;
    }
  }

  // 2. Scan for input() prompts in the code
  // Regex to find content inside input("...") or input('...')
  const inputRegex = /input\(\s*["'](.*?)["']\s*\)/g;
  this.promptsFound = [];
  let match;
  while ((match = inputRegex.exec(code)) !== null) {
    this.promptsFound.push(match[1]);
  }

  // Check if the number of inputs in the code matches the task's requirements.
  const testCases = task.testCases || [{ input: task.sampleInput || "" }];
  const expectedInputCount = testCases[this.currentTestIndex].input.split('\n').filter(x => x.trim()).length;
  
  if (this.promptsFound.length < expectedInputCount) {
    this.ioArea.outputField.textContent = `Your code is expecting ${this.promptsFound.length} input(s), but the task requires ${expectedInputCount}. Please correct your code and try again. ❌`;
    return;
  }

  // 3. Start Interactive Mode
  this.isCollectingInputs = true;
  this.promptIndex = 0;
  this.collectedInputs = [];
  this.ioArea.outputField.textContent = "[Running Interactive Mode...]\n";
  this.ioArea.inputField.textContent = "";

  if (this.promptsFound.length > 0) {
    this.ioArea.outputField.textContent += this.promptsFound[0];
    this.ioArea.inputField.focus();
  } else {
    // No inputs needed? Just finish immediately.
    this.isCollectingInputs = false;
    await this.finishSubmission();
  }
};

this.finishSubmission = async () => {
  const code = this.cmObj.editor.state.doc.toString();
  const task = tasksJSON[this.language][this.currentTaskLevel];
  const testCases = task.testCases || [{ input: task.sampleInput || "", output: task.sampleOutput || "" }];
  const currentTC = testCases[this.currentTestIndex];
  
  // Use collected inputs if available, otherwise use test case default
  const inputToUse = this.collectedInputs.length > 0 
    ? this.collectedInputs.join('\n') 
    : currentTC.input;

  const isOutputCorrect = (actual, expected) => {
    const a = actual.toLowerCase().trim();
    const e = expected.toLowerCase().trim();
    if (a === e || a.endsWith(e)) return true;
    const words = a.split(/[\s=:]+/);
    return words.includes(e);
  };

  try {
    const result = await runCodeWithPiston(code, this.language, inputToUse);
    if (!result) {
      this.ioArea.outputField.textContent = "Error contacting API ❌";
      return;
    }

    const actualOutput = (result.stdout || "").trim();
    const expectedOutput = (currentTC.output || "").trim();
    const passed = isOutputCorrect(actualOutput, expectedOutput);

    if (passed) {
      this.ioArea.outputField.textContent += `Test ${this.currentTestIndex + 1} Passed ✅\n\n`;
      
      if (this.currentTestIndex < testCases.length - 1) {
        this.currentTestIndex++;
        this.ioArea.outputField.textContent += `Success! Next Test: Click SUBMIT for Test ${this.currentTestIndex + 1}.`;
      } else {
        this.ioArea.outputField.textContent += "ALL TESTS PASSED! 🎉";
        this.currentTestIndex = 0;

        await updateCodeTask(this.userId, this.slotId, this.language, this.currentTaskLevel, 100, true);
        
        const timerScene = this.scene.get("TimerOverlayScene");
        timerScene?.stopTimer();
        this.scene.stop("TimerOverlayScene");

        const comlabScene = this.scene.get("Comlab3Scene");
        if (comlabScene) showTaskCompletionOverlay(comlabScene, this.currentTaskLevel);

        this.time.delayedCall(2000, () => {
          this.scene.stop("CodingGameScene");
          this.scene.resume("Comlab3Scene", {
            playerX: this.returnX,
            playerY: this.returnY,
            slotId: this.slotId,
            language: this.language,
            taskCompleted: this.currentTaskLevel,
          });
        });
      }
    } else {
      this.ioArea.outputField.textContent += `\nTest ${this.currentTestIndex + 1} Failed ❌\nExpected: ${expectedOutput}\nGot: ${actualOutput}\n\nTry again!`;
      this.currentTestIndex = 0; // Reset progress on failure to be strict
    }
  } catch (err) {
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
