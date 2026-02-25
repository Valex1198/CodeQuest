import Phaser from "phaser";
import Comlab3Bg from "../assets/Comlab3.png";
import Comlab3Map from "../assets/comlab3.json";
import Professor1Img from "../assets/Professor1.png";
import EKeyImg from "../assets/E-Key.png";
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

export class Comlab3Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Comlab3Scene" });
    this.player = null;
    this.currentSlot = null;
    this.language = "Python";
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
    // E-Key indicator
    // ----------------------------
    if (!this.anims.exists("e_key_anim")) {
      this.anims.create({
        key: "e_key_anim",
        frames: this.anims.generateFrameNumbers("EKey", { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1,
      });
    }

    this.eKeySprite = this.add
      .sprite(this.player.x, this.player.y - 40, "EKey")
      .setDepth(1002)
      .setVisible(false)
      .play("e_key_anim");

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
        openProfessorDialog(this, {
          slot: this.currentSlot,
          language: this.language,
        });
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

    if (this.eKeySprite) {
        const dist = this.professor1 ? Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.professor1.x,
            this.professor1.y
        ) : 0;

        this.eKeySprite.setVisible(dist <= 60);
        this.eKeySprite.setPosition(this.player.x, this.player.y - 40);
    }
}
  
}
