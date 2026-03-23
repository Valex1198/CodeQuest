import Phaser from "phaser";

export class GuideOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "GuideOverlay" });
    this.currentPage = 0;
    this.pages = [];
  }

  create(data = {}) {
    this.scene.bringToTop();
    const { width, height } = this.scale;
    const { title, content, callingScene } = data;

    this.pages = Array.isArray(content) ? content : [{ title: title, content: content }];
    this.currentPage = 0;
    this.callingScene = callingScene;

    // Pause the calling scene
    if (callingScene && this.scene.isActive(callingScene.scene.key)) {
      this.scene.pause(callingScene.scene.key);
    }

    // Dimming background
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // --- MANUAL DESIGN ---
    const bookWidth = Math.min(700, width * 0.9);
    const bookHeight = Math.min(450, height * 0.8);
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Dark Leather Cover
    this.add.rectangle(centerX, centerY, bookWidth + 10, bookHeight + 10, 0x3e2723).setOrigin(0.5);
    
    // 2. Paper Pages (Left & Right)
    const pageW = bookWidth / 2 - 10;
    const pageH = bookHeight - 20;
    const paperColor = 0xf5f5dc; // Beige/Tan

    this.leftPage = this.add.rectangle(centerX - bookWidth/4, centerY, pageW, pageH, paperColor).setOrigin(0.5);
    this.rightPage = this.add.rectangle(centerX + bookWidth/4, centerY, pageW, pageH, paperColor).setOrigin(0.5);

    // 3. Spine
    this.add.rectangle(centerX, centerY, 4, bookHeight - 10, 0x000000, 0.3).setOrigin(0.5);

    // 4. Page Content Elements
    this.leftTitle = this.add.text(centerX - bookWidth/4, centerY - pageH/2 + 40, "", {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#2b1b17",
      align: "center",
      wordWrap: { width: pageW - 40 }
    }).setOrigin(0.5);

    this.leftText = this.add.text(centerX - bookWidth/4, centerY + 10, "", {
      fontFamily: "VT323",
      fontSize: "20px",
      color: "#2b1b17",
      wordWrap: { width: pageW - 60 },
      align: "left"
    }).setOrigin(0.5);

    this.rightTitle = this.add.text(centerX + bookWidth/4, centerY - pageH/2 + 40, "", {
      fontFamily: '"Press Start 2P"',
      fontSize: "14px",
      color: "#2b1b17",
      align: "center",
      wordWrap: { width: pageW - 40 }
    }).setOrigin(0.5);

    this.rightText = this.add.text(centerX + bookWidth/4, centerY + 10, "", {
      fontFamily: "VT323",
      fontSize: "20px",
      color: "#2b1b17",
      wordWrap: { width: pageW - 60 },
      align: "left"
    }).setOrigin(0.5);

    this.pageNumText = this.add.text(centerX, centerY + bookHeight/2 + 20, "", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#ffffff"
    }).setOrigin(0.5);

    // --- NAVIGATION BUTTONS ---
    const btnStyle = { fontFamily: '"Press Start 2P"', fontSize: "12px", color: "#ffffff", backgroundColor: "#3e2723", padding: { x: 10, y: 5 } };
    
    this.prevBtn = this.add.text(centerX - bookWidth/2, centerY + bookHeight/2 + 25, "< PREV", btnStyle)
        .setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.changePage(-2));

    this.nextBtn = this.add.text(centerX + bookWidth/2, centerY + bookHeight/2 + 25, "NEXT >", btnStyle)
        .setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.changePage(2));

    this.add.text(centerX, centerY + bookHeight/2 + 45, "Press ESC to Close", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#ffffff"
    }).setOrigin(0.5).setAlpha(0.7);

    this.renderPages();

    this.input.keyboard.on("keydown-ESC", () => this.closeOverlay());
    this.input.keyboard.on("keydown-LEFT", () => this.changePage(-2));
    this.input.keyboard.on("keydown-RIGHT", () => this.changePage(2));
  }

  renderPages() {
    // Left Page (Even Index)
    const leftData = this.pages[this.currentPage];
    if (leftData) {
        this.leftTitle.setText(leftData.title.toUpperCase());
        this.leftText.setText(leftData.content);
        this.leftPage.setVisible(true);
        this.leftTitle.setVisible(true);
        this.leftText.setVisible(true);
    } else {
        this.leftPage.setVisible(false);
        this.leftTitle.setVisible(false);
        this.leftText.setVisible(false);
    }

    // Right Page (Odd Index)
    const rightData = this.pages[this.currentPage + 1];
    if (rightData) {
        this.rightTitle.setText(rightData.title.toUpperCase());
        this.rightText.setText(rightData.content);
        this.rightPage.setVisible(true);
        this.rightTitle.setVisible(true);
        this.rightText.setVisible(true);
    } else {
        this.rightPage.setVisible(false);
        this.rightTitle.setVisible(false);
        this.rightText.setVisible(false);
    }

    // Update Page Numbers
    this.pageNumText.setText(`Page ${this.currentPage + 1}-${this.currentPage + 2} of ${this.pages.length}`);

    // Update Button Visibility
    this.prevBtn.setVisible(this.currentPage > 0);
    this.nextBtn.setVisible(this.currentPage + 2 < this.pages.length);
  }

  changePage(delta) {
    const next = this.currentPage + delta;
    if (next >= 0 && next < this.pages.length) {
        this.currentPage = next;
        this.renderPages();
        // Play subtle page turn sound if available
        if (this.sound.get("page_turn")) this.sound.play("page_turn");
    }
  }

  closeOverlay() {
    if (this.callingScene && this.scene.isPaused(this.callingScene.scene.key)) {
      this.scene.resume(this.callingScene.scene.key);
    }
    this.scene.stop();
  }
}
