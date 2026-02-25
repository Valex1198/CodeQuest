// scenes/Comlab1Scene.js
import Phaser from "phaser";
import Comlab1Bg from "../assets/Comlab1.png";
import Comlab1Map from "../assets/comlab1.json";
import Professor2Img from "../assets/Professor2.png";
import EKeyImg from "../assets/E-Key.png";
import { createMenuButton } from "../utils/uiHelpers.js";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave, getSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil";
import { openProfessorQuizDialogue } from "../utils/professorQuizDialogueUtil";

export class Comlab1Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Comlab1Scene" });
    this.player = null;
    this.currentSlot = null;
    this.language = "Python";
    this.quizData = null;
  }

  preload() {
    this.load.tilemapTiledJSON("comlab1", Comlab1Map);
    this.load.image("Comlab1", Comlab1Bg);
    this.load.spritesheet("EKey", EKeyImg, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("Professor2", Professor2Img, { frameWidth: 32, frameHeight: 48 });

    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    
    // ----------------------------
    // Load player, slot & language
    // ----------------------------
    this.currentSlot = data?.slotId ?? data?.loadSlot ?? 1;
    this.language = data?.language ?? "Python";
      
    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    const { player, slot, language, quizData } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = slot ?? this.currentSlot;
    this.language = language ?? this.language;
    this.quizData = quizData ?? {};

    // ----------------------------
    // Map & collisions
    // ----------------------------
    const map = this.make.tilemap({ key: "comlab1" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.physics.add.collider(this.player, this.collisionZones);

    // ----------------------------
    // Background
    // ----------------------------
    this.add.image(map.widthInPixels / 2, map.heightInPixels / 2, "Comlab1").setOrigin(0.5);

    // ----------------------------
    // Portals
    // ----------------------------
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    if (data?.fromPortal) fadeInFromPortal(this, data);

    // ----------------------------
    // Song UI & HUD
    // ----------------------------
    this.songUI = createSongUI(this, "Now Playing: Comlab 1 Theme");
    await launchHUD(this, this.player, this.currentSlot, this.language);

    // ----------------------------
    // Save hotkey (L)
    // ----------------------------
    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      await setSave(userId, this.currentSlot, this, this.player, this.language);
      console.log(`💾 Saved slot ${this.currentSlot}`);
    });

    // ----------------------------
    // E-Key sprite
    // ----------------------------
    if (!this.anims.exists("e_key_anim")) {
      this.anims.create({
        key: "e_key_anim",
        frames: this.anims.generateFrameNumbers("EKey", { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1,
      });
    }
    this.eKeySprite = this.add.sprite(this.player.x, this.player.y - 40, "EKey")
      .setDepth(1002)
      .setVisible(false)
      .play("e_key_anim");

    // ----------------------------
    // Professor NPC
    // ----------------------------
    if (!this.anims.exists("professor2_idle")) {
      this.anims.create({
        key: "professor2_idle",
        frames: this.anims.generateFrameNumbers("Professor2", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    this.professor2 = this.physics.add.sprite(478, 292, "Professor2");
    this.professor2.body.immovable = true;
    this.professor2.body.allowGravity = false;
    this.professor2.play("professor2_idle");
    this.physics.add.collider(this.player, this.professor2);

    // ----------------------------
    // E → Open Professor Quiz Dialogue
    // ----------------------------
    this.input.keyboard.on("keydown-E", () => {
  const dist = Phaser.Math.Distance.Between(
    this.player.x,
    this.player.y,
    this.professor2.x,
    this.professor2.y
  );

  if (dist <= 60) {
    openProfessorQuizDialogue(this, {
  slot: this.currentSlot,
  language: this.language,
  quizData: this.quizData[this.language], // now contains level1–level5 with questions
  onLevelSelect: (level) => {
  const questions = this.quizData[`level${level}`] || [];

  if (questions.length === 0) {
    console.warn(`⚠️ No questions found for ${this.language} level ${level}`);
    return;
  }

  this.scene.launch("QuizGame", {
    level,
    
    language: this.language,
    quizData: { questions }, // wrap in an object for QuizGameLogic
   
    saveSlot: this.currentSlot,
  });
  this.scene.bringToTop("QuizGame");
  
  
},


});

  }
});


    // ----------------------------
    // ESC → SaveSlotsScene
    // ----------------------------
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", {
        player: this.player,
        loadSlot: this.currentSlot,
      });
    });
  }

  update() {
    if (!this.player?.body) return;

    updatePlayer(this.player);
    this.player.setDepth(this.player.y);
    this.professor2?.setDepth(this.professor2.y);

    if (this.portalZones && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }

    // ----------------------------
    // E-Key visibility logic
    // ----------------------------
    if (this.eKeySprite && this.professor2) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.professor2.x, this.professor2.y
      );
      this.eKeySprite.setVisible(distance <= 60);
      this.eKeySprite.setPosition(this.player.x, this.player.y - 40);
    }
  }
}
