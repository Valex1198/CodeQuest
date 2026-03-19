import Phaser from "phaser";
import { getGoals, GOAL_DEFINITIONS } from "../utils/GoalManager";

export class GoalOverlay extends Phaser.Scene {
    constructor() {
        super({ key: "GoalOverlay", active: false });
    }

    drawTargetBg(fillColor, fillAlpha, strokeColor) {
        this.targetBg.clear();
        this.targetBg.fillStyle(fillColor, fillAlpha);
        this.targetBg.lineStyle(2, strokeColor, 1);
        this.targetBg.fillCircle(0, 0, 20);
        this.targetBg.strokeCircle(0, 0, 20);
    }

    create() {
        const { width, height } = this.scale;

        // --- 0. TARGET BUTTON (TOP RIGHT, LEFT OF INVENTORY) ---
        this.targetContainer = this.add.container(width - 110, 50).setDepth(1000).setScrollFactor(0);
        
        this.targetBg = this.add.graphics();
        this.drawTargetBg(0x333333, 0.9, 0x00ff00);

        this.targetIcon = this.add.text(0, 0, "🎯", { fontSize: "24px" }).setOrigin(0.5);
        this.targetContainer.add([this.targetBg, this.targetIcon]);

        this.targetContainer.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains)
            .on("pointerover", () => {
                this.drawTargetBg(0x555555, 1, 0xffffff);
                this.targetContainer.setScale(1.1);
            })
            .on("pointerout", () => {
                this.drawTargetBg(0x333333, 0.9, 0x00ff00);
                this.targetContainer.setScale(1.0);
            })
            .on("pointerdown", () => this.toggleGoals());

        // --- 1. NOTIFICATION CONTAINER (TOP CENTER) ---
        this.notifContainer = this.add.container(width / 2, -100).setDepth(3000);
        
        const notifBg = this.add.graphics();
        notifBg.fillStyle(0x00aa00, 0.9);
        notifBg.fillRoundedRect(-150, 0, 300, 50, 10);
        notifBg.lineStyle(2, 0xffffff, 1);
        notifBg.strokeRoundedRect(-150, 0, 300, 50, 10);
        
        this.notifText = this.add.text(0, 25, "", {
            fontFamily: '"Press Start 2P"',
            fontSize: "10px",
            fill: "#ffffff"
        }).setOrigin(0.5);
        
        this.notifContainer.add([notifBg, this.notifText]);

        // --- 2. GOALS LIST PANEL ---
        this.goalsContainer = this.add.container(width / 2, height / 2).setDepth(2500).setVisible(false);
        
        // Full-screen overlay to catch clicks outside
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
            .setInteractive()
            .on("pointerdown", () => this.toggleGoals());
        this.goalsContainer.add(overlay);

        const panelWidth = 400;
        const panelHeight = 350;
        const panel = this.add.graphics();
        
        panel.fillStyle(0x1a1a1a, 0.95);
        panel.lineStyle(4, 0x00ff00, 1);
        panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15);
        panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15);
        this.goalsContainer.add(panel);

        const title = this.add.text(0, -panelHeight/2 + 30, "CURRENT GOALS", {
            fontFamily: '"Press Start 2P"',
            fontSize: "18px",
            fill: "#00ff00"
        }).setOrigin(0.5);
        this.goalsContainer.add(title);

        this.goalItemsGroup = this.add.group();

        // Global Key Listener
        this.input.keyboard.on("keydown-G", () => this.toggleGoals());
    }

    showNotification(goalId) {
        const description = GOAL_DEFINITIONS[goalId] || goalId;
        this.notifText.setText(`GOAL REACHED:\n${description}`);
        
        this.tweens.add({
            targets: this.notifContainer,
            y: 20,
            duration: 500,
            ease: "Back.easeOut",
            onComplete: () => {
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: this.notifContainer,
                        y: -100,
                        duration: 500,
                        ease: "Power2"
                    });
                });
            }
        });
    }

    toggleGoals() {
        const isVisible = !this.goalsContainer.visible;
        this.goalsContainer.setVisible(isVisible);
        
        if (isVisible) {
            this.refreshGoalsList();
        }
    }

    refreshGoalsList() {
        // Clear previous items
        this.goalItemsGroup.clear(true, true);
        
        const goals = getGoals();
        const startY = -100;
        const spacing = 35;

        Object.entries(GOAL_DEFINITIONS).forEach(([id, description], index) => {
            const completed = !!goals[id];
            const color = completed ? "#00ff00" : "#ffffff";
            const prefix = completed ? "✓ " : "□ ";
            
            const text = this.add.text(-160, startY + (index * spacing), prefix + description, {
                fontFamily: 'Arial',
                fontSize: "16px",
                fill: color,
                fontStyle: completed ? "italic" : "bold"
            });
            
            if (completed) {
                // Add a strike-through effect or lower alpha
                text.setAlpha(0.7);
            }

            this.goalsContainer.add(text);
            this.goalItemsGroup.add(text);
        });
    }
}
