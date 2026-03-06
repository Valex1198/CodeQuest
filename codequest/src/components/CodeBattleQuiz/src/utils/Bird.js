import Phaser from "phaser";

export class Bird extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "bird");
        
        // Add shadow before the bird so it's behind/underneath
        this.shadow = scene.add.ellipse(x, y, 12, 6, 0x000000, 0.3);
        this.groundY = y; // Save ground level

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(1.5);
        this.setOrigin(0.5, 1); // Anchor at feet
        this.body.setAllowGravity(false);
        
        // Randomly pick a color tint
        const colors = [0xffffff, 0xffd700, 0x87ceeb, 0xff69b4, 0x90ee90];
        this.setTint(Phaser.Utils.Array.GetRandom(colors));

        this.isFlyingAway = false;
        this.startBehaviorLoop();
    }

    static preload(scene, png, json) {
        scene.load.atlas("bird", png, json);
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("bird_idle")) {
            scene.anims.create({
                key: "bird_idle",
                frames: scene.anims.generateFrameNames("bird", { prefix: "BirdSprite ", suffix: ".png", start: 0, end: 1 }),
                frameRate: 3,
                repeat: -1
            });
        }
        if (!scene.anims.exists("bird_flying")) {
            scene.anims.create({
                key: "bird_flying",
                frames: scene.anims.generateFrameNames("bird", { prefix: "BirdSprite ", suffix: ".png", start: 2, end: 9 }),
                frameRate: 6,
                repeat: -1
            });
        }
        if (!scene.anims.exists("bird_pecking")) {
            scene.anims.create({
                key: "bird_pecking",
                frames: scene.anims.generateFrameNames("bird", { prefix: "BirdSprite ", suffix: ".png", start: 10, end: 12 }),
                frameRate: 3,
                repeat: -1
            });
        }
    }

    startBehaviorLoop() {
        if (this.isFlyingAway) return;

        const rand = Math.random();
        
        if (rand < 0.1) {
            this.wander();
        } else if (rand < 0.5) {
            this.play("bird_pecking");
        } else {
            this.play("bird_idle");
            if (Math.random() < 0.5) this.setFlipX(!this.flipX);
        }

        this.scene.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
            this.startBehaviorLoop();
        }, [], this);
    }

    wander() {
        if (this.isFlyingAway) return;
        
        const distance = Phaser.Math.Between(30, 60);
        const direction = Math.random() < 0.5 ? -1 : 1; 
        const targetX = this.x + (distance * direction);
        
        if (targetX < 50 || targetX > 910) return;

        this.setFlipX(direction === 1);
        this.play("bird_flying");

        // Move Bird and Shadow X together
        this.scene.tweens.add({
            targets: [this, this.shadow],
            x: targetX,
            duration: 600,
            ease: "Linear",
            onComplete: () => {
                if (!this.isFlyingAway) {
                    this.play("bird_idle");
                    if (Math.random() < 0.5) this.setFlipX(!this.flipX);
                }
            }
        });

        // Bird Hop (Y)
        this.scene.tweens.add({
            targets: this,
            y: this.y - 15,
            duration: 300,
            yoyo: true,
            ease: "Quad.easeOut"
        });

        // Shadow Pulse (Shrink when bird is high)
        this.scene.tweens.add({
            targets: this.shadow,
            scaleX: 0.6,
            scaleY: 0.6,
            alpha: 0.1,
            duration: 300,
            yoyo: true,
            ease: "Quad.easeOut"
        });
    }

    update(player, taxi) {
        if (this.isFlyingAway) return;

        // Keep shadow pinned to ground level
        if (this.shadow) {
            this.shadow.x = this.x;
            this.shadow.y = this.groundY;
        }

        // Check distance to player
        if (player) {
            const distToPlayer = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
            if (distToPlayer < 60) {
                this.flyAway();
                return;
            }
        }

        // Check distance to taxi
        if (taxi && taxi.visible) {
            const distToTaxi = Phaser.Math.Distance.Between(taxi.x, taxi.y, this.x, this.y);
            if (distToTaxi < 80) { // Taxis are bigger, so larger scare radius
                this.flyAway();
            }
        }
    }

    flyAway() {
        this.isFlyingAway = true;
        this.play("bird_flying");
        
        const flyDir = Math.random() < 0.5 ? -1 : 1;
        const targetX = this.x + (Phaser.Math.Between(100, 300) * flyDir);
        const targetY = this.y - 400;

        this.setFlipX(flyDir === 1);

        // Fly Bird
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            alpha: 0,
            duration: 5000,
            ease: "Power1",
            onComplete: () => {
                if (this.shadow) this.shadow.destroy();
                this.destroy();
            }
        });

        // Fade/Shrink Shadow
        this.scene.tweens.add({
            targets: this.shadow,
            x: targetX,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 3000,
            ease: "Power1"
        });
    }
}
