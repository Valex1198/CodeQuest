import Phaser from "phaser";
import SchoolLobbyBg from "../assets/SchoolLobby.png";
import SchoolLobbyMap from "../assets/SchoolLobby.json";
import Student1Png from "../assets/Student1.png";
import Student1Json from "../assets/Student1.json";
import Student1Dialogue from "../../../../assets/dialogue/student1.json";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
import { getNPCDialogue } from "../utils/DialogueManager";
import { initNPCMovement, updateNPCMovement } from "../utils/NPCMovementManager";

export class SchoolLobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "SchoolLobbyScene" });
    this.player = null;
    this.currentSlot = null;
    this.leaderboardSpot = null;
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
    this.load.tilemapTiledJSON("schoolLobby", SchoolLobbyMap);
    this.load.image("SchoolLobby", SchoolLobbyBg);
    this.load.atlas("student1", Student1Png, Student1Json);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "SchoolLobby").setOrigin(0.5);

    // Map & collisions
    const map = this.make.tilemap({ key: "schoolLobby" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    // Create Student1 animations
    const directions = ["right", "up", "left", "down"];
    const startFrames = [0, 6, 12, 18];

    directions.forEach((dir, i) => {
      const walkKey = `student1_walk_${dir}`;
      const idleKey = `student1_idle_${dir}`;
      
      if (!this.anims.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames: this.anims.generateFrameNames("student1", {
            prefix: "Student1 ",
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
          frames: this.anims.generateFrameNames("student1", {
            prefix: "Student1 ",
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
    try {
      const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
      this.player = player;
      this.currentSlot = slot;
      this.language = language;

      this.cameras.main.startFollow(this.player, true, 0.8, 0.8);
      this.physics.add.collider(this.player, this.collisionZones);

      // Student1 NPC from Tiled
      const studentLayer = map.getObjectLayer("Student1");
      const studentObj = studentLayer?.objects[0];
      
      // Use Tiled X/Y if found, otherwise use a central fallback
      const studentX = studentObj?.x ?? 480;
      const studentY = studentObj?.y ?? 300;

      this.student1 = this.physics.add.sprite(studentX, studentY, "student1");
      this.student1.setDepth(10); // Ensure he is on top of the background
      this.student1.setScale(1.0);
      this.student1.play("student1_idle_down");
      this.student1.setImmovable(true);
      if (this.student1.body.setAllowGravity) this.student1.body.setAllowGravity(false);
      
      // Set accurate hitbox for 1.0 scale (standard 20x24)
      this.student1.setSize(20, 24).setOffset(6, 24);
      
      this.physics.add.collider(this.player, this.student1);
      this.physics.add.collider(this.student1, this.collisionZones);

      // Student1 Movement Path
      const studentPath = [
        { dir: "up", dist: 50, wait: 2000 },
        { dir: "right", dist: 50, wait: 1500 },
        { dir: "down", dist: 50, wait: 2000 },
        { dir: "left", dist: 50, wait: 1500 }
      ];
      initNPCMovement(this.student1, studentPath, "student1_");

      // Interaction Prompt
      this.interactText = this.add.text(studentX, studentY - 60, "Press E to talk", {
        fontSize: "14px",
        fill: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setVisible(false);

      // Dialogue Bubble
      this.dialogueBubble = this.add.container(studentX, studentY - 90).setVisible(false).setDepth(15);
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
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.student1.x, this.student1.y);
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

            const dialogue = getNPCDialogue(Student1Dialogue, gameState);
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

      setupPortals(this, map, this.player);
      createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
      if (data?.fromPortal) fadeInFromPortal(this, data);

      this.songUI = createSongUI(this, " School Lobby ");
      await launchHUD(this, this.player, this.currentSlot, this.language);

      this.input.keyboard.on("keydown-L", async () => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const userId = storedUser?.id || 1;
        await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, null, storedUser.inventory, storedUser.flags);
        console.log(`💾 Progress saved in slot ${this.currentSlot}`);
      });

      this.input.keyboard.on("keydown-ESC", () => {
        this.scene.start("SaveSlotsScene", { player: this.player, loadSlot: this.currentSlot });
      });
    } catch (err) {
      console.error("Failed to load player:", err);
    }

    // Leaderboard logic
    this.leaderboardSpot = new Phaser.Math.Vector2(480, 126);
    this.leaderboardRadius = 40;
    this.leaderboardHint = this.add.text(0, 0, "Press ENTER to view Leaderboard", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#ffcc00",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 1).setAlpha(0).setVisible(false).setDepth(1000);

    this.input.keyboard.on("keydown-ENTER", () => {
      if (this.leaderboardHint.visible && !this.scene.isActive("LeaderboardScene")) {
        this.scene.launch("LeaderboardScene");
        this.scene.bringToTop("LeaderboardScene");
      }
    });

    // Sync UI position
    this.events.on("postupdate", () => {
        if (this.student1 && this.student1.body) {
            if (this.interactText) this.interactText.setPosition(this.student1.x, this.student1.y - 60);
            if (this.dialogueBubble && this.dialogueBubble.visible) {
                const targetX = this.student1.x;
                const targetY = this.student1.y - 90;
                const cam = this.cameras.main;
                const view = cam.worldView;
                const clampedX = Phaser.Math.Clamp(targetX, view.x + 105, view.x + view.width - 105);
                const clampedY = Phaser.Math.Clamp(targetY, view.y + 65, view.y + view.height - 10);
                this.dialogueBubble.x = Phaser.Math.Linear(this.dialogueBubble.x, clampedX, 0.2);
                this.dialogueBubble.y = Phaser.Math.Linear(this.dialogueBubble.y, clampedY, 0.2);
                this.drawBubble(targetX - this.dialogueBubble.x);
            } else if (this.dialogueBubble) {
                this.dialogueBubble.setPosition(this.student1.x, this.student1.y - 90);
                this.drawBubble(0);
            }
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.student1.x, this.student1.y);
            this.interactText.setVisible(dist < 60 && !this.dialogueBubble.visible);
        }
    });
  }

  update(time) {
    if (!this.player || !this.player.body) return;
    updatePlayer(this.player);

    if (this.student1 && this.student1.body) {
        updateNPCMovement(this.student1, 80, this);
    }

    if (this.portalZones && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }

    if (this.leaderboardSpot) {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.leaderboardSpot.x, this.leaderboardSpot.y);
        const isNear = distance <= this.leaderboardRadius;
        if (isNear) {
          if (!this.leaderboardHint.visible) {
            this.leaderboardHint.setVisible(true);
            this.tweens.add({ targets: this.leaderboardHint, alpha: 1, duration: 200 });
          }
          const bob = Math.sin(time / 250) * 4;
          this.leaderboardHint.setPosition(this.player.x, this.player.y - 42 + bob);
        } else if (this.leaderboardHint.visible) {
          this.tweens.add({ targets: this.leaderboardHint, alpha: 0, duration: 150, onComplete: () => this.leaderboardHint.setVisible(false) });
        }
    }
  }
}
