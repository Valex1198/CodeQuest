import Phaser from "phaser";
import OutsideBg from "../assets/Outside.png";
import OutsideMap from "../assets/outside.json";
import TaxiIdlePng from "../assets/TaxiIdle.png";
import TaxiIdleJson from "../assets/TaxiIdle.json";
import TaxiDrivingPng from "../assets/Taxidriving.png";
import TaxiDrivingJson from "../assets/Taxidriving.json";
import BirdPng from "../assets/BirdSprite.png";
import BirdJson from "../assets/BirdSprite.json";
import SakuraPng from "../assets/NPC5Sakura.png";
import SakuraJson from "../assets/NPC5Sakura.json";
import SakuraDialogue from "../../../../assets/dialogue/sakura.json";
import { Bird } from "../utils/Bird";
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

export class OutsideScene extends Phaser.Scene {
  constructor() {
    super({ key: "OutsideScene" });
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
    this.load.tilemapTiledJSON("outside", OutsideMap);
    this.load.image("Outside", OutsideBg);
    this.load.atlas("idleTaxi", TaxiIdlePng, TaxiIdleJson);
    this.load.atlas("drivingTaxi", TaxiDrivingPng, TaxiDrivingJson);
    this.load.atlas("sakura", SakuraPng, SakuraJson);
    Bird.preload(this, BirdPng, BirdJson);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;
    
    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "Outside").setOrigin(0.5, 0.5);

    // Create taxi animations
    if (!this.anims.exists("taxi_idle")) {
      this.anims.create({
        key: "taxi_idle",
        frames: this.anims.generateFrameNames("idleTaxi", {
          prefix: "TaxiIdle ",
          suffix: ".aseprite",
          start: 0,
          end: 4,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("taxi_driving")) {
      this.anims.create({
        key: "taxi_driving",
        frames: this.anims.generateFrameNames("drivingTaxi", {
          prefix: "Taxidriving ",
          suffix: ".aseprite",
          start: 0,
          end: 4,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Create Sakura animations
    const directions = ["right", "up", "left", "down"];
    const startFrames = [0, 6, 12, 18];

    directions.forEach((dir, i) => {
      const walkKey = `sakura_walk_${dir}`;
      const idleKey = `sakura_idle_${dir}`;
      
      if (!this.anims.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames: this.anims.generateFrameNames("sakura", {
            prefix: "NPC5Sakura ",
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
          frames: this.anims.generateFrameNames("sakura", {
            prefix: "NPC5Sakura ",
            suffix: ".aseprite",
            start: startFrames[i],
            end: startFrames[i],
          }),
          frameRate: 1,
          repeat: -1,
        });
      }
    });

    // Map and collisions
    const map = this.make.tilemap({ key: "outside" });
    this.collisionZones = setupCollisions(this, map, "Collisions");

    // Create Bird Animations
    Bird.createAnimations(this);
    this.birds = this.add.group();

    // Spawn birds from Tiled locations
    const birdObjects = map.getObjectLayer("BirdLocation")?.objects || [];
    birdObjects.forEach(obj => {
        const bird = new Bird(this, obj.x, obj.y);
        this.birds.add(bird);
    });

    this.cameras.main.setZoom(1.5);

    // Default player position
    const defaultX = data?.x ?? 500;
    const defaultY = data?.y ?? 400;

    // Load player
    const { player, slot, language, saveData } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = slot;
    this.language = language;

    // Fix Camera Delay: Increase lerp to 0.8 for responsive movement
    this.cameras.main.startFollow(this.player, true, 0.8, 0.8);

    // Add taxi
    const taxiShouldBeHere = !saveData?.taxi || saveData.taxi.scene === "OutsideScene";
    const taxi = this.physics.add.sprite(176.00, 495.33, "idleTaxi");
    taxi.setScale(1.5);
    taxi.play("taxi_idle");
    taxi.setImmovable(true);
    if (taxi.body.setAllowGravity) taxi.body.setAllowGravity(false);
    this.taxi = taxi;
    
    if (!taxiShouldBeHere && !data?.returningByTaxi) {
        taxi.setVisible(false);
        taxi.setActive(false);
        if (taxi.body) taxi.body.enable = false;
    }

    // Sakura NPC from Tiled
    const sakuraObj = map.getObjectLayer("NPCSakura")?.objects[0];
    const sakuraX = sakuraObj?.x ?? 386;
    const sakuraY = sakuraObj?.y ?? 269;

    this.sakura = this.physics.add.sprite(sakuraX, sakuraY, "sakura");
    this.sakura.setDepth(5);
    this.sakura.play("sakura_idle_down");
    this.sakura.setImmovable(true);
    if (this.sakura.body.setAllowGravity) this.sakura.body.setAllowGravity(false);
    
    // FIX: Set a smaller, more accurate hitbox for Sakura (centered at feet)
    this.sakura.setSize(20, 24).setOffset(6, 24);
    
    // FIX: Add Collisions for Sakura
    this.physics.add.collider(this.player, this.sakura);
    this.physics.add.collider(this.sakura, this.collisionZones);
    if (this.taxi) this.physics.add.collider(this.sakura, this.taxi);

    // Sakura Movement Path
    const sakuraPath = [
      { dir: "right", dist: 100, wait: 2000 },
      { dir: "left", dist: 100, wait: 2000 }
    ];
    initNPCMovement(this.sakura, sakuraPath, "sakura_");

    // Interaction Prompt
    this.interactText = this.add.text(sakuraX, sakuraY - 40, "Press E to talk", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setVisible(false);

    // Dialogue Bubble
    this.dialogueBubble = this.add.container(sakuraX, sakuraY - 70).setVisible(false).setDepth(15);
    this.bubbleBg = this.add.graphics();
    this.drawBubble(0);
    this.dialogueText = this.add.text(0, -30, "", {
      fontSize: "12px",
      fill: "#ffffff",
      wordWrap: { width: 180 },
      align: "center"
    }).setOrigin(0.5);
    this.dialogueBubble.add([this.bubbleBg, this.dialogueText]);

    // Handle Arrival from School
    if (data?.returningByTaxi) {
        this.player.setVisible(false);
        taxi.setVisible(true);
        taxi.setActive(true);
        if (taxi.body) taxi.body.enable = true;
        this.isArrivalSequence = true;
        taxi.setPosition(5, 495);
        taxi.play("taxi_driving");

        this.cameras.main.stopFollow();
        this.cameras.main.startFollow(taxi, true, 0.8, 0.8);

        this.tweens.add({
            targets: taxi,
            x: 176,
            duration: 2000,
            ease: "Power2",
            onComplete: async () => {
                taxi.play("taxi_idle");
                this.isArrivalSequence = false;

                const storedUser = JSON.parse(localStorage.getItem("user"));
                const userId = storedUser?.id || 1;
                const taxiData = {
                    scene: this.scene.key,
                    x: taxi.x,
                    y: taxi.y
                };
                await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, taxiData, storedUser.inventory, storedUser.flags);

                this.time.delayedCall(500, () => {
                    this.player.setVisible(true);
                    this.player.setPosition(taxi.x, taxi.y);
                    this.player.play("walk_up");
                    this.isAutoMoving = true;
                    
                    this.tweens.add({
                        targets: this.player,
                        y: taxi.y - 40,
                        duration: 800,
                        onComplete: () => {
                            this.isAutoMoving = false;
                            this.cameras.main.startFollow(this.player, true, 0.8, 0.8);
                        }
                    });
                });
            }
        });
    }

    // Interaction with Sakura
    this.input.keyboard.on("keydown-E", () => {
      if (this.isDriving || this.isAutoMoving) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.sakura.x, this.sakura.y);
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

          const dialogue = getNPCDialogue(SakuraDialogue, gameState);
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

    // Keybind ENTER for taxi
    this.input.keyboard.on("keydown-ENTER", () => {
      if (!taxi.visible || this.isAutoMoving) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, taxi.x, taxi.y);
      
      if (distance < 150 && this.player.visible) {
        this.isAutoMoving = true;
        const dx = taxi.x - this.player.x;
        const dy = taxi.y - this.player.y;
        let dir = "down";
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? "right" : "left";
        } else {
          dir = dy > 0 ? "down" : "up";
        }
        this.player.play(`walk_${dir}`, true);
        taxi.setDepth(this.player.depth + 1);

        this.tweens.add({
          targets: this.player,
          x: taxi.x,
          y: taxi.y + 10,
          duration: 800,
          onComplete: () => {
            this.player.setVisible(false);
            if (this.player.body) this.player.body.enable = false;
            this.cameras.main.stopFollow();
            this.cameras.main.startFollow(taxi, true, 0.8, 0.8);
            taxi.play("taxi_driving");
            this.isDriving = true; 
            this.isAutoMoving = false;
          }
        });
      }
    });
    
    this.physics.add.collider(this.player, this.collisionZones);
    if (data?.fromPortal) fadeInFromPortal(this, data);
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    this.songUI = createSongUI(this, " Outside Theme ");
    await launchHUD(this, this.player, this.currentSlot, this.language);

    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      const taxiData = { scene: this.scene.key, x: this.taxi.x, y: this.taxi.y };
      await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, taxiData, storedUser.inventory, storedUser.flags);
      console.log(`💾 Progress saved in slot ${this.currentSlot}`);
    });

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", { player: this.player, loadSlot: this.currentSlot });
    });

    // Sync UI position
    this.events.on("postupdate", () => {
        if (this.sakura && this.sakura.body) {
            if (this.interactText) this.interactText.setPosition(this.sakura.x, this.sakura.y - 40);
            if (this.dialogueBubble && this.dialogueBubble.visible) {
                const targetX = this.sakura.x;
                const targetY = this.sakura.y - 70;
                const cam = this.cameras.main;
                const view = cam.worldView;
                const clampedX = Phaser.Math.Clamp(targetX, view.x + 105, view.x + view.width - 105);
                const clampedY = Phaser.Math.Clamp(targetY, view.y + 65, view.y + view.height - 10);
                this.dialogueBubble.x = Math.round(Phaser.Math.Linear(this.dialogueBubble.x, clampedX, 0.2));
                this.dialogueBubble.y = Math.round(Phaser.Math.Linear(this.dialogueBubble.y, clampedY, 0.2));
                this.drawBubble(targetX - this.dialogueBubble.x);
            } else if (this.dialogueBubble) {
                this.dialogueBubble.setPosition(this.sakura.x, this.sakura.y - 70);
                this.drawBubble(0);
            }
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.sakura.x, this.sakura.y);
            this.interactText.setVisible(dist < 60 && !this.dialogueBubble.visible);
        }
    });
  }

  update() {
    if (!this.player || !this.player.body) return;
    updatePlayer(this.player, 200, this.isDriving || this.isAutoMoving || this.isArrivalSequence);

    if (this.sakura && this.sakura.body) {
        updateNPCMovement(this.sakura, 80, this);
    }

    if (this.isDriving && this.taxi) {
        this.taxi.x += 2;
        if (this.taxi.x > 600) {
            const alpha = Phaser.Math.Clamp(1 - (this.taxi.x - 600) / (960 - 600), 0, 1);
            this.taxi.setAlpha(alpha);
        }
        if (this.taxi.x > 960) {
            this.scene.start("SchoolScene", {
                loadSlot: this.currentSlot,
                arrivingByTaxi: true,
                x: 410,
                y: 255
            });
            this.isDriving = false;
        }
    }

    if (this.portalZones && this.player.keys && !this.isDriving && !this.isAutoMoving && !this.isArrivalSequence) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }

    if (this.birds) {
        this.birds.getChildren().forEach(bird => {
            bird.update(this.player, this.taxi);
        });
    }
  }
}
