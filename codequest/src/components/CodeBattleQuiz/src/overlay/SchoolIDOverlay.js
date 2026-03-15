import Phaser from "phaser";
import { createSchoolID } from "../utils/SchoolIDUtil.js";

export class SchoolIDOverlay extends Phaser.Scene {
    constructor() {
        super({ key: "SchoolIDOverlay", active: false });
    }

    create() {
        const { width, height } = this.scale;

        // --- 1. FULL SCREEN OVERLAY ---
        // Dim the background when ID is visible
        this.overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive()
            .setVisible(false)
            .setScrollFactor(0)
            .setDepth(3000);

        // --- 2. SQUARE BACKGROUND PANEL ---
        // The user requested a "square background"
        const panelSize = 400;
        this.panel = this.add.container(width / 2, height / 2).setDepth(3001).setVisible(false);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 1);
        bg.lineStyle(4, 0xffd700, 1); // Golden border
        bg.fillRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
        bg.strokeRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
        this.panel.add(bg);

        // --- 3. INSTRUCTION TEXT ---
        const hint = this.add.text(0, panelSize / 2 - 20, "Press TAB to close", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#aaaaaa"
        }).setOrigin(0.5);
        this.panel.add(hint);

        // --- 4. THE SCHOOL ID ---
        const storedUser = JSON.parse(localStorage.getItem("user")) || { username: "Student", id: "000001" };
        
        // We call createSchoolID and it returns a container
        // We need to wait for it if it loads textures
        const idContainer = createSchoolID(this, 0, 0, storedUser);
        if (idContainer) {
            idContainer.setScale(2.5); // Larger size for the panel
            this.panel.add(idContainer);
        } else {
            // Wait for creation if it was async
            this.events.once("idCreated", (container) => {
                container.setScale(2.5);
                this.panel.add(container);
            });
        }

        // --- 5. KEY TRIGGER ---
        this.input.keyboard.on("keydown-TAB", (event) => {
            event.preventDefault(); // Stop default browser behavior
            this.toggleID();
        });

        // Click overlay to close
        this.overlay.on("pointerdown", () => this.toggleID());

        // Mark as ready
        this.isReady = true;
    }

    showID(customScale = 1.0, showDimOverlay = true) {
        if (!this.isReady) {
            this.events.once("create", () => this.showID(customScale, showDimOverlay));
            return;
        }
        if (!this.panel) return;

        this.panel.setVisible(true);
        this.overlay.setVisible(showDimOverlay);
        this.panel.setScale(customScale);
    }

    hideID() {
        if (!this.panel) return;
        this.panel.setVisible(false);
        this.overlay.setVisible(false);
    }

    toggleID() {
        if (!this.panel) return;
        if (this.panel.visible) {
            this.hideID();
        } else {
            this.showID(1.0, true);
        }
    }
}
