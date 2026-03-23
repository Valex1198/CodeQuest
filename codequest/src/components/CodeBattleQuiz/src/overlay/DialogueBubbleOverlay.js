import Phaser from "phaser";
import { handleDialogueActions } from "../utils/DialogueManager";

export class DialogueBubbleOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "DialogueBubbleOverlay" });
    this.callingScene = null;
    this.activeNPC = null;
    this.optionKeys = [];
  }

  create(data) {
    const { dialogueNode, npcName, callingScene, activeNPC } = data;
    this.callingScene = callingScene;
    this.activeNPC = activeNPC;

    // 1. Bubble Container (For NPC Text)
    this.bubbleContainer = this.add.container(0, 0).setDepth(100);
    this.bubbleBg = this.add.graphics();
    this.dialogueText = this.add.text(0, 0, "", {
      fontSize: "12px",
      fill: "#ffffff",
      wordWrap: { width: 180 },
      align: "center"
    }).setOrigin(0.5);
    this.bubbleContainer.add([this.bubbleBg, this.dialogueText]);

    // 2. Options Container (Tilted Rectangle below player)
    this.optionsContainer = this.add.container(0, 0).setDepth(105);
    this.optionsBg = this.add.graphics();
    this.optionsList = this.add.container(0, 0);
    this.optionsContainer.add([this.optionsBg, this.optionsList]);
    
    // Keyboard Listeners
    this.optionKeys = [
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    ];

    this.showDialogue(dialogueNode);
  }

  drawBubble(width, height, arrowX = 0) {
    const graphics = this.bubbleBg;
    graphics.clear();
    
    // Aesthetic Dark Theme with White Outline (Matching SchoolScene)
    graphics.fillStyle(0x000000, 0.8);
    graphics.lineStyle(2, 0xffffff, 1);
    
    const halfW = width / 2;
    const h = height;
    
    graphics.fillRoundedRect(-halfW, -h, width, h, 10);
    graphics.strokeRoundedRect(-halfW, -h, width, h, 10);
    
    // Arrow
    const arrowSize = 10;
    const clampedArrowX = Phaser.Math.Clamp(arrowX, -halfW + 15, halfW - 15);
    
    graphics.beginPath();
    graphics.moveTo(clampedArrowX - arrowSize, 0);
    graphics.lineTo(clampedArrowX + arrowSize, 0);
    graphics.lineTo(clampedArrowX, arrowSize);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  drawOptionsBox(width, height) {
    const graphics = this.optionsBg;
    graphics.clear();
    
    // Sleek Dark Gray with White Border
    graphics.fillStyle(0x111111, 0.9);
    graphics.lineStyle(2, 0xffffff, 1); 
    
    const skew = 12; 
    const points = [
        { x: -width/2 + skew, y: 0 },
        { x: width/2 + skew, y: 0 },
        { x: width/2 - skew, y: height },
        { x: -width/2 - skew, y: height }
    ];
    
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    graphics.lineTo(points[1].x, points[1].y);
    graphics.lineTo(points[2].x, points[2].y);
    graphics.lineTo(points[3].x, points[3].y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  showDialogue(node) {
    if (!node) {
        this.closeDialogue();
        return;
    }

    if (this.autoCloseTimer) this.autoCloseTimer.remove();
    if (!node.options || node.options.length === 0) {
        this.autoCloseTimer = this.time.delayedCall(5000, () => this.closeDialogue());
    }

    this.dialogueText.setText(node.text);
    const padding = 20;
    const bubbleWidth = 200;
    const textHeight = this.dialogueText.height;
    const totalHeight = textHeight + padding * 2;

    this.drawBubble(bubbleWidth, totalHeight);
    this.dialogueText.setY(-totalHeight / 2);

    if (node.actions && this.callingScene && this.callingScene.updateGameState) {
        handleDialogueActions(node.actions, this.callingScene.updateGameState.bind(this.callingScene));
    }

    this.optionsList.removeAll(true);
    this.currentOptions = node.options || [];

    if (this.currentOptions.length > 0) {
        this.optionsContainer.setVisible(true);
        const optWidth = 180;
        let currentY = 18;
        
        this.currentOptions.forEach((option, index) => {
            const prefix = `${index + 1}. `;
            const optionBtn = this.add.text(0, currentY, `${prefix}${option.text}`, {
                fontSize: "10px",
                fontFamily: '"Press Start 2P"',
                fill: "#cccccc",
                wordWrap: { width: optWidth - 30 },
                align: "center"
            }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

            optionBtn.on("pointerover", () => optionBtn.setFill("#ffffff"));
            optionBtn.on("pointerout", () => optionBtn.setFill("#cccccc"));
            optionBtn.on("pointerdown", () => this.handleOptionClick(option.nextNode));
            
            this.optionsList.add(optionBtn);
            currentY += optionBtn.height + 14;
        });

        const boxHeight = currentY + 14;
        this.drawOptionsBox(optWidth, boxHeight);
    } else {
        this.optionsContainer.setVisible(false);
        this.bubbleContainer.setSize(bubbleWidth, totalHeight);
        this.bubbleContainer.setInteractive(new Phaser.Geom.Rectangle(-bubbleWidth/2, -totalHeight, bubbleWidth, totalHeight), Phaser.Geom.Rectangle.Contains);
        this.bubbleContainer.on("pointerdown", () => this.closeDialogue());
    }

    this.updateBubblePosition();
  }

  handleOptionClick(nextNodeId) {
    if (this.callingScene && this.callingScene.getDialogueNodeById) {
        const nextNode = this.callingScene.getDialogueNodeById(nextNodeId);
        if (nextNode) {
            this.showDialogue(nextNode);
        } else {
            this.closeDialogue();
        }
    } else {
        this.closeDialogue();
    }
  }

  updateBubblePosition() {
    if (!this.activeNPC || !this.activeNPC.active || !this.callingScene) {
        this.closeDialogue();
        return;
    }

    const cam = this.callingScene.cameras.main;
    const player = this.callingScene.player;
    
    const npcScreenX = (this.activeNPC.x - cam.worldView.x) * cam.zoom;
    const npcScreenY = (this.activeNPC.y - 45 - cam.worldView.y) * cam.zoom;
    this.bubbleContainer.setPosition(Math.round(npcScreenX), Math.round(npcScreenY));
    
    if (player && this.optionsContainer.visible) {
        const playerScreenX = (player.x - cam.worldView.x) * cam.zoom;
        const playerScreenY = (player.y + 40 - cam.worldView.y) * cam.zoom;
        this.optionsContainer.setPosition(Math.round(playerScreenX), Math.round(playerScreenY));
    }
  }

  update() {
    this.updateBubblePosition();
    if (this.optionsContainer.visible && this.currentOptions) {
        this.optionKeys.forEach((key, index) => {
            if (Phaser.Input.Keyboard.JustDown(key) && this.currentOptions[index]) {
                this.handleOptionClick(this.currentOptions[index].nextNode);
            }
        });
    }
  }

  closeDialogue() {
    if (this.callingScene && this.callingScene.events) {
        this.callingScene.events.emit('dialogueClosed');
    }
    this.scene.stop();
  }
}
