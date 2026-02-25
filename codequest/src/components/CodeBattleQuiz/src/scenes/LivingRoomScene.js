import Phaser from "phaser";
import LivingRoomBg from "../assets/LivingRoom.png";
import LivingRoomMap from "../assets/LivingRoom.json";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
export class LivingRoomScene extends Phaser.Scene {
  constructor() {
    super({ key: "LivingRoomScene" });
    this.player = null;
    this.currentSlot = null;
  }

  preload() {
    this.load.tilemapTiledJSON("livingRoom", LivingRoomMap);
    this.load.image("LivingRoom", LivingRoomBg);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "LivingRoom").setOrigin(0.5, 0.5);

    // Map setup
    const map = this.make.tilemap({ key: "livingRoom" });
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

    // Fade in if coming from portal
    if (data?.fromPortal) fadeInFromPortal(this, data);

    // Portals
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });

  // Launch HUD with username from database
    await launchHUD(this, this.player, this.currentSlot, this.language);
    // Song UI
    this.songUI = createSongUI(this, "Living Room");

    // Save hotkey (L)
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
    
    // Safety: only update portals if initialized
    if (this.portalZones && this.enterText && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }
  }
}
