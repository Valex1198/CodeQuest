import Phaser from "phaser";
import { getInventory } from "./InventoryManager";

export class InventoryOverlay extends Phaser.Scene {
    constructor() {
        super({ key: "InventoryOverlay", active: false });
    }

    create() {
        const { width } = this.scale;
        
        // --- 1. BAG ICON BUTTON (TOP RIGHT) ---
        // Positioned to match the HUD's margin from the left, but on the right
        this.bagContainer = this.add.container(width - 50, 50).setDepth(1000).setScrollFactor(0);
        
        this.bagBg = this.add.graphics();
        this.drawBagBg(0x333333, 0.9, 0xffd700);
        
        this.bagIcon = this.add.text(0, 0, "👜", { fontSize: "24px" }).setOrigin(0.5);
        this.bagContainer.add([this.bagBg, this.bagIcon]);
        
        // Larger hit area for easier clicking
        this.bagContainer.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains)
            .on("pointerover", () => {
                this.drawBagBg(0x555555, 1, 0xffffff);
                this.bagContainer.setScale(1.1);
            })
            .on("pointerout", () => {
                this.drawBagBg(0x333333, 0.9, 0xffd700);
                this.bagContainer.setScale(1.0);
            })
            .on("pointerdown", () => this.toggleInventory());

        // --- 2. INVENTORY PANEL ---
        this.inventoryContainer = this.add.container(width / 2, this.scale.height / 2).setDepth(2000).setVisible(false);
        
        // Full-screen overlay to catch clicks outside
        const overlay = this.add.rectangle(0, 0, width, this.scale.height, 0x000000, 0.6)
            .setInteractive()
            .on("pointerdown", () => this.toggleInventory());
        this.inventoryContainer.add(overlay);

        const panelWidth = 280;
        const panelHeight = 360;
        const panel = this.add.graphics();
        
        // Shadow and Panel Body
        panel.fillStyle(0x000000, 0.5);
        panel.fillRoundedRect(-panelWidth/2 + 5, -panelHeight/2 + 5, panelWidth, panelHeight, 15);
        panel.fillStyle(0x1a1a1a, 0.98);
        panel.lineStyle(4, 0xffd700, 1);
        panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15);
        panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15);
        this.inventoryContainer.add(panel);

        // Title
        const title = this.add.text(0, -panelHeight/2 + 30, "INVENTORY", {
            fontFamily: '"Press Start 2P"',
            fontSize: "16px",
            fill: "#ffd700"
        }).setOrigin(0.5);
        this.inventoryContainer.add(title);

        // --- 3. CLOSE BUTTON (FIXED) ---
        const closeBtnBg = this.add.graphics();
        closeBtnBg.fillStyle(0xff4444, 1);
        closeBtnBg.fillCircle(panelWidth/2 - 20, -panelHeight/2 + 25, 15);
        
        const closeIcon = this.add.text(panelWidth/2 - 20, -panelHeight/2 + 25, "✖", {
            fontSize: "18px",
            fill: "#ffffff"
        }).setOrigin(0.5);

        // Create a dedicated interactive zone for the close button
        const closeZone = this.add.zone(panelWidth/2 - 20, -panelHeight/2 + 25, 40, 40)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", (pointer, x, y, event) => {
                event.stopPropagation(); // Prevent overlay from triggering
                this.toggleInventory();
            })
            .on("pointerover", () => closeIcon.setScale(1.2))
            .on("pointerout", () => closeIcon.setScale(1.0));

        this.inventoryContainer.add([closeBtnBg, closeIcon, closeZone]);

        // Grid properties
        const slotSize = 64;
        const padding = 12;
        const columns = 3;
        this.slots = [];

        for (let i = 0; i < 9; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = (col - 1) * (slotSize + padding);
            const y = (row - 1) * (slotSize + padding) + 20;

            const slotBg = this.add.graphics();
            this.drawSlot(slotBg, x, y, slotSize, false);
            this.inventoryContainer.add(slotBg);
            
            const slotText = this.add.text(x, y, "", { 
                fontSize: "10px", 
                fill: "#ffffff",
                wordWrap: { width: slotSize - 10 },
                align: "center"
            }).setOrigin(0.5);
            this.inventoryContainer.add(slotText);
            
            // Add interaction zone for each slot
            const slotZone = this.add.zone(x, y, slotSize, slotSize)
                .setInteractive({ useHandCursor: true })
                .on("pointerdown", () => this.handleSlotClick(i));
            this.inventoryContainer.add(slotZone);
            
            this.slots.push({ bg: slotBg, text: slotText, x, y, size: slotSize, zone: slotZone });
        }

        // Global Key Listener
        this.input.keyboard.on("keydown-I", () => this.toggleInventory());
    }

    handleSlotClick(index) {
        const items = getInventory();
        const item = items[index];
        if (!item) return;

        const itemName = typeof item === 'string' ? item : (item.name || "");
        
        if (itemName === "School ID") {
            // Close inventory first
            this.toggleInventory();
            
            // Ensure scene is launched
            if (!this.scene.isActive("SchoolIDOverlay")) {
                this.scene.launch("SchoolIDOverlay");
            }
            
            // Launch/Toggle SchoolIDOverlay
            const schoolIDScene = this.scene.get("SchoolIDOverlay");
            if (schoolIDScene) {
                schoolIDScene.toggleID();
            }
        }
    }

    drawBagBg(color, alpha, lineColor) {
        this.bagBg.clear();
        this.bagBg.fillStyle(color, alpha);
        this.bagBg.lineStyle(2, lineColor, 1);
        this.bagBg.fillCircle(0, 0, 22);
        this.bagBg.strokeCircle(0, 0, 22);
    }

    drawSlot(graphics, x, y, size, occupied) {
        graphics.clear();
        graphics.fillStyle(occupied ? 0x3a3a5a : 0x2a2a2a, 1);
        graphics.lineStyle(2, occupied ? 0xffd700 : 0x444444, 1);
        graphics.fillRoundedRect(x - size/2, y - size/2, size, size, 8);
        graphics.strokeRoundedRect(x - size/2, y - size/2, size, size, 8);
    }

    toggleInventory() {
        const isVisible = !this.inventoryContainer.visible;
        this.inventoryContainer.setVisible(isVisible);
        
        if (isVisible) {
            const items = getInventory();
            this.slots.forEach((slot, index) => {
                const item = items[index];
                if (item) {
                    const name = typeof item === 'string' ? item : (item.name || "Item");
                    slot.text.setText(name);
                    this.drawSlot(slot.bg, slot.x, slot.y, slot.size, true);
                } else {
                    slot.text.setText("");
                    this.drawSlot(slot.bg, slot.x, slot.y, slot.size, false);
                }
            });
        }
    }
}
