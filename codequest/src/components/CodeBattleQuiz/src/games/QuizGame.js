import Phaser from "phaser";
import WebFont from "webfontloader";
import GameArena from "../assets/GameArena.png";
import QuizGameMap from "../assets/QuizGame.json";
import NPC1 from "../assets/NPC1.png";
import IdleFront from "../assets/IdleFront.png";
import PlayerWalkForward from "../assets/PlayerWalkForward.png";
import { QuizGameLogic } from "../utils/QuizGameLogic";
import { Landscape } from "../utils/landscapeUtil";

export default class QuizGame extends Phaser.Scene {
  constructor() {
    super({ key: "QuizGame", active: false });
    this.fontReady = false;
    this.quizLogic = null;
  }

  init(data) {
    this.level = data.level ?? 1;
    this.quizData = data.quizData;
    this.startX = data.playerX ?? 250;
    this.startY = data.playerY ?? 240;
    this.returnSceneKey = data.returnScene ?? null;
    this.saveSlot = data.saveSlot ?? 1;
    this.language = data.language ?? "Python";
    console.log("🎯 QuizGame init:", {
      level: this.level,
      startX: this.startX,
      startY: this.startY,
      returnScene: this.returnSceneKey
    });
  }

  preload() {
    this.load.image("gameArena", GameArena);
    this.load.tilemapTiledJSON("quizgame", QuizGameMap);
    this.load.spritesheet("npc1", NPC1, { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet("playerIdle", IdleFront, { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet("playerWalk", PlayerWalkForward, { frameWidth: 16, frameHeight: 24 });

    Landscape.preload(this);

    // 🔹 HUD is preserved — do NOT stop it
    if (this.scene.isActive("HudOverlay")) {
      console.log("👀 HudOverlay detected, leaving it active");
    }

    WebFont.load({
      custom: { families: ["Press Start 2P"], urls: [new URL("../fonts/fonts.css", import.meta.url).href] },
      active: () => {
        this.fontReady = true;
        console.log("🎨 QuizGame font loaded and ready");
      },
      inactive: () => console.warn("⚠️ Failed to load font"),
    });
  }

  create() {
    console.log("🎮 Creating QuizGame scene...");
    
    // Overlay & arena
    this.overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 1).setDepth(0);
    this.arena = this.add.image(480, 270, "gameArena").setOrigin(0.5).setDepth(0);

    // NPC animations
    if (!this.anims.exists("npc1_talk")) {
      this.anims.create({
        key: "npc1_talk",
        frames: this.anims.generateFrameNumbers("npc1", { start: 0, end: 3 }),
        frameRate: 2,
        repeat: -1,
      });
    }
    this.npc1 = this.add.sprite(78, 91, "npc1").setOrigin(0.5).setDepth(6).play("npc1_talk");

    // Tilemap & landscape
    const map = this.make.tilemap({ key: "quizgame" });
    const landscapeZone = map.getObjectLayer("Area")?.objects.find(o => o.name === "landscapeZone");
    this.landscape = new Landscape(this, landscapeZone);

    // Player animations
    if (!this.anims.exists("player_idle")) {
      this.anims.create({
        key: "player_idle",
        frames: this.anims.generateFrameNumbers("playerIdle", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("player_walk")) {
      this.anims.create({
        key: "player_walk",
        frames: this.anims.generateFrameNumbers("playerWalk", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Player sprite
    this.player = this.add.sprite(503, 245, "playerIdle")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.9)
      .play("player_idle");

    this.cursors = this.input.keyboard.createCursorKeys();

    // Wait for font before launching QuizGameLogic
    this.waitForFontEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (!this.scene.isActive("QuizGame")) {
          this.waitForFontEvent.remove();
          return;
        }
        if (!this.fontReady) return;

        this.quizLogic = new QuizGameLogic(this, map, this.quizData, this.level);
        console.log("🚀 QuizGameLogic initialized");
        this.waitForFontEvent.remove();
      },
    });

    // Fade-in
    this.cameras.main?.fadeIn(400, 0, 0, 0);

    // Q key → safely end quiz
    this.input.keyboard.once("keydown-Q", () => {
      console.log("🛑 [QuizGame] Q pressed, ending quiz...");
      if (this.quizLogic?.endQuiz) {
        this.quizLogic.endQuiz(true);
      } else {
        console.warn("[QuizGame] Quiz logic not initialized, stopping scene manually");
        this.scene.stop();
      }

      // 🔹 Restore HUD after quiz ends
      if (this.scene.isActive("HudOverlay")) {
        this.scene.setVisible(true, "HudOverlay");
        this.scene.bringToTop("HudOverlay");
        console.log("👀 HudOverlay restored after quiz");
      }
    });
  }

  update() {
    if (this.landscape) this.landscape.update();
    if (this.quizLogic?.update) this.quizLogic.update();
  }

  playWalkingAnimation(duration = 1500) {
    if (!this.player) return;
    this.player.play("player_walk", true);
    const originalY = this.player.y;

    this.walkTween = this.tweens.add({
      targets: this.player,
      y: originalY - 3,
      yoyo: true,
      repeat: -1,
      duration: 350,
    });

    this.time.delayedCall(duration, () => {
      if (!this.player) return;
      this.player.play("player_idle", true);
      this.player.y = originalY;
      if (this.walkTween) this.walkTween.stop();
    });
  }

  clearTimers() {
    if (this.time) this.time.removeAllEvents();
    if (this.tweens) this.tweens.killAll();
  }
}
