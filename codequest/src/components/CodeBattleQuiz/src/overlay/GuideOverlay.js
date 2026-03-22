import Phaser from "phaser";

export class GuideOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "GuideOverlay" });
  }

  create(data = {}) {
    const { width, height } = this.scale;
    const { title, content, callingScene } = data;

    // Pause the calling scene
    if (callingScene && this.scene.isActive(callingScene.scene.key)) {
      this.scene.pause(callingScene.scene.key);
    }
    this.callingScene = callingScene;

    // Dimming background
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    const panelWidth = Math.min(600, width * 0.8);
    const panelHeight = Math.min(400, height * 0.8);

    // Panel
    this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1a1a1a)
      .setStrokeStyle(2, 0xbebebe);

    // Title
    this.add.text(width / 2, height / 2 - panelHeight / 2 + 30, title || "Guide", {
      fontFamily: '"Press Start 2P"',
      fontSize: "24px",
      color: "#ffff00",
    }).setOrigin(0.5);

    // Content
    this.add.text(width / 2, height / 2, content || "No content available.", {
      fontFamily: "VT323",
      fontSize: "22px",
      color: "#ffffff",
      wordWrap: { width: panelWidth - 40 },
      align: "center"
    }).setOrigin(0.5);

    // Close instructions
    const closeText = this.add.text(width / 2, height / 2 + panelHeight / 2 - 30, "Press ESC to close", {
        fontFamily: '"Press Start 2P"',
        fontSize: "14px",
        color: "#ffffff",
      }).setOrigin(0.5);
    
    this.tweens.add({
        targets: closeText,
        alpha: 0.5,
        yoyo: true,
        repeat: -1,
        duration: 800
    });


    this.input.keyboard.once("keydown-ESC", () => {
      this.closeOverlay();
    });
  }

  closeOverlay() {
    if (this.callingScene && this.scene.isPaused(this.callingScene.scene.key)) {
      this.scene.resume(this.callingScene.scene.key);
    }
    this.scene.stop();
  }
}
