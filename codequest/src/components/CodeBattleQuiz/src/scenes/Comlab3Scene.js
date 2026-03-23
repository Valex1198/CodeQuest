import Phaser from "phaser";
import Comlab3Bg from "../assets/Comlab3.png";
import Comlab3Map from "../assets/comlab3.json";
import Professor1Img from "../assets/Professor1.png";
import EKeyImg from "../assets/E-Key.png";
import ProfessorTasksDialogue from "../../../../assets/dialogue/professor_tasks.json";
import { createMenuButton } from "../utils/uiHelpers.js";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil";
import { showTaskCompletionOverlay } from "../utils/completeTaskUtil";
import { openProfessorDialog } from "../utils/professorDialogUtil";
import { getNPCDialogue, handleDialogueActions } from "../utils/DialogueManager";

export class Comlab3Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Comlab3Scene" });
    this.player = null;
    this.currentSlot = null;
    this.language = "Python";
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
    this.load.tilemapTiledJSON("comlab3", Comlab3Map);
    this.load.image("Comlab3", Comlab3Bg);
    this.load.spritesheet("EKey", EKeyImg, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("Professor1", Professor1Img, { frameWidth: 32, frameHeight: 48 });

    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    // ----------------------------
    // Slot & language
    // ----------------------------
    this.currentSlot = data?.slotId ?? data?.loadSlot ?? 1;
    this.language = data?.language ?? "Python";

    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    // Load player
    const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = data?.slotId ?? slot ?? 1;
    this.language = data?.language ?? language ?? "Python";

    // ----------------------------
    // Map & collisions
    // ----------------------------
    const map = this.make.tilemap({ key: "comlab3" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.physics.add.collider(this.player, this.collisionZones);

    // ----------------------------
    // Background
    // ----------------------------
    this.add.image(map.widthInPixels / 2, map.heightInPixels / 2, "Comlab3").setOrigin(0.5);

    // ----------------------------
    // Portals
    // ----------------------------
    setupPortals(this, map, this.player);
    if (data?.fromPortal) fadeInFromPortal(this, data);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    // ----------------------------
    // Song UI & HUD
    // ----------------------------
    this.songUI = createSongUI(this, "Comlab 3");
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
    if (!this.anims.exists("professor1_idle")) {
      this.anims.create({
        key: "professor1_idle",
        frames: this.anims.generateFrameNumbers("Professor1", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    this.professor1 = this.physics.add.sprite(210, 220, "Professor1");
    this.professor1.body.immovable = true;
    this.professor1.body.allowGravity = false;
    this.professor1.play("professor1_idle");
    this.physics.add.collider(this.player, this.professor1);

    // Interaction Prompt
    this.interactText = this.add.text(this.professor1.x, this.professor1.y - 40, "Press E to talk", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(1002);

    // Dialogue Bubble
    this.dialogueBubble = this.add.container(this.professor1.x, this.professor1.y - 70).setVisible(false).setDepth(15);
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
    // E → Professor Dialog
    // ----------------------------
    this.input.keyboard.on("keydown-E", () => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.professor1.x,
        this.professor1.y
      );

      if (dist <= 60) {
        if (this.dialogueBubble.visible) {
          this.dialogueBubble.setVisible(false);
          if (this.dialogueTimer) this.dialogueTimer.remove();
          this.openTaskMenu();
        } else {
          const storedUser = JSON.parse(localStorage.getItem("user")) || {};
          const gameState = {
            flags: storedUser.flags || {},
            quests: storedUser.quests || {},
            inventory: storedUser.inventory || [],
            user: storedUser
          };

          const dialogue = getNPCDialogue(ProfessorTasksDialogue, gameState);
          if (dialogue) {
            this.dialogueText.setText(dialogue.text);
            this.dialogueBubble.setVisible(true);
            
            if (!storedUser.flags) storedUser.flags = {};
            storedUser.flags.met_professor_tasks = true;
            localStorage.setItem("user", JSON.stringify(storedUser));

            if (this.dialogueTimer) this.dialogueTimer.remove();
            this.dialogueTimer = this.time.delayedCall(2000, () => {
              this.dialogueBubble.setVisible(false);
              this.openTaskMenu();
            });
          }
        }
      }
    });

    // ----------------------------
    // ESC → SaveSlots
    // ----------------------------
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", {
        player: this.player,
        loadSlot: this.currentSlot,
      });
    });

    // ----------------------------
    // Task completion overlay
    // ----------------------------
    if (data?.taskCompleted) {
      showTaskCompletionOverlay(this, data.taskCompleted);
    }

    // Sync UI position
    this.events.on("postupdate", () => {
        if (this.professor1 && this.professor1.body) {
            if (this.interactText) this.interactText.setPosition(this.professor1.x, this.professor1.y - 40);
            if (this.dialogueBubble && this.dialogueBubble.visible) {
                const targetX = this.professor1.x;
                const targetY = this.professor1.y - 70;
                const cam = this.cameras.main;
                const view = cam.worldView;
                const clampedX = Phaser.Math.Clamp(targetX, view.x + 105, view.x + view.width - 105);
                const clampedY = Phaser.Math.Clamp(targetY, view.y + 65, view.y + view.height - 10);
                
                this.dialogueBubble.x = Math.round(Phaser.Math.Linear(this.dialogueBubble.x, clampedX, 0.2));
                this.dialogueBubble.y = Math.round(Phaser.Math.Linear(this.dialogueBubble.y, clampedY, 0.2));
                this.drawBubble(targetX - this.dialogueBubble.x);
            } else if (this.dialogueBubble) {
                this.dialogueBubble.setPosition(this.professor1.x, this.professor1.y - 70);
                this.drawBubble(0);
            }
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.professor1.x, this.professor1.y);
            this.interactText.setVisible(dist < 60 && !this.dialogueBubble.visible);
        }
    });
  }

  openTaskMenu() {
    openProfessorDialog(this, {
      slot: this.currentSlot,
      language: this.language,
    });
  }

  update() {
    if (!this.player?.body) return;

    updatePlayer(this.player);
    this.player.setDepth(this.player.y);

    // Guard professor1
    if (this.professor1) {
        this.professor1.setDepth(this.professor1.y);
    }

    if (this.portalZones && this.player.keys) {
        handlePortalUpdate(this, this.player, this.player.keys);
    }
}
  
}
