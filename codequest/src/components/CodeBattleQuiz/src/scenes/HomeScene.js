import Phaser from "phaser";
import homeMap from "../assets/home.json";
import Homebg from "../assets/Home.png";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { createMenuButton } from "../utils/uiHelpers.js";
import { createMessageBox, showTutorialSequence } from "../utils/uiHelpers.js";
import { launchHUD, showPickup } from "../utils/hudUtil.js";
import { addItem } from "../utils/InventoryManager.js";
import SchoolIDImg from "../assets/SchoolID.png";
import SmallIDImg from "../assets/Small_ID.png";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.currentSlot = null;
    this.language = "Python"; // fallback
    this.portalZones = null;
    this.enterText = null;
    this.activePortal = null;
    this.schoolID = null;
  }

  preload() {
    this.load.tilemapTiledJSON("home", homeMap);
    this.load.image("Home", Homebg);
    this.load.image("SchoolIDItem", SchoolIDImg);
    this.load.image("SmallID", SmallIDImg);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "Home").setOrigin(0.5);

    // Map setup
    const map = this.make.tilemap({ key: "home" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);
    
    // Default player position
    const defaultX = data?.x ?? 250;
    const defaultY = data?.y ?? 270;

    // -----------------------------
    // Load player + language
    // -----------------------------
    const { player, slot, language, saveData } = await loadPlayer(this, data, defaultX, defaultY);
    if (!player) {
      console.error("Player failed to load!");
      return;
    }
    this.player = player;
    this.currentSlot = slot;
    this.language = language || "Python";
    this.saveData = saveData;

    const storedUser = JSON.parse(localStorage.getItem("user")) || { username: "Player" };

    console.log("✅ Player loaded:", this.player);

    this.physics.add.collider(this.player, this.collisionZones);

    // -----------------------------
    // School ID Pickup
    // -----------------------------
    const idSpot = map.getObjectLayer("smallidspot")?.objects[0];
    const hasID = storedUser.inventory?.some(item => item.name === "School ID");

    if (idSpot && !hasID) {
      this.schoolID = this.physics.add.sprite(idSpot.x, idSpot.y, "SmallID");
      this.schoolID.setScale(1.0); 
      this.schoolID.setDepth(5);
      
      // Floating animation
      this.tweens.add({
        targets: this.schoolID,
        y: idSpot.y - 5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      this.interactText = this.add.text(idSpot.x, idSpot.y - 20, "Press E to pick up", {
        fontSize: "12px",
        fill: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setVisible(false).setDepth(100);

      this.input.keyboard.on("keydown-E", async () => {
        if (!this.schoolID || !this.schoolID.active) return;
        
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.schoolID.x, this.schoolID.y);
        if (dist < 50) {
          // Add to inventory logic using InventoryManager
          const success = await addItem({ name: "School ID", icon: "SchoolIDItem" });

          if (success) {
            // Visual feedback
            showPickup(this, "School ID", "SchoolIDItem");
            this.schoolID.destroy();
            if (this.interactText) this.interactText.destroy();
            this.schoolID = null;
          }
        }
      });
    }

    // Fade in if from portal
    if (data?.fromPortal) fadeInFromPortal(this, data);

    // -----------------------------
    // Song UI & Portals
    // -----------------------------
    this.songUI = createSongUI(this, " Home ");
    setupPortals(this, map, this.player);
    this.time.addEvent({
      delay: 100, // short delay to ensure camera & HUD are ready
      callback: () => {
        showTutorialSequence(this, [
          { text: "Use arrow keys or WASD to move", x: 400, y: 400 },
          { text: "Press L to save your progress", x: 400, y: 400 },
          { text: "Press ESC to open save slots", x: 400, y: 400 },
          
        ]);
      },
      loop: false
    });
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    // -----------------------------
    // HUD overlay
    // -----------------------------
    await launchHUD(this, this.player, this.currentSlot, this.language);

    console.log("👀 HudOverlay launched and brought to top");

    // -----------------------------
    // Save hotkey (L)
    // -----------------------------
    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      
      // Preserve taxi data in HomeScene saves
      const taxiData = this.saveData?.taxi || null;

      await setSave(userId, this.currentSlot, this, this.player, this.language, null, null, false, taxiData);
      console.log(`💾 Player (and preserved Taxi data) saved in slot ${this.currentSlot}`);
    });

    // -----------------------------
    // ESC → SaveSlotsScene
    // -----------------------------
    this.scene.launch("InventoryOverlay");

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", { player: this.player, loadSlot: this.currentSlot });
    });
  }

  update() {
    if (!this.player || !this.player.body) return;

    updatePlayer(this.player);

    if (this.schoolID && this.interactText) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.schoolID.x, this.schoolID.y);
      this.interactText.setVisible(dist < 50);
    }

    if (this.portalZones && this.enterText && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }
  }
}
