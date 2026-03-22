import Phaser from "phaser";
import SchoolLobbyBg from "../assets/SchoolLobby.png";
import SchoolLobbyMap from "../assets/SchoolLobby.json";
import Student1Png from "../assets/Student1.png";
import Student1Json from "../assets/Student1.json";
import Student1Dialogue from "../../../../assets/dialogue/student1.json";
import Student2Png from "../assets/Student2.png";
import Student2Dialogue from "../../../../assets/dialogue/student2.json";
import StandingStudent1Png from "../assets/StandingStudent1.png";
import StandingStudent2Png from "../assets/StandingStudent2.png";
import StandingStudentsDialogue from "../../../../assets/dialogue/standing_students.json";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
import { getNPCDialogue, handleDialogueActions } from "../utils/DialogueManager";
import { initNPCMovement, updateNPCMovement } from "../utils/NPCMovementManager";
import { DialogueOverlay } from "../overlay/DialogueOverlay";
import { addItem } from "../utils/InventoryManager";

export class SchoolLobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "SchoolLobbyScene" });
    this.player = null;
    this.currentSlot = null;
    this.leaderboardSpot = null;
    this.dialogueInProgress = false;
  }

  // GA removed drawBubble

  preload() {
    this.load.tilemapTiledJSON("schoolLobby", SchoolLobbyMap);
    this.load.image("SchoolLobby", SchoolLobbyBg);
    this.load.atlas("student1", Student1Png, Student1Json);
    this.load.spritesheet("student2", Student2Png, { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet("standingStudent1", StandingStudent1Png, { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet("standingStudent2", StandingStudent2Png, { frameWidth: 32, frameHeight: 48 });
    preloadPlayer(this);
    preloadSongUI(this);
  }

  updateGameState(action) {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    let itemGiven = false;
    switch (action.type) {
        case "SET_FLAG":
            if (!user.flags) user.flags = {};
            user.flags[action.key] = action.value;
            break;
        case "GIVE_ITEM":
            addItem(action.item); // This should update localStorage internally
            itemGiven = true;
            break; // No need to save localStorage again, addItem does it.
    }
    if (!itemGiven) {
        localStorage.setItem("user", JSON.stringify(user));
    }
    
    // Also update the inventory and goal overlays if they are active
    const inventoryOverlay = this.scene.get("InventoryOverlay");
    if (inventoryOverlay && inventoryOverlay.sys.isActive()) {
        inventoryOverlay.refreshInventory();
    }

    const goalOverlay = this.scene.get("GoalOverlay");
    if (goalOverlay && goalOverlay.sys.isActive()) {
        goalOverlay.refreshGoalsList();
    }
  }

  getDialogueNodeById(id) {
    if (!this.activeNPC || !this.activeNPC.dialogueData) return null;
    return this.activeNPC.dialogueData.dialogueNodes.find(n => n.id === id);
  }

  async create(data) {
    this.dialogueInProgress = false;
    this.events.on('dialogueClosed', () => {
        this.dialogueInProgress = false;
    });

    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "SchoolLobby").setOrigin(0.5);

    // Map & collisions
    const map = this.make.tilemap({ key: "schoolLobby" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    // Create NPC animations
    const directions = ["right", "up", "left", "down"];
    const startFrames = [0, 6, 12, 18];

    // Student1 Animations
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

    // Student2 Animations
    directions.forEach((dir, i) => {
        const walkKey = `student2_walk_${dir}`;
        const idleKey = `student2_idle_${dir}`;
        
        if (!this.anims.exists(walkKey)) {
          this.anims.create({
            key: walkKey,
            frames: this.anims.generateFrameNumbers("student2", { start: startFrames[i], end: startFrames[i] + 5 }),
            frameRate: 6,
            repeat: -1,
          });
        }
  
        if (!this.anims.exists(idleKey)) {
          this.anims.create({
            key: idleKey,
            frames: this.anims.generateFrameNumbers("student2", { start: startFrames[i], end: startFrames[i] }),
            frameRate: 1,
            repeat: -1,
          });
        }
      });

    // Standing Students animations
    if (!this.anims.exists("SS1_idle")) {
      this.anims.create({
        key: "SS1_idle",
        frames: this.anims.generateFrameNumbers("standingStudent1", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists("SS2_idle")) {
      this.anims.create({
        key: "SS2_idle",
        frames: this.anims.generateFrameNumbers("standingStudent2", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });
    }

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

      // NPC list for interaction detection
      this.npcList = [];

      // Student1 NPC from Tiled
      const student1Layer = map.getObjectLayer("Student1");
      const student1Obj = student1Layer?.objects[0];
      const s1X = student1Obj?.x ?? 256;
      const s1Y = student1Obj?.y ?? 283;

      this.student1 = this.physics.add.sprite(s1X, s1Y, "student1");
      this.student1.setDepth(10);
      this.student1.play("student1_idle_down");
      this.student1.setImmovable(true);
      if (this.student1.body.setAllowGravity) this.student1.body.setAllowGravity(false);
      this.student1.setSize(20, 24).setOffset(6, 24);
      this.student1.dialogueData = Student1Dialogue;
      this.student1.isRandomDialogue = true;
      this.npcList.push(this.student1);
      
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

      // Student2 NPC from Tiled
      const student2Layer = map.getObjectLayer("Student2");
      const student2Obj = student2Layer?.objects[0];
      if (student2Obj) {
        this.student2 = this.physics.add.sprite(student2Obj.x, student2Obj.y, "student2");
        this.student2.setDepth(10);
        this.student2.play("student2_idle_down");
        this.student2.setImmovable(true);
        if (this.student2.body.setAllowGravity) this.student2.body.setAllowGravity(false);
        this.student2.setSize(20, 24).setOffset(6, 24);
        this.student2.dialogueData = Student2Dialogue;
        this.student2.isRandomDialogue = true;
        this.npcList.push(this.student2);
        
        this.physics.add.collider(this.player, this.student2);
        this.physics.add.collider(this.student2, this.collisionZones);

        const student2Path = [
            { dir: "left", dist: 60, wait: 2500 },
            { dir: "down", dist: 40, wait: 1000 },
            { dir: "right", dist: 60, wait: 2500 },
            { dir: "up", dist: 40, wait: 1000 }
        ];
        initNPCMovement(this.student2, student2Path, "student2_");
      }

      // Standing Student 1 from Tiled
      const ss1Layer = map.getObjectLayer("StandingStudent1")?.objects[0];
      if (ss1Layer) {
        this.ss1 = this.physics.add.sprite(ss1Layer.x, ss1Layer.y, "standingStudent1");
        this.ss1.setDepth(10);
        this.ss1.play("SS1_idle");
        this.ss1.setImmovable(true);
        if (this.ss1.body.setAllowGravity) this.ss1.body.setAllowGravity(false);
        this.ss1.setSize(20, 24).setOffset(6, 24);
        this.ss1.dialogueData = StandingStudentsDialogue["StandingStudent1"];
        this.ss1.npcName = "Student"; // Set a display name
        this.npcList.push(this.ss1);
        this.physics.add.collider(this.player, this.ss1);
        this.physics.add.collider(this.ss1, this.collisionZones);
      }

      // Standing Student 2 from Tiled
      const ss2Layer = map.getObjectLayer("StandingStudent2")?.objects[0];
      if (ss2Layer) {
        this.ss2 = this.physics.add.sprite(ss2Layer.x, ss2Layer.y, "standingStudent2");
        this.ss2.setDepth(10);
        this.ss2.play("SS2_idle");
        this.ss2.setImmovable(true);
        if (this.ss2.body.setAllowGravity) this.ss2.body.setAllowGravity(false);
        this.ss2.setSize(20, 24).setOffset(6, 24);
        this.ss2.dialogueData = StandingStudentsDialogue["StandingStudent2"];
        this.ss2.npcName = "Student";
        this.npcList.push(this.ss2);
        this.physics.add.collider(this.player, this.ss2);
        this.physics.add.collider(this.ss2, this.collisionZones);
      }

      // Interaction UI (shared)
      this.interactText = this.add.text(0, 0, "Press E to talk", {
        fontSize: "14px",
        fill: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setVisible(false);

      // GA removed bubble

      // Handle Interaction
      this.input.keyboard.on("keydown-E", () => {
        if (this.dialogueInProgress) return;

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
            this.activeNPC = nearestNPC;
            const storedUser = JSON.parse(localStorage.getItem("user")) || {};
            const gameState = { flags: storedUser.flags || {}, inventory: storedUser.inventory || [], user: storedUser, language: this.language };
            
            const dialogueNode = getNPCDialogue(nearestNPC.dialogueData, gameState);

            if (dialogueNode) {
                this.dialogueInProgress = true;
                this.scene.launch("DialogueOverlay", {
                    dialogueNode: dialogueNode,
                    npcName: nearestNPC.npcName || "NPC",
                    callingScene: this
                });
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
    const onPostUpdate = () => {
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
            this.interactText.setVisible(!this.dialogueInProgress);
        } else if (this.interactText) {
            this.interactText.setVisible(false);
        }

       // GA removed bubble logic
    };

    this.events.on("postupdate", onPostUpdate);
    this.events.once("shutdown", () => {
        this.events.off("postupdate", onPostUpdate);
    });
  }

  update(time) {
    if (!this.player || !this.player.body) return;
    updatePlayer(this.player);

    if (this.student1 && this.student1.body) {
        updateNPCMovement(this.student1, 80, this);
    }

    if (this.student2 && this.student2.body) {
        updateNPCMovement(this.student2, 80, this);
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
