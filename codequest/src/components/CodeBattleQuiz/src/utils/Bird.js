import Phaser from "phaser";

export class Bird extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "bird");
        
        // Add shadow before the bird so it's behind/underneath
        this.shadow = scene.add.ellipse(x, y, 12, 6, 0x000000, 0.3);
        this.groundY = y; // Save ground level
        this.initialX = x; // Save initial x position
        this.initialY = y; // Save initial y position

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(1.5);
        this.setOrigin(0.5, 1); // Anchor at feet
        this.body.setAllowGravity(false);
        
        // Randomly pick a color tint
        const colors = [0xffffff, 0xffd700, 0x87ceeb, 0xff69b4, 0x90ee90];
        this.setTint(Phaser.Utils.Array.GetRandom(colors));

        this.isFlyingAway = false;
        this.isLanding = false;
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
        if (this.isFlyingAway || this.isLanding) return;

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
            if (this.active) this.startBehaviorLoop();
        }, [], this);
    }

    wander() {
        if (this.isFlyingAway || this.isLanding) return;
        
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
                if (!this.isFlyingAway && !this.isLanding && this.active) {
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
        if (!this.active || this.isFlyingAway) return;

        // Keep shadow pinned to ground level
        if (this.shadow) {
            this.shadow.x = this.x;
            this.shadow.y = this.groundY;
        }

        // Check distance to player
        if (player) {
            const distToPlayer = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
            if (distToPlayer < 70) {
                this.flyAway(player.x);
                return;
            }
        }

        // Check distance to taxi
        if (taxi && (taxi.visible || taxi.alpha > 0)) {
            const distToTaxi = Phaser.Math.Distance.Between(taxi.x, taxi.y, this.x, this.y);
            if (distToTaxi < 120) { // Taxis are big and loud, larger scare radius
                this.flyAway(taxi.x);
            }
        }
    }

    flyAway(scareX) {
        // Prevent multiple triggers if already flying
        if (this.isFlyingAway) return;

        this.isFlyingAway = true;
        this.isLanding = false; 
        this.play("bird_flying");

        // Stop any current walking/idle tweens
        this.scene.tweens.killTweensOf(this);
        if (this.shadow) this.scene.tweens.killTweensOf(this.shadow);
        
        // Determine flight direction (away from the player/taxi)
        let flyDir = Math.random() < 0.5 ? -1 : 1;
        if (scareX !== undefined) {
            flyDir = this.x > scareX ? 1 : -1;
        }

        // Much wider horizontal distance for a shallow angle
        const targetX = this.x + (Phaser.Math.Between(400, 600) * flyDir);
        const targetY = this.y - 450;
        const flightDuration = 5000;

        this.setFlipX(flyDir === 1);

        // Fly Bird - Slower takeoff
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: { value: targetY, ease: 'Quad.easeIn' },
            alpha: { value: 0, duration: flightDuration }, // Match flight duration
            duration: flightDuration,
            ease: "Linear",
            onComplete: () => {
                this.scene.time.delayedCall(Phaser.Math.Between(5000, 10000), () => {
                    if (this.scene) this.flyBack();
                });
            }
        });

        // Fade/Shrink Shadow - Matches horizontal movement perfectly
        if (this.shadow) {
            this.scene.tweens.add({
                targets: this.shadow,
                x: targetX,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: flightDuration, // Match bird's duration exactly
                ease: "Linear"
            });
        }
    }

    flyBack() {
        if (!this.scene) return;
        
        this.isLanding = true;
        this.isFlyingAway = true; 

        // Start even further away horizontally for a very shallow landing angle
        const startOffset = Phaser.Math.Between(500, 700) * (Math.random() < 0.5 ? -1 : 1);
        this.x = this.initialX + startOffset;
        this.y = this.initialY - 450;
        this.alpha = 0;
        this.play("bird_flying");
        
        // Face the target spot
        this.setFlipX(this.x < this.initialX);

        // Prepare shadow
        if (this.shadow) {
            this.shadow.alpha = 0;
            this.shadow.scaleX = 0;
            this.shadow.scaleY = 0;
            this.shadow.x = this.x; 
            this.shadow.y = this.groundY;
        }

        // Use a single duration variable for both bird and shadow to keep them in sync
        const flightDuration = Phaser.Math.Between(8000, 10000);

        // Fly back to initial spot
        this.scene.tweens.add({
            targets: this,
            x: this.initialX,
            y: { value: this.initialY, ease: 'Sine.easeInOut' }, 
            alpha: { value: 1, duration: flightDuration }, // Fade in over full flight
            duration: flightDuration,
            ease: "Linear", 
            onComplete: () => {
                if (this.active) {
                    this.isFlyingAway = false;
                    this.isLanding = false;
                    this.startBehaviorLoop();
                }
            }
        });

        // Shadow follows the bird's slow X movement
        if (this.shadow) {
            this.scene.tweens.add({
                targets: this.shadow,
                x: this.initialX,
                alpha: 0.3,
                scaleX: 1,
                scaleY: 1,
                duration: flightDuration, // Match bird's duration exactly
                ease: "Linear"
            });
        }
    }
}
