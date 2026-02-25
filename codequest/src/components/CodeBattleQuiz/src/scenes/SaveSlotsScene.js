import Phaser from "phaser";
import SaveSlotsBg from "../assets/SaveSlots.png";
import SaveSlotsMap from "../assets/SaveSlots.json";
import { listSaves, setSave, clearSave } from "../utils/saveManager";
import { createMenuButton } from "../utils/uiHelpers.js";
export class SaveSlotsScene extends Phaser.Scene {
  constructor() {
    super({ key: "SaveSlotsScene" });
    this.highlight = null;
    this.saveSlots = [];
    this.slotTexts = [];
  }

  preload() {
    this.load.image("saveSlotsBg", SaveSlotsBg);
    this.load.tilemapTiledJSON("saveSlotsMap", SaveSlotsMap);
  }

  async create(data) {
    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;

    // Stop HUD
    if (this.scene.isActive("HudOverlay")) this.scene.stop("HudOverlay");

    // Background
    this.add.image(canvasWidth / 2, canvasHeight / 2, "saveSlotsBg").setOrigin(0.5);

    const map = this.make.tilemap({ key: "saveSlotsMap" });
    const saveZones = map.getObjectLayer("SaveZones")?.objects || [];

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user) return;

    const selectedLanguage = data?.selectedLanguage || "Python";
    const currentSlotId = data?.loadSlot || null;
    const defaultScene = data?.defaultScene || "HomeScene";
    const mode = data?.mode || "load"; // "new" for new game, "load" for load

    const saves = await listSaves(user.id, saveZones.length);
    createMenuButton(this, "🏠", { xOffset: 300, yOffset: 50, fontSize: 32 });
    this.highlight = this.add.graphics();
    this.highlight.lineStyle(3, 0x3399ff, 1);
    this.highlight.setVisible(false);

    saveZones.forEach((zoneObj, index) => {
      const slotId = index + 1;
      const saveData = saves[index];

      // Slot label
      let slotTextContent = saveData
        ? `Slot ${slotId}\nScene: ${saveData.scene}\nSaved: ${saveData.date}\nLang: ${saveData.language || "Python"}`
        : `Slot ${slotId}\nEmpty`;

      if (slotId === currentSlotId) slotTextContent = `Slot ${slotId}\nCurrently loaded`;

      const text = this.add
        .text(zoneObj.x + zoneObj.width / 2, zoneObj.y + zoneObj.height / 2, slotTextContent, {
          fontSize: "18px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5);

      this.slotTexts.push(text);

      const zone = this.add
        .zone(zoneObj.x, zoneObj.y, zoneObj.width, zoneObj.height)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      zone.on("pointerover", () => this.moveHighlight(zoneObj));
      zone.on("pointerout", () => this.highlight.setVisible(false));

      zone.on("pointerdown", async () => {
        if (slotId === currentSlotId) return;

        let targetScene, playerData;

        if (mode === "new") {
          // NEW GAME: reset quiz & coding progress
          targetScene = defaultScene;
          playerData = { x: 238, y: 270 };
          await setSave(user.id, slotId, { scene: { key: targetScene } }, playerData, selectedLanguage, null, null, true);

          // Update slot text
          if (this.slotTexts[index] && this.slotTexts[index].active) {
            this.slotTexts[index].setText(`Slot ${slotId}\nScene: ${targetScene}\nSaved: ${new Date().toLocaleDateString()}\nLang: ${selectedLanguage}`);
          }
        } else {
          // LOAD GAME
          if (!saveData) return;
          targetScene = saveData.scene || defaultScene;
          playerData = { x: saveData.x || 238, y: saveData.y || 270 };
        }

        // Start the target scene
        this.scene.start(targetScene, { loadSlot: slotId });
      });

      this.saveSlots.push(zone);
    });

    // Delete all saves button
    const deleteAllBtn = this.add
      .text(50, canvasHeight - 40, "Delete All Saves", {
        fontSize: "16px",
        color: "#ff4444",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    deleteAllBtn.on("pointerdown", async () => {
      for (let i = 1; i <= this.slotTexts.length; i++) {
        await clearSave(user.id, i);
        if (this.slotTexts[i - 1] && this.slotTexts[i - 1].active) {
          this.slotTexts[i - 1].setText(`Slot ${i}\nEmpty`);
        }
      }
    });
  }

  moveHighlight(zoneObj) {
    this.highlight.setVisible(true);
    this.highlight.clear();
    this.highlight.lineStyle(3, 0x3399ff, 1);

    const c = 12;
    const { x, y, width: w, height: h } = zoneObj;

    const drawCorner = (px, py, dx, dy) => {
      this.highlight.beginPath();
      this.highlight.moveTo(px, py);
      this.highlight.lineTo(px + dx, py);
      this.highlight.lineTo(px + dx, py + dy);
      this.highlight.strokePath();
    };

    drawCorner(x, y + c, c, -c);
    drawCorner(x + w - c, y, c, c);
    drawCorner(x, y + h - c, c, c);
    drawCorner(x + w - c, y + h, c, -c);
  }
}
