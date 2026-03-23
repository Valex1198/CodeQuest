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
        
        let guideTitle = "";
        let guideContent = "";

        switch(itemName) {
            case "School ID":
                this.toggleInventory();
                if (!this.scene.isActive("SchoolIDOverlay")) {
                    this.scene.launch("SchoolIDOverlay");
                }
                const schoolIDScene = this.scene.get("SchoolIDOverlay");
                if (schoolIDScene) {
                    schoolIDScene.toggleID();
                }
                break;
            
            case "Python Print Guide":
                this.showGuide("Python Printing", [
                    {
                        title: "Introduction",
                        content: "The print() function is your first tool in Python.\n\nIt allows you to output text, numbers, and more to the console so you can see what your code is doing."
                    },
                    {
                        title: "Basic Syntax",
                        content: "To use it, simply write 'print' followed by parentheses:\n\nprint(\"Hello!\")\n\nThe text inside must be in quotes!"
                    },
                    {
                        title: "Multi-Print",
                        content: "You can print multiple items by separating them with commas:\n\nprint(\"Score:\", 100)\n\nPython will automatically add a space between them!"
                    },
                    {
                        title: "Common Errors",
                        content: "1. Missing quotes: print(Hello) will fail because Python thinks Hello is a variable.\n\n2. Missing parens: In Python 3, print \"Hello\" is an error."
                    }
                ]);
                break;

            case "Java Print Guide":
                this.showGuide("Java Printing", [
                    {
                        title: "Overview",
                        content: "In Java, printing is a bit more verbose. We use the System class to talk to the console."
                    },
                    {
                        title: "Syntax",
                        content: "The command is:\n\nSystem.out.println(\"Hello!\");\n\nDon't forget the semicolon (;) at the end!"
                    },
                    {
                        title: "ln vs print",
                        content: "println adds a new line at the end.\n\nprint stays on the same line for the next output."
                    },
                    {
                        title: "Common Errors",
                        content: "1. Case Sensitivity: 'system' with a lowercase 's' will not work.\n\n2. Quotes: Always use double quotes (\") for text strings."
                    }
                ]);
                break;

            case "C++ Print Guide":
                this.showGuide("C++ Printing", [
                    {
                        title: "Standard I/O",
                        content: "C++ uses 'streams' for input and output. We use 'cout' (Console Out)."
                    },
                    {
                        title: "Basic Use",
                        content: "You'll need:\n\n#include <iostream>\n\nstd::cout << \"Hello!\" << std::endl;\n\nThe << operator 'pushes' data to the stream."
                    },
                    {
                        title: "Namespace",
                        content: "Using 'std::' tells C++ we want the standard version. 'endl' adds a new line and flushes the buffer!"
                    },
                    {
                        title: "Common Errors",
                        content: "1. Missing Header: Without #include <iostream>, cout won't exist.\n\n2. Wrong Arrow: Always use << for output, never >>."
                    }
                ]);
                break;
        }
    }

    showGuide(title, content) {
        this.toggleInventory(); // Close inventory
        
        const callingScene = this.scene.manager.getScenes(true).find(scene => scene.scene.key !== this.scene.key);

        this.scene.launch("GuideOverlay", {
            title: title,
            content: content,
            callingScene: callingScene || this
        });
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
            this.refreshInventory();
        }
    }

    refreshInventory() {
        const items = getInventory();
        if (!this.slots) return;
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
