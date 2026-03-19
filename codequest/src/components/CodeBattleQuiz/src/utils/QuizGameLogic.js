// import Phaser from "phaser";
// --------------------------
import { updateQuizLevel } from "../utils/saveManager.js";
import { completeGoal } from "./GoalManager";
export class QuizGameLogic {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Tilemaps.Tilemap} map
   * @param {object} quizData - Dynamic quiz data based on language
   * @param {number} level - current level to start from (1–5)
   */
  constructor(scene, map, quizData, level = 1) {
    this.scene = scene;
    this.map = map;
    this.level = level;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.isTyping = false; // Flag to prevent clicking while text is animating

    // Flatten the questions for the selected level
    const rawQuestions = (quizData?.questions || []).map(q => ({
      question: q.question,
      answers: q.answers,
      correct: q.correct,
    }));

    // Shuffle questions using Fisher-Yates algorithm
    this.questions = this.shuffleArray(rawQuestions);
    this.totalQuestions = this.questions.length;

    console.log("🔹 Loaded and shuffled questions:", this.questions);


    this.progressMarks = [];

    // UI
    this.textZones = {};
    this.createTextZones();
    this.createProgressUI();

    // Display first question
    this.displayQuestion(this.currentQuestionIndex);

    // Setup button zones
    this.createButtonZones();
  }

  // ---------------------------
  // SHUFFLE ARRAY (Fisher-Yates)
  // ---------------------------
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ---------------------------
  // CREATE TEXT ZONES
  // ---------------------------
  createTextZones() {
    const scene = this.scene;
    const textLayer = this.map.getObjectLayer("TextZones");
    if (!textLayer) return;

    textLayer.objects.forEach((obj) => {
      const name = obj.properties?.find(p => p.name === "name")?.value;
      if (!name) return;

      const x = obj.x + obj.width / 2;
      const y = obj.y + obj.height / 2;

      const bg = scene.add.rectangle(x, y, obj.width, obj.height, 0x00ff66, 0)
        .setOrigin(0.5)
        .setDepth(5);

      const text = scene.add.text(x, y, "", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: name === "Question" ? "18px" : "14px",
        color: "#00FF66",
        align: "center",
        wordWrap: { width: obj.width - 20, useAdvancedWrap: true },
        lineSpacing: 4,
      }).setOrigin(0.5).setDepth(10);

      this.textZones[name] = { text, bg };
    });
  }

  // ---------------------------
  // CREATE PROGRESS UI
  // ---------------------------
  createProgressUI() {
    const scene = this.scene;
    const progressLayer = this.map.getObjectLayer("QuizProgressZone");
    if (!progressLayer?.objects?.length) return;

    const zone = progressLayer.objects[0];
    this.progressZoneX = zone.x + zone.width / 2;
    this.progressZoneY = zone.y + zone.height / 2;

    const barYOffset = 25;
    const circleYOffset = -15;

    this.progressBarBG = scene.add.rectangle(this.progressZoneX, this.progressZoneY + barYOffset, zone.width, 10, 0x333333)
      .setOrigin(0.5).setDepth(10);

    this.progressBarFill = scene.add.rectangle(this.progressZoneX - zone.width / 2, this.progressZoneY + barYOffset, 0, 10, 0x00ff66)
      .setOrigin(0, 0.5).setDepth(11);

    this.progressGraphics = scene.add.graphics().setDepth(12);

    this.progressText = scene.add.text(this.progressZoneX, this.progressZoneY - 20, "", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "16px",
      color: "#00FF66",
      stroke: "#000000",
      strokeThickness: 2,
      align: "center",
    }).setOrigin(0.5).setDepth(15);

    this.barYOffset = barYOffset;
    this.circleYOffset = circleYOffset;

    this.updateProgressUI(); // initial draw
  }

  // ---------------------------
  // UPDATE PROGRESS UI
  // ---------------------------
  updateProgressUI(isCorrect = null) {
    const scene = this.scene;
    if (!this.progressText || !this.progressGraphics || !this.progressBarBG) return;

    if (isCorrect !== null) this.progressMarks.push(isCorrect ? 1 : 0);

    const progressRatio = this.progressMarks.length / this.totalQuestions;
    this.progressBarFill.width = this.progressBarBG.width * progressRatio;

    this.progressGraphics.clear();

    const zoneWidth = this.progressBarBG.width;
    const circleRadius = 6;
    const spacing = zoneWidth / this.totalQuestions;
    const startX = this.progressZoneX - zoneWidth / 2 + spacing / 2;
    const y = this.progressZoneY + this.barYOffset + this.circleYOffset;

    for (let i = 0; i < this.totalQuestions; i++) {
      let color = 0x555555; // unanswered
      if (this.progressMarks[i] === 1) color = 0x00ff66;
      if (this.progressMarks[i] === 0) color = 0xff3333;

      this.progressGraphics.fillStyle(color, 1);
      this.progressGraphics.fillCircle(startX + i * spacing, y, circleRadius);

      if (i === this.progressMarks.length - 1 && isCorrect !== null) {
        const circleSprite = scene.add.circle(startX + i * spacing, y, circleRadius, color)
          .setScale(0)
          .setDepth(20);
        scene.tweens.add({
          targets: circleSprite,
          scale: 1,
          ease: "Back.easeOut",
          duration: 300,
          onComplete: () => circleSprite.destroy(),
        });
      }
    }

    this.progressText.setText(`Quiz ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
  }

  // ---------------------------
  // TYPEWRITER EFFECT
  // ---------------------------
  typeWriterEffect(textObject, content, speed = 30, onComplete = null) {
    textObject.setText("");
    let i = 0;
    const scene = this.scene;
    scene.time.addEvent({
      delay: speed,
      repeat: content.length - 1,
      callback: () => {
        textObject.text += content[i];
        scene.tweens.add({
          targets: textObject,
          alpha: { from: 0.5, to: 1 },
          duration: 50,
        });
        i++;
        if (i === content.length && onComplete) onComplete();
      },
    });
  }

  // ---------------------------
  // DISPLAY QUESTION
  // ---------------------------
  displayQuestion(index) {
    const q = this.questions[index];
    if (!q) return;

    this.selectedAnswer = null;
    this.isTyping = true; // Lock input
    Object.values(this.textZones).forEach(({ bg }) => bg.setFillStyle(0x00ff66, 0));

    // Clear previous text immediately
    ["Question", "AnswerA", "AnswerB", "AnswerC", "AnswerD"].forEach(key => {
        if (this.textZones[key]) this.textZones[key].text.setText("");
    });

    // Start Question typewriter
    this.typeWriterEffect(this.textZones.Question.text, q.question, 40, () => {
      let completedAnswers = 0;
      // After question is done, start all 4 answers
      ["AnswerA", "AnswerB", "AnswerC", "AnswerD"].forEach((key, i) => {
        this.typeWriterEffect(this.textZones[key].text, q.answers[i], 30, () => {
          completedAnswers++;
          // Unlock input only when the LAST answer is done
          if (completedAnswers === 4) {
            this.isTyping = false;
            console.log("🔓 Input unlocked");
          }
        });
      });
    });
  }

  // ---------------------------
  // HANDLE ANSWER
  // ---------------------------
  handleAnswer(answerIndex) {
    if (this.selectedAnswer !== null || this.isTyping) return;
    this.selectedAnswer = answerIndex;

    const correctIndex = this.questions[this.currentQuestionIndex].correct;
    const isCorrect = answerIndex === correctIndex;

    const answerKeys = ["AnswerA", "AnswerB", "AnswerC", "AnswerD"];
    const selectedName = answerKeys[answerIndex];

    if (selectedName && this.textZones[selectedName]) {
      this.textZones[selectedName].bg.setFillStyle(isCorrect ? 0x00ff66 : 0xff3333, 0.5);
    }

    // Walk forward if correct
    if (isCorrect) {
      this.scene.landscape.moveTemporarily(1, 1.5, 4500);
      if (this.scene.playWalkingAnimation) this.scene.playWalkingAnimation(4500);
    } else {
      this.scene.cameras.main.shake(200, 0.03);
    }

    this.updateProgressUI(isCorrect);

    this.scene.time.delayedCall(1200, () => this.nextQuestion());
  }

  // ---------------------------
  // NEXT QUESTION
  // ---------------------------
  nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endQuiz(false); // quiz complete
    } else {
      this.displayQuestion(this.currentQuestionIndex);
    }
  }

 // --------------------------
// QuizGameLogic.js


async endQuiz(isGameOver = false) {
    const scene = this.scene;
    console.log(`🚀 [QuizGameLogic] Ending quiz (Early quit: ${isGameOver})...`);

    // Only save and show results if we finished the questions (not a Q-quit)
    if (!isGameOver) {
      const correctCount = this.progressMarks.filter(m => m === 1).length;
      const score = Math.round((correctCount / this.totalQuestions) * 100);
      const passed = score >= 60;

      try {
          const storedUser = JSON.parse(localStorage.getItem("user")) || {};
          const userId = storedUser.id || 1;
          const slotId = scene.saveSlot ?? 1;
          const language = scene.language ?? "Python";

          // Only mark as completed if passed (60% or higher)
          await updateQuizLevel(userId, slotId, language, this.level, score, passed);
          console.log(`💾 Quiz score saved! Passed: ${passed} (${score}%)`);

          if (passed && language === "Python" && this.level === 1) {
            completeGoal("complete_python_1", scene);
          }
      } catch (err) {
          console.error("❌ Failed to save quiz score:", err);
      }

      // Launch ClipboardOverlay
      const answersArray = Array(10).fill(null);
      for (let i = 0; i < this.totalQuestions && i < 10; i++) {
          answersArray[i] = this.progressMarks[i] === 1 ? 1 : 0;
      }

      if (scene.scene.isActive("ClipboardOverlay")) {
          scene.scene.stop("ClipboardOverlay");
      }
      scene.scene.launch("ClipboardOverlay", {
          level: this.level,
          score: score,
          passed: passed,
          answers: answersArray
      });
    }

    // Clean up quiz UI
    if (this.textZones) {
        Object.values(this.textZones).forEach(({ text, bg }) => {
            if (text) text.setText("");
            if (bg) bg.setVisible(false);
        });
    }
    
    // Stop QuizGame scene
    scene.scene.stop("QuizGame");

    // 🔹 CRITICAL: Resume parent scene to unfreeze the world
    const returnScene = scene.returnSceneKey || "Comlab1Scene";
    if (scene.scene.isPaused(returnScene)) {
      scene.scene.resume(returnScene);
      console.log(`✅ Resumed parent scene: ${returnScene}`);
    }

    // Update HUD
    const hud = scene.scene.get("HudOverlay");
    if (hud?.updateTotalScore) await hud.updateTotalScore();
    if (scene.scene.isActive("HudOverlay")) {
        scene.scene.setVisible(true, "HudOverlay");
        scene.scene.bringToTop("HudOverlay");
    }

    this.progressMarks = [];
    this.currentQuestionIndex = 0;
}




  // ---------------------------
  // BUTTON ZONES
  // ---------------------------
  createButtonZones() {
    const scene = this.scene;
    const buttonLayer = this.map.getObjectLayer("ButtonZones");
    if (!buttonLayer?.objects) return;

    buttonLayer.objects.forEach((obj) => {
      const zone = scene.add.zone(obj.x, obj.y, obj.width, obj.height)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .setDepth(3);

      const brightPiece = scene.add.image(480, 270, "gameArena")
        .setOrigin(0.5)
        .setDepth(2)
        .setTint(0xffffff)
        .setAlpha(0);

      const maskGraphics = scene.make.graphics();
      maskGraphics.fillStyle(0xffffff);
      maskGraphics.fillRect(obj.x, obj.y, obj.width, obj.height);
      brightPiece.setMask(maskGraphics.createGeometryMask());

      zone.on("pointerover", () => scene.tweens.add({ targets: brightPiece, alpha: 1, scale: 1.02, duration: 120 }));
      zone.on("pointerout", () => scene.tweens.add({ targets: brightPiece, alpha: 0, scale: 1, duration: 120 }));
      zone.on("pointerdown", () => {
        scene.tweens.add({ targets: brightPiece, scale: 0.97, duration: 80 });
        const name = obj.properties?.find(p => p.name === "name")?.value || "Unknown";
        const idx = this.getAnswerIndexFromName(name);
        if (idx !== -1) this.handleAnswer(idx);
      });
      zone.on("pointerup", () => scene.tweens.add({ targets: brightPiece, scale: 1.02, duration: 100 }));
    });
  }

  getAnswerIndexFromName(name) {
    const map = { A: 0, B: 1, C: 2, D: 3, AnswerA: 0, AnswerB: 1, AnswerC: 2, AnswerD: 3 };
    return map[name] ?? -1;
  }
}
