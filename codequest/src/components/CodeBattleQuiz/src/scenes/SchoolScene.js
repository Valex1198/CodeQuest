import Phaser from "phaser";
import SchoolBg from "../assets/school.png";
import SchoolMap from "../assets/school.json";
import TaxiIdlePng from "../assets/TaxiIdle.png";
import TaxiIdleJson from "../assets/TaxiIdle.json";
import TaxiDrivingPng from "../assets/Taxidriving.png";
import TaxiDrivingJson from "../assets/Taxidriving.json";
import BirdPng from "../assets/BirdSprite.png";
import BirdJson from "../assets/BirdSprite.json";
import GuardPng from "../assets/Guard.png";
import GuardJson from "../assets/Guard.json";
import GuardDialogue from "../../../../assets/dialogue/guard.json";
import Student3Png from "../assets/Student3.png";
import Student3Dialogue from "../../../../assets/dialogue/student3.json";
import { getNPCDialogue } from "../utils/DialogueManager";
import { Bird } from "../utils/Bird";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
import { hasItem, removeItem, getInventory } from "../utils/InventoryManager.js";
import { completeGoal } from "../utils/GoalManager";
import { initNPCMovement, updateNPCMovement } from "../utils/NPCMovementManager";

export class SchoolScene extends Phaser.Scene {
  constructor() {
    super({ key: "SchoolScene" });
    this.player = null;
    this.currentSlot = null;
    this.isGuardChecking = false;
    this.guardApproved = false;
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
    this.load.tilemapTiledJSON("school", SchoolMap);
    this.load.image("School", SchoolBg);
    this.load.atlas("idleTaxi", TaxiIdlePng, TaxiIdleJson);
    this.load.atlas("drivingTaxi", TaxiDrivingPng, TaxiDrivingJson);
    this.load.atlas("guard", GuardPng, GuardJson);
    this.load.spritesheet("student3", Student3Png, { frameWidth: 32, frameHeight: 48 });
    Bird.preload(this, BirdPng, BirdJson);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    // Reset state for new slot load
    this.isGuardChecking = false;
    this.guardApproved = false;

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

    // Create animations
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

    if (!this.anims.exists("guard_idle")) {
      this.anims.create({
        key: "guard_idle",
        frames: this.anims.generateFrameNames("guard", {
          prefix: "Guard ",
          suffix: ".aseprite",
          start: 0,
          end: 5,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Student3 Animations (Only Left/Right needed, but creating all for consistency)
    const directions = ["right", "up", "left", "down"];
    const startFrames = [0, 6, 12, 18];
    directions.forEach((dir, i) => {
        const walkKey = `student3_walk_${dir}`;
        const idleKey = `student3_idle_${dir}`;
        if (!this.anims.exists(walkKey)) {
            this.anims.create({
                key: walkKey,
                frames: this.anims.generateFrameNumbers("student3", { start: startFrames[i], end: startFrames[i] + 5 }),
                frameRate: 6,
                repeat: -1
            });
        }
        if (!this.anims.exists(idleKey)) {
            this.anims.create({
                key: idleKey,
                frames: this.anims.generateFrameNumbers("student3", { start: startFrames[i], end: startFrames[i] }),
                frameRate: 1,
                repeat: -1
            });
        }
    });

    // Default player position
    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    // Load player
    const { player, slot, language, saveData } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.player.setDepth(10); // Ensure player is on top
    this.currentSlot = slot;
    this.language = language;

    // Fix Camera Delay: Increase lerp to 0.8 for responsive movement
    this.cameras.main.startFollow(this.player, true, 0.8, 0.8);

    this.physics.add.collider(this.player, this.collisionZones);

    // NPC list for interaction
    this.npcList = [];

    // Guard NPC from Tiled
    const guardLayer = map.getObjectLayer("Guard")?.objects || [];
    const guardObj = guardLayer.find(obj => obj.name === "") || guardLayer[0];
    const restSpotObj = guardLayer.find(obj => obj.name === "GuardSpotForRest");
    
    this.guardRestSpot = restSpotObj ? { x: restSpotObj.x, y: restSpotObj.y } : { x: 439, y: 59 };
    const guardX = guardObj?.x ?? 446;
    const guardY = guardObj?.y ?? 68;

    this.guard = this.physics.add.sprite(guardX, guardY, "guard");
    this.guard.setDepth(5); // Lower depth than player
    this.guard.play("guard_idle");
    this.guard.setImmovable(true);
    if (this.guard.body.setAllowGravity) this.guard.body.setAllowGravity(false);
    this.guard.setSize(20, 24).setOffset(6, 24);
    this.guard.isGuard = true;
    this.npcList.push(this.guard);
    this.physics.add.collider(this.player, this.guard);

    // Student3 from Tiled
    const student3Layer = map.getObjectLayer("Student3");
    const student3Obj = student3Layer?.objects[0];
    if (student3Obj) {
        this.student3 = this.physics.add.sprite(student3Obj.x, student3Obj.y, "student3");
        this.student3.setDepth(5);
        this.student3.play("student3_idle_down");
        this.student3.setImmovable(true);
        if (this.student3.body.setAllowGravity) this.student3.body.setAllowGravity(false);
        this.student3.setSize(20, 24).setOffset(6, 24);
        this.student3.dialogueData = Student3Dialogue;
        this.npcList.push(this.student3);
        this.physics.add.collider(this.player, this.student3);
        this.physics.add.collider(this.student3, this.collisionZones);

        // Left-Right Movement
        const s3Path = [
            { dir: "left", dist: 80, wait: 2000 },
            { dir: "right", dist: 80, wait: 2000 }
        ];
        initNPCMovement(this.student3, s3Path, "student3_");
    }

    // Interaction Prompt
    this.interactText = this.add.text(0, 0, "Press E to talk", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setVisible(false);

    // Dialogue Bubble
    this.dialogueBubble = this.add.container(0, 0).setVisible(false).setDepth(15);
    this.bubbleBg = this.add.graphics();
    this.drawBubble(0);
    this.dialogueText = this.add.text(0, -30, "", {
      fontSize: "12px",
      fill: "#ffffff",
      wordWrap: { width: 180 },
      align: "center"
    }).setOrigin(0.5);
    this.dialogueBubble.add([this.bubbleBg, this.dialogueText]);
    this.activeNPC = null;

    // Portals initialization
    setupPortals(this, map, this.player);

    // Find the hallway portal and disable it initially
    this.hallwayPortal = this.portalZones.getChildren().find(
      (p) => p.properties?.name === "portalToHallway"
    );
    if (this.hallwayPortal && this.hallwayPortal.body) {
      this.hallwayPortal.body.enable = false;
    }

    // Check if guard should be at rest
    const storedUserData = JSON.parse(localStorage.getItem("user")) || {};
    if (storedUserData.flags?.guard_gone) {
      this.guardApproved = true;
      this.guard.setPosition(this.guardRestSpot.x, this.guardRestSpot.y);
      if (this.hallwayPortal && this.hallwayPortal.body) {
        this.hallwayPortal.body.enable = true;
      }
    }

    // Handle Interaction
    this.input.keyboard.on("keydown-E", () => {
      if (this.isGuardChecking) return;
      
      let nearestNPC = null;
      let minDist = 60;

      this.npcList.forEach(npc => {
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
          if (dist < minDist) {
              nearestNPC = npc;
              minDist = dist;
          }
      });

      if (nearestNPC) {
        if (this.dialogueBubble.visible && this.activeNPC === nearestNPC) {
          this.dialogueBubble.setVisible(false);
          this.activeNPC = null;
          if (this.dialogueTimer) this.dialogueTimer.remove();
        } else {
          this.activeNPC = nearestNPC;
          
          if (nearestNPC.isGuard) {
            // Guard Logic
            if (this.guardApproved) {
                this.dialogueText.setText("Mmm... this coffee is exactly what I needed. Enjoy the hallway!");
                this.dialogueBubble.setVisible(true);
                if (this.dialogueTimer) this.dialogueTimer.remove();
                this.dialogueTimer = this.time.delayedCall(5000, () => { if (this.activeNPC === this.guard) this.dialogueBubble.setVisible(false); });
            } else {
                const hasId = hasItem("School ID");
                if (hasId) {
                    this.startGuardCheckSequence();
                } else {
                    const storedUser = JSON.parse(localStorage.getItem("user")) || {};
                    const gameState = { flags: storedUser.flags || {}, user: storedUser };
                    const dialogue = getNPCDialogue(GuardDialogue, gameState);
                    if (dialogue) {
                        this.dialogueText.setText(dialogue.text);
                        this.dialogueBubble.setVisible(true);
                        if (this.dialogueTimer) this.dialogueTimer.remove();
                        this.dialogueTimer = this.time.delayedCall(5000, () => { if (this.activeNPC === this.guard) this.dialogueBubble.setVisible(false); });
                    }
                }
            }
          } else {
            // Generic NPC logic (Student3)
            const storedUser = JSON.parse(localStorage.getItem("user")) || {};
            const gameState = { flags: storedUser.flags || {}, inventory: storedUser.inventory || [], user: storedUser };
            const dialogue = getNPCDialogue(nearestNPC.dialogueData, gameState);
            if (dialogue) {
                this.dialogueText.setText(dialogue.text);
                this.dialogueBubble.setVisible(true);
                if (this.dialogueTimer) this.dialogueTimer.remove();
                this.dialogueTimer = this.time.delayedCall(5000, () => { if (this.activeNPC === nearestNPC) this.dialogueBubble.setVisible(false); });
            }
          }
        }
      }
    });

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
      this.cameras.main.startFollow(taxi, true, 0.8, 0.8);

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
        onComplete: async () => {
          taxi.play("taxi_idle");
          
          // Auto-save upon arrival
          const storedUser = JSON.parse(localStorage.getItem("user"));
          const userId = storedUser?.id || 1;
          const taxiData = {
              scene: this.scene.key,
              x: taxi.x,
              y: taxi.y
          };
          await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, taxiData, storedUser.inventory, storedUser.flags);
          console.log("💾 Auto-saved arrival at School Scene.");

          completeGoal("reach_school", this);

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
                this.cameras.main.startFollow(this.player, true, 0.8, 0.8);
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

    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    // Song UI
    this.songUI = createSongUI(this, " School ");
    await launchHUD(this, this.player, this.currentSlot, this.language);

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
                    console.log("🚕 Returning to the city...");
                    this.isReturning = true;
                    this.player.setVisible(false);
                    if (this.player.body) this.player.body.enable = false;
                    
                    this.cameras.main.stopFollow();
                    this.cameras.main.startFollow(this.taxi, true, 0.8, 0.8);
                    
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

      await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, taxiData, storedUser.inventory, storedUser.flags);
      console.log(`💾 Player, Taxi, and Flags saved in slot ${this.currentSlot}`);
    });

    // ESC → go to SaveSlotsScene
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", {
        player: this.player,
        loadSlot: this.currentSlot,
      });
    });

    // Sync UI position listener
    this.events.on("postupdate", () => {
        if (!this.npcList || !this.player) return;

        let nearestNPC = null;
        let minDist = 60;

        this.npcList.forEach(npc => {
            if (!npc || !npc.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
            if (dist < minDist) {
                nearestNPC = npc;
                minDist = dist;
            }
        });

        if (nearestNPC && this.interactText) {
            this.interactText.setPosition(nearestNPC.x, nearestNPC.y - 40);
            this.interactText.setVisible(!this.dialogueBubble.visible && !this.isGuardChecking);
        } else if (this.interactText) {
            this.interactText.setVisible(false);
        }

        if (this.dialogueBubble && this.dialogueBubble.visible && this.activeNPC) {
            const targetX = this.activeNPC.x;
            const targetY = this.activeNPC.y - 70;
            const cam = this.cameras.main;
            const view = cam.worldView;
            if (view) {
                const clampedX = Phaser.Math.Clamp(targetX, view.x + 105, view.x + view.width - 105);
                const clampedY = Phaser.Math.Clamp(targetY, view.y + 65, view.y + view.height - 10);
                this.dialogueBubble.x = Math.round(Phaser.Math.Linear(this.dialogueBubble.x, clampedX, 0.2));
                this.dialogueBubble.y = Math.round(Phaser.Math.Linear(this.dialogueBubble.y, clampedY, 0.2));
                this.drawBubble(targetX - this.dialogueBubble.x);
            }
        }
    });
  }

  startGuardCheckSequence() {
    this.isGuardChecking = true;
    
    // First message: Stop and notice ID
    this.dialogueText.setText("Stop right there! Hallway is restricted.");
    this.dialogueBubble.setVisible(true);

    this.time.delayedCall(2000, () => {
      this.dialogueText.setText("Hmm? What's that in your hand? A School ID?");
      
      // Show the ID Overlay (Small scale, no dimming)
      const schoolIDScene = this.scene.get("SchoolIDOverlay");
      if (schoolIDScene && typeof schoolIDScene.showID === "function") {
          schoolIDScene.showID(0.5, false);
      }

      this.time.delayedCall(2000, async () => {
        this.dialogueText.setText("Hand it over. I need to verify your credentials.");
        
        // Transaction simulation: Remove ID from inventory
        const inv = getInventory();
        const idIndex = inv.findIndex(item => item.name === "School ID" || item === "School ID");
        if (idIndex !== -1) {
          await removeItem(idIndex);
          console.log("School ID removed for checking.");
        }

        this.time.delayedCall(2500, () => {
          this.dialogueText.setText("Scanning the barcode... verifying database entries...");
          
          this.time.delayedCall(3000, () => {
            this.dialogueText.setText("The photo matches... and the encryption seems valid.");
            
            this.time.delayedCall(2500, () => {
              this.dialogueText.setText("Alright, student. Everything is in order.");
              this.guardApproved = true;

              this.time.delayedCall(2000, () => {
                this.dialogueText.setText("You may pass. I'm going to take my break now.");
                
                // Hide ID finally
                if (schoolIDScene && typeof schoolIDScene.hideID === "function") {
                    schoolIDScene.hideID();
                }

                this.time.delayedCall(2500, () => {
                  this.dialogueBubble.setVisible(false);

                  // 1. Fade out at current spot
                  this.tweens.add({
                    targets: this.guard,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => {
                      // 2. Teleport to rest spot
                      this.guard.setPosition(this.guardRestSpot.x, this.guardRestSpot.y);
                      
                      // 3. Fade back in
                      this.tweens.add({
                        targets: this.guard,
                        alpha: 1,
                        duration: 1000,
                        onComplete: async () => {
                          if (this.hallwayPortal && this.hallwayPortal.body) {
                            this.hallwayPortal.body.enable = true;
                            console.log("Hallway portal enabled!");
                          }

                          // Update flags and persist immediately to prevent state loss on scene transition
                          const storedUser = JSON.parse(localStorage.getItem("user")) || {};
                          if (!storedUser.flags) storedUser.flags = {};
                          storedUser.flags.guard_gone = true;
                          localStorage.setItem("user", JSON.stringify(storedUser));
                          
                          await completeGoal("pass_guard", this);

                          this.isGuardChecking = false;
                          
                          // Show final rest flavour text
                          this.dialogueText.setText("Ah, coffee time. Don't cause any trouble in the hallway!");
                          this.dialogueBubble.setVisible(true);
                          this.time.delayedCall(3000, () => {
                            this.dialogueBubble.setVisible(false);
                          });
                        },
                      });
                    },
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  update() {
    if (!this.player || !this.player.body) return;

    // Always sync shadow and handle controls if not auto-moving or returning
    updatePlayer(this.player, 200, this.isReturning || this.isAutoMoving || this.isGuardChecking);

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
            console.log("🚕 Heading back to City...");
            this.scene.start("OutsideScene", {
                loadSlot: this.currentSlot,
                returningByTaxi: true,
                x: 176, // Final stop point in Outside
                y: 495
            });
            this.isReturning = false;
        }
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

    // Update Student3
    if (this.student3 && this.student3.body) {
        updateNPCMovement(this.student3, 80, this);
    }
  }
}
