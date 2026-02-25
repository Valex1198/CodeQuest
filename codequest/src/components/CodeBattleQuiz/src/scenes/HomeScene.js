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
export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.currentSlot = null;
    this.language = "Python"; // fallback
    this.portalZones = null;
    this.enterText = null;
    this.activePortal = null;
  }

  preload() {
    this.load.tilemapTiledJSON("home", homeMap);
    this.load.image("Home", Homebg);
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
    const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
    if (!player) {
      console.error("Player failed to load!");
      return;
    }
    this.player = player;
    this.currentSlot = slot;
    this.language = language || "Python";

    console.log("✅ Player loaded:", this.player);
    console.log("💾 Current save slot:", this.currentSlot);
    console.log("🌐 Player language:", this.language);

    this.physics.add.collider(this.player, this.collisionZones);

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
    const storedUser = JSON.parse(localStorage.getItem("user")) || { username: "Player" };

    if (!this.scene.isActive("HudOverlay")) {
      this.scene.launch("HudOverlay", {
        player: this.player,
        playerName: storedUser.username,
        saveSlot: this.currentSlot,
        language: this.language
      });

      this.hudScene = this.scene.get("HudOverlay");

      this.hudScene.events.once("create", async () => {
        this.hudScene.saveSlot = this.currentSlot;
        this.hudScene.language = this.language;
        await this.hudScene.updateTotalScore();
      });

    } else {
      this.hudScene = this.scene.get("HudOverlay");
      this.hudScene.saveSlot = this.currentSlot;
      this.hudScene.language = this.language;
      await this.hudScene.updateTotalScore();
    }

    this.scene.setVisible(true, "HudOverlay");
    this.scene.bringToTop("HudOverlay");

    console.log("👀 HudOverlay launched and brought to top");

    // -----------------------------
    // Save hotkey (L)
    // -----------------------------
    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      await setSave(userId, this.currentSlot, this, this.player, this.language);
      console.log(`💾 Player saved in slot ${this.currentSlot}`);
    });

    // -----------------------------
    // ESC → SaveSlotsScene
    // -----------------------------
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", { player: this.player, loadSlot: this.currentSlot });
    });
  }

  update() {
    if (!this.player || !this.player.body) return;

    updatePlayer(this.player);

    if (this.portalZones && this.enterText && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }
  }
}
