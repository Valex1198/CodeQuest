import Phaser from "phaser";
import { handleDialogueActions } from "../utils/DialogueManager";

export class DialogueOverlay extends Phaser.Scene {
  constructor() {
    super({ key: "DialogueOverlay" });
    this.callingScene = null;
  }

  create(data) {
    const { dialogueNode, npcName, callingScene } = data;

    this.input.setGlobalTopOnly(true);
    // Dimming background
    this.dimmer = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5).setOrigin(0);
    this.dimmer.setInteractive(); // Prevent clicking through

    this.dialogueContainer = this.add.container(this.scale.width / 2, this.scale.height - 150);
    const boxWidth = this.scale.width * 0.8;
    const boxHeight = 180;
    
    // Dialogue Box
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x1a1a1a, 0.9);
    this.dialogueBox.lineStyle(2, 0xbebebe, 1);
    this.dialogueBox.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 10);
    this.dialogueBox.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 10);
    
    // NPC Name
    this.npcNameText = this.add.text(-boxWidth / 2 + 20, -boxHeight/2 - 25, "", {
      fontSize: "20px",
      fontFamily: '"Press Start 2P"',
      fill: "#ffffff",
      backgroundColor: "#1a1a1a",
      padding: { x: 10, y: 5 }
    });

    // Dialogue Text
    this.dialogueText = this.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 20, "", {
      fontSize: "18px",
      fontFamily: "VT323",
      fill: "#ffffff",
      wordWrap: { width: boxWidth - 40 },
    });

    this.dialogueContainer.add([this.dialogueBox, this.npcNameText, this.dialogueText]);
    this.optionsContainer = this.add.container(this.dialogueContainer.x, this.dialogueContainer.y + boxHeight/2 + 20);
    
    this.showDialogue(dialogueNode, npcName, callingScene);
  }

  showDialogue(node, npcName, callingScene) {
    this.callingScene = callingScene;
    this.dialogueContainer.setVisible(true);
    this.optionsContainer.setVisible(true);
    this.dialogueText.setText(node.text);
    this.npcNameText.setText(npcName);
    
    // Clear previous options
    this.optionsContainer.removeAll(true);
    
    // Handle Actions
    if (node.actions && this.callingScene && this.callingScene.updateGameState) {
        handleDialogueActions(node.actions, this.callingScene.updateGameState.bind(this.callingScene));
    }

    // Handle Options
    if (node.options && node.options.length > 0) {
      node.options.forEach((option, index) => {
        const optionY = index * 40;
        const optionBtn = this.add.text(0, optionY, `> ${option.text}`, {
          fontSize: "18px",
          fontFamily: "VT323",
          fill: "#ffffff",
          backgroundColor: "#333333",
          padding: { x: 8, y: 4 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

        optionBtn.on("pointerover", () => optionBtn.setBackgroundColor("#555555"));
        optionBtn.on("pointerout", () => optionBtn.setBackgroundColor("#333333"));
        optionBtn.on("pointerdown", () => {
          this.handleOptionClick(option.nextNode);
        });
        this.optionsContainer.add(optionBtn);
      });
    } else {
        // Add a continue/close button if no other options
        const continueBtn = this.add.text(0, 0, "> [Close]", {
            fontSize: "18px",
            fontFamily: "VT323",
            fill: "#ffffff",
            backgroundColor: "#333333",
            padding: { x: 8, y: 4 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

        continueBtn.on("pointerover", () => continueBtn.setBackgroundColor("#555555"));
        continueBtn.on("pointerout", () => continueBtn.setBackgroundColor("#333333"));
        continueBtn.on("pointerdown", () => {
            this.closeDialogue();
        });
        this.optionsContainer.add(continueBtn);
    }
  }

  handleOptionClick(nextNodeId) {
    const nextNode = this.callingScene.getDialogueNodeById(nextNodeId);
    if (nextNode) {
      this.showDialogue(nextNode, this.npcNameText.text, this.callingScene);
    } else {
      console.warn(`Node not found: ${nextNodeId}`);
      this.closeDialogue();
    }
  }

  closeDialogue() {
    this.dialogueContainer.setVisible(false);
    this.optionsContainer.setVisible(false);
    
    // Let the calling scene know we are done
    if (this.callingScene && this.callingScene.events) {
        this.callingScene.events.emit('dialogueClosed');
    }
    
    // Shut down this overlay scene
    this.scene.stop();
  }
}
