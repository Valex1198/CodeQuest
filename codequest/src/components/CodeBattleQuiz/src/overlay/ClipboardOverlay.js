import Phaser from "phaser";

export class ClipboardOverlay extends Phaser.Scene {
    constructor() {
        super({ key: "ClipboardOverlay", active: false });
    }

    init(data) {
        this.level = data.level || "Level 1";
        this.totalScore = data.score || 0;
        this.passed = data.passed ?? true;
        this.answers = data.answers || Array(10).fill(null); // 1 = correct, 0 = wrong
    }

    create() {
        const cam = this.cameras.main;
        const width = cam.width;
        const height = cam.height;

        // Clipboard background
        this.clipboard = this.add.rectangle(width / 2, height / 2, 300, 400, 0xffffff)
            .setStrokeStyle(6, 0x8B4513) // brown border
            .setScale(0);

        // Top black circle
        this.add.circle(this.clipboard.x, this.clipboard.y - 200, 15, 0x000000);

        // Status Text (PASSED / FAILED)
        this.statusText = this.add.text(this.clipboard.x, this.clipboard.y - 185, this.passed ? "PASSED" : "FAILED", {
            font: "bold 24px Arial",
            color: this.passed ? "#00aa00" : "#ff0000"
        }).setOrigin(0.5).setAlpha(0);

        // Total score text
        this.scoreText = this.add.text(this.clipboard.x - 120, this.clipboard.y - 160, `Total Score: ${this.totalScore}%`, {
            font: "20px Arial",
            color: "#000"
        }).setAlpha(0);

        // Fail Tip
        this.failTip = this.add.text(this.clipboard.x, this.clipboard.y + 155, "Minimum 60% required to pass", {
            font: "12px Arial",
            color: "#666",
            fontStyle: "italic"
        }).setOrigin(0.5).setAlpha(0).setVisible(!this.passed);

        // Question results 1–10
        this.answerTexts = [];
        for (let i = 0; i < 10; i++) {
            const yPos = this.clipboard.y - 120 + i * 25;
            let symbol = this.answers[i] === 1 ? "✅" : this.answers[i] === 0 ? "❌" : "-";
            const text = this.add.text(this.clipboard.x - 120, yPos, `${i + 1}. ${symbol}`, {
                font: "18px Arial",
                color: "#000"
            }).setAlpha(0);
            this.answerTexts.push(text);
        }

        // Close X button (top-right)
        const xSize = 20;
        this.closeBtn = this.add.text(this.clipboard.x + 130, this.clipboard.y - 190, "X", {
            font: "24px Arial",
            color: "#ff0000",
            fontStyle: "bold"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

        this.closeBtn.on("pointerdown", () => {
            this.scene.stop();
        });

        // Animate pop-in
        this.tweens.add({
            targets: [this.clipboard, this.statusText, this.scoreText, ...this.answerTexts, this.closeBtn, this.failTip],
            scale: 1,
            alpha: 1,
            ease: "Back.Out",
            duration: 500
        });

        // Keep overlay centered on camera
        cam.on('cameraupdate', () => {
            this.clipboard.setPosition(cam.midPoint.x, cam.midPoint.y);
            this.statusText.setPosition(cam.midPoint.x, cam.midPoint.y - 185);
            this.scoreText.setPosition(cam.midPoint.x - 120, cam.midPoint.y - 160);
            for (let i = 0; i < this.answerTexts.length; i++) {
                this.answerTexts[i].setPosition(cam.midPoint.x - 120, cam.midPoint.y - 120 + i * 25);
            }
            this.closeBtn.setPosition(cam.midPoint.x + 130, cam.midPoint.y - 190);
            this.failTip.setPosition(cam.midPoint.x, cam.midPoint.y + 155);
        });

        // Optional: close overlay with INS key
        this.input.keyboard.once("keydown-INS", () => {
            this.scene.stop();
        });
    }

    updateScore(score) {
        this.totalScore = score;
        this.scoreText.setText(`Total Score: ${score}`);
    }

    updateAnswers(answers) {
        this.answers = answers;
        for (let i = 0; i < this.answerTexts.length; i++) {
            let symbol = this.answers[i] === 1 ? "✅" : this.answers[i] === 0 ? "❌" : "-";
            this.answerTexts[i].setText(`${i + 1}. ${symbol}`);
        }
    }
}
