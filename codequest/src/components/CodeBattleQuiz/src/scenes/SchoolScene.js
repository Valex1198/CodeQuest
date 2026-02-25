import Phaser from "phaser";
import SchoolBg from "../assets/school.png";
import SchoolMap from "../assets/school.json";
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

    // Default player position
    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    // Load player
    const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = slot;
    this.language = language;
    this.physics.add.collider(this.player, this.collisionZones);


    
    // Fade in from portal if needed
    if (data?.fromPortal) fadeInFromPortal(this, data);

    // Portals
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    // Song UI
    this.songUI = createSongUI(this, " School ");
    await launchHUD(this, this.player, this.currentSlot, this.language);
    // HUD overlay
    

    // Save hotkey
    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      await setSave(userId, this.currentSlot, this, this.player, this.language);
      console.log(`💾 Player saved in slot ${this.currentSlot}`);
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
    updatePlayer(this.player);

    // Update portals safely
    if (this.portalZones && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }
  }
}
