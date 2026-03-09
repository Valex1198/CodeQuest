import Phaser from "phaser";
import SchoolLobbyBg from "../assets/SchoolLobby.png";
import SchoolLobbyMap from "../assets/SchoolLobby.json";
import { preloadPlayer, updatePlayer } from "../utils/player";
import { setupPortals, handlePortalUpdate, fadeInFromPortal } from "../utils/PortalManager";
import { setupCollisions } from "../utils/collision";
import { setSave } from "../utils/saveManager";
import { preloadSongUI, createSongUI } from "../utils/songUI";
import { loadPlayer } from "../utils/playerLoader";
import { launchHUD } from "../utils/hudUtil.js";
import { createMenuButton } from "../utils/uiHelpers.js";
export class SchoolLobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "SchoolLobbyScene" });
    this.player = null;
    this.currentSlot = null;
    this.leaderboardSpot = null; // initialize
  }

  preload() {
    this.load.tilemapTiledJSON("schoolLobby", SchoolLobbyMap);
    this.load.image("SchoolLobby", SchoolLobbyBg);
    preloadPlayer(this);
    preloadSongUI(this);
  }

  async create(data) {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "SchoolLobby").setOrigin(0.5);

    // Map & collisions
    const map = this.make.tilemap({ key: "schoolLobby" });
    this.collisionZones = setupCollisions(this, map, "Collisions");
    this.cameras.main.setZoom(1.25);

    // Default player position
    const defaultX = data?.x ?? 238;
    const defaultY = data?.y ?? 270;

    // Load player safely
    try {
      const { player, slot, language } = await loadPlayer(this, data, defaultX, defaultY);
      this.player = player;
      this.currentSlot = slot;
      this.language = language;

      this.physics.add.collider(this.player, this.collisionZones);

      // Portals
      setupPortals(this, map, this.player);
      createMenuButton(this, "🏠", { xOffset: 50, yOffset: 50, fontSize: 32 });
      // Fade in if from portal
      if (data?.fromPortal) fadeInFromPortal(this, data);

      // HUD / Song UI
      this.songUI = createSongUI(this, " School Lobby ");
      await launchHUD(this, this.player, this.currentSlot, this.language);

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
    } catch (err) {
      console.error("Failed to load players:", err);
    }

    // ===============================
    // Leaderboard logic
    // ===============================
    this.leaderboardSpot = new Phaser.Math.Vector2(480, 126);
    this.leaderboardRadius = 40;

    // Floating hint text
    this.leaderboardHint = this.add
      .text(0, 0, "Press ENTER to view Leaderboard", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#ffcc00",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setVisible(false)
      .setDepth(1000);

    // ENTER → open leaderboard
    this.input.keyboard.on("keydown-ENTER", () => {
      if (this.leaderboardHint.visible && !this.scene.isActive("LeaderboardScene")) {
        this.scene.launch("LeaderboardScene");
        this.scene.bringToTop("LeaderboardScene");
      }
    });
  }

  update(time) {
    // Make sure player & leaderboardSpot exist before doing anything
    if (!this.player || !this.player.body || !this.leaderboardSpot) return;

    // Update player movement
    updatePlayer(this.player);

    // Update portals
    if (this.portalZones && this.player.keys) {
      handlePortalUpdate(this, this.player, this.player.keys);
    }

    // Leaderboard proximity
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.leaderboardSpot.x,
      this.leaderboardSpot.y
    );
    const isNearLeaderboard = distance <= this.leaderboardRadius;

    if (isNearLeaderboard) {
      if (!this.leaderboardHint.visible) {
        this.leaderboardHint.setVisible(true);
        this.tweens.add({
          targets: this.leaderboardHint,
          alpha: 1,
          duration: 200,
          ease: "Power2",
        });
      }

      // Bobbing above player
      const bob = Math.sin(time / 250) * 4;
      this.leaderboardHint.setPosition(
        this.player.x,
        this.player.y - 42 + bob
      );
    } else if (this.leaderboardHint.visible) {
      this.tweens.add({
        targets: this.leaderboardHint,
        alpha: 0,
        duration: 150,
        ease: "Power2",
        onComplete: () => this.leaderboardHint.setVisible(false),
      });
    }
  }
}
