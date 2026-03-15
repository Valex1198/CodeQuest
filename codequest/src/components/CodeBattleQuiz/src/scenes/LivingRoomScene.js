import Phaser from "phaser";
import LivingRoomBg from "../assets/LivingRoom.png";
import LivingRoomMap from "../assets/LivingRoom.json";
import MotherPng from "../assets/Mother.png";
import MotherJson from "../assets/Mother.json";
import MotherDialogue from "../../../../assets/dialogue/mother.json";
import { getNPCDialogue } from "../utils/DialogueManager";
import { initNPCMovement, updateNPCMovement } from "../utils/NPCMovementManager";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";

export class LivingRoomScene extends Phaser.Scene {
  constructor() {
    super({ key: "LivingRoomScene" });
    this.player = null;
    this.currentSlot = null;
    this.dialogueTimer = null;
  }

  drawBubble(arrowX = 0) {
    if (!this.bubbleBg) return;
    const graphics = this.bubbleBg;
    graphics.clear();
    graphics.fillStyle(0x000000, 0.8);
    graphics.lineStyle(2, 0xffffff, 1);
    
    // Bubble rectangle
    graphics.fillRoundedRect(-100, -60, 200, 60, 10);
    graphics.strokeRoundedRect(-100, -60, 200, 60, 10);
    
    // Arrow (Triangle)
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
    this.load.tilemapTiledJSON("livingRoom", LivingRoomMap);
    this.load.image("LivingRoom", LivingRoomBg);
    this.load.atlas("mother", MotherPng, MotherJson);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "LivingRoom").setOrigin(0.5, 0.5);

    // Map setup
    const map = this.make.tilemap({ key: "livingRoom" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    // Create animations
    const directions = ["right", "up", "left", "down"];
    const startFrames = [0, 6, 12, 18];

    directions.forEach((dir, i) => {
      const walkKey = `mother_walk_${dir}`;
      const idleKey = `mother_idle_${dir}`;
      
      if (!this.anims.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames: this.anims.generateFrameNames("mother", {
            prefix: "Mother ",
            suffix: ".aseprite",
            start: startFrames[i],
            end: startFrames[i] + 5,
          }),
          frameRate: 6,
          repeat: -1,
        });
      }

      if (!this.anims.exists(idleKey)) {
        this.anims.create({
          key: idleKey,
          frames: this.anims.generateFrameNames("mother", {
            prefix: "Mother ",
            suffix: ".aseprite",
            start: startFrames[i],
            end: startFrames[i],
          }),
          frameRate: 1,
          repeat: -1,
        });
      }
    });

    // Default player position
    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    // Load player
    const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.player.setDepth(10);
    this.currentSlot = slot;
    this.language = language;

    // Fix Camera Delay: Increase lerp to 0.8 for responsive movement
    this.cameras.main.startFollow(this.player, true, 0.8, 0.8);

    this.physics.add.collider(this.player, this.collisionZones);

    // Mother NPC from Tiled
    const motherObj = map.getObjectLayer("Mother")?.objects[0];
    const motherX = motherObj?.x ?? 480;
    const motherY = motherObj?.y ?? 250;

    this.mother = this.physics.add.sprite(motherX, motherY, "mother");
    this.mother.setDepth(5);
    this.mother.play("mother_idle_down");
    this.mother.setImmovable(true); 
    if (this.mother.body.setAllowGravity) this.mother.body.setAllowGravity(false);
    this.physics.add.collider(this.player, this.mother);
    this.physics.add.collider(this.mother, this.collisionZones); 

    // Mother Patrol Path
    const motherPath = [
      { dir: "left", dist: 100, wait: 2000 },
      { dir: "down", dist: 50, wait: 1000 },
      { dir: "right", dist: 100, wait: 2000 },
      { dir: "up", dist: 50, wait: 1000 }
    ];
    initNPCMovement(this.mother, motherPath, "mother_");

    // Interaction Prompt
    this.interactText = this.add.text(motherX, motherY - 40, "Press E to talk", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setVisible(false);

    // Dialogue Bubble
    this.dialogueBubble = this.add.container(motherX, motherY - 70).setVisible(false).setDepth(15);
    this.bubbleBg = this.add.graphics();
    this.drawBubble(0);
    this.dialogueText = this.add.text(0, -30, "", {
      fontSize: "12px",
      fill: "#ffffff",
      wordWrap: { width: 180 },
      align: "center"
    }).setOrigin(0.5);
    this.dialogueBubble.add([this.bubbleBg, this.dialogueText]);

    // Handle Interaction
    this.input.keyboard.on("keydown-E", () => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mother.x, this.mother.y);
      if (dist < 60) {
        if (this.dialogueBubble.visible) {
          this.dialogueBubble.setVisible(false);
          if (this.dialogueTimer) this.dialogueTimer.remove();
        } else {
          const storedUser = JSON.parse(localStorage.getItem("user")) || {};
          const gameState = {
            flags: storedUser.flags || {},
            quests: storedUser.quests || {},
            inventory: storedUser.inventory || [],
            user: storedUser
          };

          const dialogue = getNPCDialogue(MotherDialogue, gameState);
          if (dialogue) {
            this.dialogueText.setText(dialogue.text);
            this.dialogueBubble.setVisible(true);

            if (this.dialogueTimer) this.dialogueTimer.remove();
            this.dialogueTimer = this.time.delayedCall(5000, () => {
              this.dialogueBubble.setVisible(false);
            });
          }
        }
      }
    });

    if (data?.fromPortal) fadeInFromPortal(this, data);
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });

    // Sync UI position
    this.events.on("postupdate", () => {
        if (this.mother && this.mother.body) {
            if (this.interactText) this.interactText.setPosition(this.mother.x, this.mother.y - 40);
            if (this.dialogueBubble && this.dialogueBubble.visible) {
                const targetX = this.mother.x;
                const targetY = this.mother.y - 70;
                const cam = this.cameras.main;
                const view = cam.worldView;
                const clampedX = Phaser.Math.Clamp(targetX, view.x + 105, view.x + view.width - 105);
                const clampedY = Phaser.Math.Clamp(targetY, view.y + 65, view.y + view.height - 10);
                this.dialogueBubble.x = Phaser.Math.Linear(this.dialogueBubble.x, clampedX, 0.2);
                this.dialogueBubble.y = Phaser.Math.Linear(this.dialogueBubble.y, clampedY, 0.2);
                this.drawBubble(targetX - this.dialogueBubble.x);
            } else if (this.dialogueBubble) {
                this.dialogueBubble.setPosition(this.mother.x, this.mother.y - 70);
                this.drawBubble(0);
            }
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mother.x, this.mother.y);
            this.interactText.setVisible(dist < 60 && !this.dialogueBubble.visible);
        }
    });

    await launchHUD(this, this.player, this.currentSlot, this.language);
    this.songUI = createSongUI(this, "Living Room");

    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, null, storedUser.inventory, storedUser.flags);
      console.log(`💾 Player saved in slot ${this.currentSlot}`);
    });

    this.scene.launch("InventoryOverlay");
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", { player: this.player, loadSlot: this.currentSlot });
    });
  }

  update() {
    if (!this.player || !this.player.body) return;
    updatePlayer(this.player);
    if (this.mother && this.mother.body) updateNPCMovement(this.mother, 80, this);
    if (this.portalZones && this.enterText && this.player.keys) handlePortalUpdate(this, this.player, this.player.keys);
  }
}
