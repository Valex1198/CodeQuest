import Phaser from "phaser";
import SchoolHallwayBg from "../assets/SchoolHallway.png";
import SchoolHallwayMap from "../assets/SchoolHallway.json";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import {  setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
export class SchoolHallwayScene extends Phaser.Scene {
  constructor() {
    super({ key: "SchoolHallwayScene" });
    this.player = null;
    this.currentSlot = null;
  }

  preload() {
    this.load.tilemapTiledJSON("schoolHallway", SchoolHallwayMap);
    this.load.image("SchoolHallway", SchoolHallwayBg);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;
    this.add.image(canvasWidth / 2, canvasHeight / 2, "SchoolHallway").setOrigin(0.5, 0.5);
    const map = this.make.tilemap({ key: "schoolHallway" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = slot;
    this.language = language;

    this.physics.add.collider(this.player, this.collisionZones);

    fadeInFromPortal(this, data);

    this.songUI = createSongUI(this, " School Hallway ");
    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    await launchHUD(this, this.player, this.currentSlot, this.language);
    // Save hotkey
    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      await setSave(userId, this.currentSlot, this, this.player, this.language);
      console.log(`💾 Player saved in slot ${this.currentSlot}`);
    });

    // Save menu
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("SaveSlotsScene", { player: this.player, loadSlot: this.currentSlot });
    });
  }

  update() {
    if (!this.player) return;
      updatePlayer(this.player);
      handlePortalUpdate(this, this.player, this.player.keys);
    }
}
