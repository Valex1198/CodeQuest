import Phaser from "phaser";

export class PickupOverlay extends Phaser.Scene {
    constructor() {
        super({ key: "PickupOverlay", active: false });
        this.boxWidth = 300;
        this.boxHeight = 60;
    }

    create() {
        this.container = this.add.container(this.scale.width / 2, this.scale.height + 100);
        this.container.setAlpha(0);
        this.container.setDepth(2000); // Lowered depth as requested

        // --- 1. BACKGROUND BOX ---
        const bg = this.add.graphics();
        // Dark background
        bg.fillStyle(0x222222, 0.9);
        bg.fillRoundedRect(-this.boxWidth / 2, -this.boxHeight / 2, this.boxWidth, this.boxHeight, 10);
        
        // Golden/Yellow border
        bg.lineStyle(3, 0xffd700, 1);
        bg.strokeRoundedRect(-this.boxWidth / 2, -this.boxHeight / 2, this.boxWidth, this.boxHeight, 10);
        
        this.container.add(bg);

        // --- 2. ICON SPACE ---
        // Using a built-in Phaser texture as a placeholder if none provided
        this.icon = this.add.image(-this.boxWidth / 2 + 40, 0, "__default");
        this.icon.setDisplaySize(40, 40);
        this.container.add(this.icon);

        // --- 3. TEXT IDENTIFIER ---
        this.text = this.add.text(-this.boxWidth / 2 + 80, 0, "", {
            fontFamily: 'Arial',
            fontSize: "14px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0, 0.5);
        this.container.add(this.text);

        // Global event listener for showPickup
        this.events.on("showPickup", (data) => {
            this.show(data.name, data.iconKey);
        });

        // Mark as ready
        this.isReady = true;
    }

    show(name, iconKey) {
        // If scene isn't fully created yet, wait and try again
        if (!this.isReady) {
            this.events.once("create", () => this.show(name, iconKey));
            return;
        }

        // Update content
        if (this.text) this.text.setText(`Picked up: ${name}`);
        
        if (iconKey && this.textures.exists(iconKey)) {
            this.icon.setTexture(iconKey);
            this.icon.setDisplaySize(40, 40);
            this.icon.setVisible(true);
            this.text.setX(-this.boxWidth / 2 + 80);
        } else {
            this.icon.setVisible(false);
            this.text.setX(-this.boxWidth / 2 + 40); // Center text more if no icon
        }

        // Animation
        this.tweens.killAll(); // Stop any current animations
        
        this.container.setY(this.scale.height + 100);
        this.container.setAlpha(0);
        this.scene.setVisible(true, "PickupOverlay");

        this.tweens.add({
            targets: this.container,
            y: this.scale.height - 100,
            alpha: 1,
            duration: 500,
            ease: "Back.easeOut"
        });

        // Hide after 2.5 seconds
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: this.container,
                y: this.scale.height + 50,
                alpha: 0,
                duration: 500,
                ease: "Power2",
                onComplete: () => {
                    this.scene.setVisible(false, "PickupOverlay");
                }
            });
        });
    }
}
