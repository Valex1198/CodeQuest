// scenes/Comlab1Scene.js
import Phaser from "phaser";
import Comlab1Bg from "../assets/Comlab1.png";
import Comlab1Map from "../assets/comlab1.json";
import Professor2Img from "../assets/Professor2.png";
import EKeyImg from "../assets/E-Key.png";
import ProfessorQuizDialogue from "../../../../assets/dialogue/professor_quiz.json";
import { createMenuButton } from "../utils/uiHelpers.js";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave, getSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil";
import { openProfessorQuizDialogue } from "../utils/professorQuizDialogueUtil";
import { getNPCDialogue, handleDialogueActions } from "../utils/DialogueManager";

export class Comlab1Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Comlab1Scene" });
    this.player = null;
    this.currentSlot = null;
    this.language = "Python";
    this.quizData = null;
    this.dialogueTimer = null;
  }

  drawBubble(arrowX = 0) {
    if (!this.bubbleBg) return;
    const graphics = this.bubbleBg;
    graphics.clear();
    graphics.fillStyle(0x000000, 0.8);
    graphics.lineStyle(2, 0xffffff, 1);
    
    graphics.fillRoundedRect(-100, -60, 200, 60, 10);
    graphics.strokeRoundedRect(-100, -60, 200, 60, 10);
    
    const arrowSize = 10;
    const clampedArrowX = Phaser.Math.Clamp(arrowX, -90, 90);
    
    graphics.beginPath();
    graphics.moveTo(clampedArrowX - arrowSize, 0);
    graphics.lineTo(clampedArrowX + arrowSize, 0);
    graphics.lineTo(clampedArrowX, arrowSize);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
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

    // Interaction Prompt (matching Sakura's style)
    this.interactText = this.add.text(this.professor2.x, this.professor2.y - 40, "Press E to talk", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(1002);

    // Dialogue Bubble (matching Sakura's style)
    this.dialogueBubble = this.add.container(this.professor2.x, this.professor2.y - 70).setVisible(false).setDepth(15);
    this.bubbleBg = this.add.graphics();
    this.drawBubble(0);
    this.dialogueText = this.add.text(0, -30, "", {
      fontSize: "12px",
      fill: "#ffffff",
      wordWrap: { width: 180 },
      align: "center"
    }).setOrigin(0.5);
    this.dialogueBubble.add([this.bubbleBg, this.dialogueText]);

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
        if (this.dialogueBubble.visible) {
          // If already talking, hide and open menu immediately
          this.dialogueBubble.setVisible(false);
          if (this.dialogueTimer) this.dialogueTimer.remove();
          this.openQuizMenu();
        } else {
          // Talk first
          const storedUser = JSON.parse(localStorage.getItem("user")) || {};
          const gameState = {
            flags: storedUser.flags || {},
            quests: storedUser.quests || {},
            inventory: storedUser.inventory || [],
            user: storedUser
          };

          const dialogue = getNPCDialogue(ProfessorQuizDialogue, gameState);
          if (dialogue) {
            this.dialogueText.setText(dialogue.text);
            this.dialogueBubble.setVisible(true);
            
            // Set met flag
            if (!storedUser.flags) storedUser.flags = {};
            storedUser.flags.met_professor_quiz = true;
            localStorage.setItem("user", JSON.stringify(storedUser));

            if (this.dialogueTimer) this.dialogueTimer.remove();
            
            // Wait 2 seconds then open menu automatically
            this.dialogueTimer = this.time.delayedCall(2000, () => {
              this.dialogueBubble.setVisible(false);
              this.openQuizMenu();
            });
          }
        }
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

    // Sync UI position
    this.events.on("postupdate", () => {
        if (this.professor2 && this.professor2.body) {
            if (this.interactText) this.interactText.setPosition(this.professor2.x, this.professor2.y - 40);
            if (this.dialogueBubble && this.dialogueBubble.visible) {
                const targetX = this.professor2.x;
                const targetY = this.professor2.y - 70;
                const cam = this.cameras.main;
                const view = cam.worldView;
                const clampedX = Phaser.Math.Clamp(targetX, view.x + 105, view.x + view.width - 105);
                const clampedY = Phaser.Math.Clamp(targetY, view.y + 65, view.y + view.height - 10);
                
                this.dialogueBubble.x = Math.round(Phaser.Math.Linear(this.dialogueBubble.x, clampedX, 0.2));
                this.dialogueBubble.y = Math.round(Phaser.Math.Linear(this.dialogueBubble.y, clampedY, 0.2));
                this.drawBubble(targetX - this.dialogueBubble.x);
            } else if (this.dialogueBubble) {
                this.dialogueBubble.setPosition(this.professor2.x, this.professor2.y - 70);
                this.drawBubble(0);
            }
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.professor2.x, this.professor2.y);
            this.interactText.setVisible(dist < 60 && !this.dialogueBubble.visible);
        }
    });
  }

  openQuizMenu() {
    openProfessorQuizDialogue(this, {
      slot: this.currentSlot,
      language: this.language,
      quizData: this.quizData[this.language],
      onLevelSelect: (level) => {
        const questions = this.quizData[`level${level}`] || [];
        if (questions.length === 0) {
          console.warn(`⚠️ No questions found for ${this.language} level ${level}`);
          return;
        }
        this.scene.launch("QuizGame", {
          level,
          language: this.language,
          quizData: { questions },
          saveSlot: this.currentSlot,
        });
        this.scene.bringToTop("QuizGame");
      },
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
  }
}
