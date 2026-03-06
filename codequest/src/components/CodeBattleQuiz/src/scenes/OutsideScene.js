  import Phaser from "phaser";
  import OutsideBg from "../assets/Outside.png";
  import OutsideMap from "../assets/outside.json";
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
  export class OutsideScene extends Phaser.Scene {
    constructor() {
      super({ key: "OutsideScene" });
      this.player = null;
      this.currentSlot = null;
    }

    preload() {
      this.load.tilemapTiledJSON("outside", OutsideMap);
      this.load.image("Outside", OutsideBg);
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
      this.add.image(canvasWidth / 2, canvasHeight / 2, "Outside").setOrigin(0.5, 0.5);

      // Create taxi animation if it doesn't exist
      if (!this.anims.exists("taxi_idle")) {
        this.anims.create({
          key: "taxi_idle",
          frames: this.anims.generateFrameNames("idleTaxi", {
            prefix: "TaxiIdle ",
            suffix: ".aseprite",
            start: 0,
            end: 4,
          }),
          frameRate: 6, // Slower idle speed
          repeat: -1,
        });
      }

      // Create driving animation
      if (!this.anims.exists("taxi_driving")) {
        this.anims.create({
          key: "taxi_driving",
          frames: this.anims.generateFrameNames("drivingTaxi", {
            prefix: "Taxidriving ",
            suffix: ".aseprite",
            start: 0,
            end: 4,
          }),
          frameRate: 12, // Faster speed for driving
          repeat: -1,
        });
      }

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

      this.cameras.main.setZoom(1.5); // Restore zoom level

      // Default player position
      const defaultX = data?.x ?? 500;
      const defaultY = data?.y ?? 400;

      // Load player
      const { player, slot, language, saveData } = await loadPlayer(this, data, defaultX, defaultY);
      this.player = player;
      this.currentSlot = slot;
      this.language = language;

      // Add taxi at specified coordinates (only if not saved elsewhere)
      const taxiShouldBeHere = !saveData?.taxi || saveData.taxi.scene === "OutsideScene";
      const taxi = this.add.sprite(176.00, 495.33, "idleTaxi");
      taxi.setScale(1.5);
      taxi.play("taxi_idle");
      this.taxi = taxi;
      
      if (!taxiShouldBeHere && !data?.returningByTaxi) {
          taxi.setVisible(false);
          taxi.setActive(false);
      }

      // Handle Return Arrival from School
      if (data?.returningByTaxi) {
          this.player.setVisible(false); // Hide immediately
          taxi.setVisible(true);
          taxi.setActive(true);
          this.isArrivalSequence = true;
          taxi.setPosition(5, 495); // Start at the left edge
          taxi.play("taxi_driving");

          this.cameras.main.stopFollow();
          this.cameras.main.startFollow(taxi, true, 0.1, 0.1);

          this.tweens.add({
              targets: taxi,
              x: 176,
              duration: 2000,
              ease: "Power2",
              onComplete: () => {
                  taxi.play("taxi_idle");
                  this.isArrivalSequence = false;

                  // Player gets out
                  this.time.delayedCall(500, () => {
                      this.player.setVisible(true);
                      this.player.setPosition(taxi.x, taxi.y); // Start at car
                      this.player.play("walk_up");
                      this.isAutoMoving = true; // Block updatePlayer
                      
                      this.tweens.add({
                          targets: this.player,
                          y: taxi.y - 40, // Move UP 40 pixels
                          duration: 800,
                          onComplete: () => {
                              this.isAutoMoving = false; // Allow updatePlayer again
                              this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
                          }
                      });
                  });
              }
          });
      }

      // Keybind 'ENTER' to simulate getting into the car
      this.input.keyboard.on("keydown-ENTER", () => {
        // Only trigger if player is close to the taxi (e.g., within 100 pixels)
        if (!taxi.visible) return;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, taxi.x, taxi.y);
        
        if (distance < 150 && this.player.visible && !this.isAutoMoving) {
          console.log("🚶 Player walking to the taxi...");
          this.isAutoMoving = true; // Disable manual control in update()
          
          // 1. Determine direction for animation
          const dx = taxi.x - this.player.x;
          const dy = taxi.y - this.player.y;
          let dir = "down";
          if (Math.abs(dx) > Math.abs(dy)) {
            dir = dx > 0 ? "right" : "left";
          } else {
            dir = dy > 0 ? "down" : "up";
          }
          this.player.play(`walk_${dir}`, true);

          // 2. Set depths so the taxi is "on top" of the player as they enter
          taxi.setDepth(this.player.depth + 1);

          // 3. Disable physics body so they don't bump into things
          if (this.player.body) this.player.body.setVelocity(0, 0);

          // 4. Walk to the taxi
          this.tweens.add({
            targets: this.player,
            x: taxi.x,
            y: taxi.y + 10, // Move slightly to the center-bottom of the car
            duration: 800,
            ease: "Linear",
            onComplete: () => {
              console.log("🚗 Getting into the taxi...");
              
              // Hide the player
              this.player.setVisible(false);
              if (this.player.body) this.player.body.enable = false;

              // Follow taxi and zoom
              this.cameras.main.stopFollow();
              this.cameras.main.startFollow(taxi, true, 0.1, 0.1);
              this.cameras.main.zoomTo(1.5, 500);

              // Switch to driving animation and start moving
              taxi.play("taxi_driving");
              
              // Disable portal enter text
              if (this.enterText) this.enterText.setVisible(false);
              this.isDriving = true; 
              this.isAutoMoving = false;
            }
          });
        }
      });
      
      this.physics.add.collider(this.player, this.collisionZones);

      // Fade in if coming from a portal
      if (data?.fromPortal) fadeInFromPortal(this, data);
      
      // Portals
      setupPortals(this, map, this.player);
      createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
      // Song UI
      this.songUI = createSongUI(this, " Outside Theme ");

      // HUD overlay
      await launchHUD(this, this.player, this.currentSlot, this.language);
      // Save hotkey (L)
      this.input.keyboard.on("keydown-L", async () => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const userId = storedUser?.id || 1;
        // Include taxi data in save
        const taxiData = {
            scene: this.scene.key,
            x: this.taxi.x,
            y: this.taxi.y
        };
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

      if (this.isDriving && this.taxi) {
        // Move the taxi to the right at a slower speed
        this.taxi.x += 2;

        // Decrease opacity as it approaches the edge (start fading at X=600 for longer fade)
        if (this.taxi.x > 600) {
            const fadeStart = 600;
            const fadeEnd = 960;
            const alpha = Phaser.Math.Clamp(1 - (this.taxi.x - fadeStart) / (fadeEnd - fadeStart), 0, 1);
            this.taxi.setAlpha(alpha);
        }

        // Check if taxi hit the right edge (960)
        if (this.taxi.x > 960) {
            console.log("?? Arrived at School!");
            this.scene.start("SchoolScene", {
                loadSlot: this.currentSlot,
                fromPortal: false, // Don't use standard portal fade
                arrivingByTaxi: true, // New flag for SchoolScene
                x: 410, // Target drop-off point
                y: 255
            });
            this.isDriving = false; // Prevent multiple triggers
        }
      } else if (!this.isAutoMoving) {
        // Only update manual player controls if not auto-moving
        updatePlayer(this.player);
      }

      // Update portals safely
      if (this.portalZones && this.player.keys && !this.isDriving && !this.isAutoMoving) {
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
