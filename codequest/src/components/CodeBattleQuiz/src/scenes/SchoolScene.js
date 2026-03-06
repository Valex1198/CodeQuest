import Phaser from "phaser";
import SchoolBg from "../assets/school.png";
import SchoolMap from "../assets/school.json";
import TaxiIdlePng from "../assets/TaxiIdle.png";
import TaxiIdleJson from "../assets/TaxiIdle.json";
import TaxiDrivingPng from "../assets/Taxidriving.png";
import TaxiDrivingJson from "../assets/Taxidriving.json";
import BirdPng from "../assets/BirdSprite.png";
import BirdJson from "../assets/BirdSprite.json";
import { Bird } from "../utils/Bird";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";

export class SchoolScene extends Phaser.Scene {
  constructor() {
    super({ key: "SchoolScene" });
    this.player = null;
    this.currentSlot = null;
  }

  preload() {
    this.load.tilemapTiledJSON("school", SchoolMap);
    this.load.image("School", SchoolBg);
    this.load.atlas("idleTaxi", TaxiIdlePng, TaxiIdleJson);
    this.load.atlas("drivingTaxi", TaxiDrivingPng, TaxiDrivingJson);
    Bird.preload(this, BirdPng, BirdJson);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "School").setOrigin(0.5, 0.5);

    // Map & collisions
    const map = this.make.tilemap({ key: "school" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    // Create Bird Animations
    Bird.createAnimations(this);
    this.birds = this.add.group();

    // Spawn birds from Tiled locations
    const birdObjects = map.getObjectLayer("BirdLocation")?.objects || [];
    birdObjects.forEach(obj => {
        const bird = new Bird(this, obj.x, obj.y);
        this.birds.add(bird);
    });

    // Create taxi animations if they don't exist
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

    // Default player position
    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    // Load player
    const { player, slot, language, saveData } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = slot;
    this.language = language;
    this.physics.add.collider(this.player, this.collisionZones);

    // Static taxi if saved here
    if (saveData?.taxi?.scene === "SchoolScene" && !data?.arrivingByTaxi) {
        const taxi = this.physics.add.sprite(saveData.taxi.x, saveData.taxi.y, "idleTaxi");
        this.taxi = taxi;
        taxi.setScale(1.5);
        taxi.setFlipX(true);
        taxi.play("taxi_idle");
        taxi.setImmovable(true);
        if (taxi.body.setAllowGravity) taxi.body.setAllowGravity(false);
        taxi.setSize(96, 48).setOffset(4, 12);
        this.physics.add.collider(this.player, taxi);

        // Return prompt
        this.returnText = this.add.text(taxi.x, taxi.y - 50, "Press ENTER to return", {
            fontSize: "16px",
            fill: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: { x: 6, y: 2 }
        }).setOrigin(0.5).setVisible(false);
    }

    // Handle Taxi Arrival
    if (data?.arrivingByTaxi) {
      this.player.setVisible(false);
      this.player.setPosition(410, 265); // Position player behind car to "get out"
      
      const taxi = this.physics.add.sprite(905, 255, "drivingTaxi");
      this.taxi = taxi; // Store for return logic
      taxi.setScale(1.5);
      taxi.setFlipX(true); // Facing left
      taxi.play("taxi_driving");
      taxi.setDepth(this.player.depth + 1);
      taxi.setImmovable(true);
      if (taxi.body.setAllowGravity) taxi.body.setAllowGravity(false);

      // Hitbox for 144x72 scaled taxi (96x48 * 1.5)
      // Moved box 20px to the left (offset 24 -> 4)
      taxi.setSize(96, 48).setOffset(4, 12);

      this.cameras.main.stopFollow();
      this.cameras.main.startFollow(taxi, true, 0.1, 0.1);

      // Start transparent for fade-in arrival
      taxi.setAlpha(0);
      this.tweens.add({
          targets: taxi,
          alpha: 1,
          duration: 1000
      });

      this.tweens.add({
        targets: taxi,
        x: 410,
        y: 255,
        duration: 5000, // Slower arrival speed to match Outside
        ease: "Linear",
        onComplete: () => {
          taxi.play("taxi_idle");
          
          // Player "gets out"
          this.time.delayedCall(500, () => {
            this.player.setVisible(true);
            this.player.setPosition(taxi.x, taxi.y); 
            this.player.play("walk_up");
            this.isAutoMoving = true; // Enable auto-move for animation
            
            this.tweens.add({
              targets: this.player,
              y: taxi.y - 20, // Walk UP 20 pixels
              duration: 500,
              onComplete: () => {
                this.isAutoMoving = false; // Disable auto-move
                this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
                // Enable collision now that player is out
                this.physics.add.collider(this.player, taxi);
                
                // Initialize return prompt
                this.returnText = this.add.text(taxi.x, taxi.y - 50, "Press ENTER to return", {
                    fontSize: "16px",
                    fill: "#ffffff",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    padding: { x: 6, y: 2 }
                }).setOrigin(0.5).setVisible(false);
                
                console.log("🚕 Taxi parked with collision and prompt ready.");
              }
            });
          });
        }
      });
    } else if (data?.fromPortal) {
      fadeInFromPortal(this, data);
    }

    // Portals
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    // Song UI
    this.songUI = createSongUI(this, " School ");
    await launchHUD(this, this.player, this.currentSlot, this.language);

    // HUD overlay
    

    // Keybind ENTER for returning
    this.input.keyboard.on("keydown-ENTER", () => {
        if (!this.taxi || !this.player.visible || this.isAutoMoving) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.taxi.x, this.taxi.y);
        
        if (dist < 150 && !this.isReturning) {
            console.log("🚶 Player walking to taxi at school...");
            this.isAutoMoving = true;

            // 1. Determine direction for animation
            const dx = this.taxi.x - this.player.x;
            const dy = this.taxi.y - this.player.y;
            let dir = "down";
            if (Math.abs(dx) > Math.abs(dy)) {
                dir = dx > 0 ? "right" : "left";
            } else {
                dir = dy > 0 ? "down" : "up";
            }
            this.player.play(`walk_${dir}`, true);

            // 2. Walk to the taxi
            this.tweens.add({
                targets: this.player,
                x: this.taxi.x,
                y: this.taxi.y + 10,
                duration: 800,
                ease: "Linear",
                onComplete: () => {
                    console.log("?? Returning to the city...");
                    this.isReturning = true;
                    this.player.setVisible(false);
                    if (this.player.body) this.player.body.enable = false;
                    
                    this.cameras.main.stopFollow();
                    this.cameras.main.startFollow(this.taxi, true, 0.1, 0.1);
                    
                    this.taxi.play("taxi_driving");
                    if (this.returnText) this.returnText.destroy();
                    this.isAutoMoving = false;
                }
            });
        }
    });

    // Save hotkey
    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      
      const taxiData = this.taxi ? {
          scene: this.scene.key,
          x: this.taxi.x,
          y: this.taxi.y
      } : null;

      await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, taxiData);
      console.log(`?? Player and Taxi saved in slot ${this.currentSlot}`);
    });

    // ESC → go to SaveSlotsScene
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", {
        player: this.player,
        loadSlot: this.currentSlot,
      });
    });
  }

  update() {
    if (!this.player || !this.player.body) return;

    // Proximity check for return prompt
    if (this.taxi && this.returnText && !this.isReturning) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.taxi.x, this.taxi.y);
        if (dist < 100) {
            this.returnText.setPosition(this.taxi.x, this.taxi.y - 50);
            this.returnText.setVisible(true);
        } else {
            this.returnText.setVisible(false);
        }
    }

    if (this.isReturning && this.taxi) {
        // Drive left to exit
        this.taxi.x -= 2;
        this.taxi.setFlipX(true); // Ensure it's facing left

        // Fade out as it approaches the left edge (starts fading at X=150)
        if (this.taxi.x < 150) {
            const alpha = Phaser.Math.Clamp(this.taxi.x / 150, 0, 1);
            this.taxi.setAlpha(alpha);
        }

        if (this.taxi.x < -100) {
            console.log("?? Heading back to City...");
            this.scene.start("OutsideScene", {
                loadSlot: this.currentSlot,
                returningByTaxi: true,
                x: 176, // Final stop point in Outside
                y: 495
            });
            this.isReturning = false;
        }
    } else if (!this.isAutoMoving) {
        // Only update manual player controls if not auto-moving
        updatePlayer(this.player);
    }

    // Update portals safely
    if (this.portalZones && this.player.keys && !this.isReturning && !this.isAutoMoving) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }

    // Update Birds
    if (this.birds) {
        this.birds.getChildren().forEach(bird => {
            bird.update(this.player, this.taxi);
        });
    }
  }
}
