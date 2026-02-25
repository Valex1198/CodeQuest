import Phaser from "phaser";
import HUDImage from "../assets/HUD.png";
import hudMapJSON from "../assets/HUD.json";
import { getSave } from "../utils/saveManager.js";

export class HudOverlay extends Phaser.Scene {
    constructor() {
        super({ key: "HudOverlay", active: false });
    }

    init(data) {
        this.player = data.player;
        this.playerScore = data.playerScore || 0;
        this.saveSlot = data.saveSlot || 1;
        this.language = data.language || "Python";
        
    }

    preload() {
        this.load.image("hudImage", HUDImage);
        this.load.tilemapTiledJSON("hudMap", hudMapJSON);
    }

    create() {
        const hudX = 10;
        const hudY = 10;

        this.hud = this.add.image(hudX, hudY, "hudImage")
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(2);

        const map = this.make.tilemap({ key: "hudMap" });
        const objectLayer = map.getObjectLayer("Object Layer 1");

        if (objectLayer?.objects) {
            objectLayer.objects.forEach(obj => {
                const textX = hudX + obj.x + obj.width / 2;
                const textY = hudY + obj.y + obj.height / 2;

                // ---------------- Language / View Stats Button ----------------
                if (obj.name === "viewStats") {
                    this.viewStatsText = this.add.text(textX, textY, this.language, {
                        fontFamily: '"Press Start 2P"',
                        fontSize: '18px',
                        color: '#00ffff',
                        align: 'center'
                    })
                    .setOrigin(0.5)
                    .setDepth(3)
                    .setShadow(2, 2, "#000", 2, true, true)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => {
                        console.log("View Stats clicked!");

                        // Hide HUD
                        this.scene.setVisible(false, "HudOverlay");

                        // Launch StatsOverlay
                        this.scene.launch("StatsOverlay", {
                            player: this.player,
                            language: this.language,
                            previousScene: this.scene.key,
                            saveSlot: this.saveSlot
                        });
                    });

                    // Alternate text tween like Score
                    this.time.addEvent({
                        delay: 2000,
                        loop: true,
                        callback: () => {
                            this.tweens.add({
                                targets: this.viewStatsText,
                                alpha: 0,
                                duration: 300,
                                ease: 'Power1',
                                yoyo: false,
                                onComplete: () => {
                                    const current = this.viewStatsText.text;
                                    this.viewStatsText.setText(current === "Stats" ? this.language : "Stats");
                                    this.tweens.add({
                                        targets: this.viewStatsText,
                                        alpha: 1,
                                        duration: 300,
                                        ease: 'Power1'
                                    });
                                }
                            });
                        }
                    });
                }

                // ---------------- Smooth rotating score ----------------
                if (obj.name === "playerScore") {
                    this.playerScoreText = this.add.text(textX, textY, "Score", {
                        fontFamily: '"Press Start 2P"',
                        fontSize: '20px',
                        color: '#FFD700',
                        align: 'center'
                    })
                    .setOrigin(0.5)
                    .setDepth(3)
                    .setShadow(2,2,"#000",2,true,true);

                    // Sparkle effect
                    this.tweens.add({
                        targets: this.playerScoreText,
                        alpha: { from: 0.7, to: 1 },
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });

                    // Smooth text rotation tween
                    this.time.addEvent({
                        delay: 2000,
                        loop: true,
                        callback: () => {
                            this.tweens.add({
                                targets: this.playerScoreText,
                                alpha: 0,
                                duration: 300,
                                ease: 'Power1',
                                yoyo: false,
                                onComplete: () => {
                                    const current = this.playerScoreText.text;
                                    this.playerScoreText.setText(current === "Score" ? `${this.playerScore}` : "Score");
                                    this.tweens.add({
                                        targets: this.playerScoreText,
                                        alpha: 1,
                                        duration: 300,
                                        ease: 'Power1'
                                    });
                                }
                            });
                        }
                    });
                }

                // ---------------- Avatar ----------------
                if (obj.name === "avatarZone") {
                    let avatarPath = this.player.avatar || "/avatars/default.png";
                    if (avatarPath.startsWith("/")) avatarPath = avatarPath.slice(1);

                    this.load.image("userAvatar", avatarPath);
                    this.load.once("complete", () => {
                        const avatar = this.add.image(hudX + obj.x, hudY + obj.y, "userAvatar")
                            .setOrigin(0,0)
                            .setDisplaySize(obj.width, obj.height)
                            .setDepth(3);
                    });
                    this.load.start();
                }
            });
        }
    }

    async updateTotalScore() {
    try {
        const storedUser = JSON.parse(localStorage.getItem("user")) || { id: 1 };
        const saveData = await getSave(storedUser.id, this.saveSlot) || {};

        let totalScore = 0;

        // Sum all quiz scores
        if (saveData.quiz) {
            for (const lang of Object.keys(saveData.quiz)) {
                const levels = saveData.quiz[lang];
                if (levels) {
                    for (const key of Object.keys(levels)) {
                        totalScore += levels[key]?.score || 0;
                    }
                }
            }
        }

        // Sum all coding task scores
        if (saveData.codingTasks) {
            for (const lang of Object.keys(saveData.codingTasks)) {
                const tasks = saveData.codingTasks[lang];
                if (tasks) {
                    for (const key of Object.keys(tasks)) {
                        totalScore += tasks[key]?.score || 0;
                    }
                }
            }
        }

        // Assign to HUD
        this.playerScore = totalScore;

        console.log(`✅ [HUD] Total score for slot ${this.saveSlot}:`, this.playerScore);

    } catch (err) {
        console.error("Failed to load total score:", err);
        this.playerScore = 0;
    }
}

}
