import Phaser from "phaser";
import Comlab2Bg from "../assets/Comlab2.png";
import Comlab2Map from "../assets/comlab2.json";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
export class Comlab2Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Comlab2Scene" });
    this.player = null;
    this.currentSlot = null;
  }

  preload() {
    this.load.tilemapTiledJSON("comlab2", Comlab2Map);
    this.load.image("Comlab2", Comlab2Bg);
    preloadPlayer(this);
    preloadSongUI(this);
    
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    this.add.image(canvasWidth / 2, canvasHeight / 2, "Comlab2").setOrigin(0.5, 0.5);

    const map = this.make.tilemap({ key: "comlab2" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
    this.player = player;
    this.currentSlot = slot;
    this.language = language;

    this.physics.add.collider(this.player, this.collisionZones);

    if (data?.fromPortal) fadeInFromPortal(this, data);

    setupPortals(this, map, this.player);
    createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
    this.songUI = createSongUI(this, "Now Playing: Comlab 2 Theme");

    await launchHUD(this, this.player, this.currentSlot, this.language);

    this.input.keyboard.on("keydown-L", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id || 1;
      await setSave(userId, this.currentSlot, this, this.player,this.language);
      console.log(`💾 Player saved in slot ${this.currentSlot}`);
    });

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
    if (this.portalZones && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }
  }
}
