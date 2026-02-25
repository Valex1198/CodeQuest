import SkyImg from "../assets/quizgameassets/Sky.png";
import ForestImg from "../assets/quizgameassets/Forest.png";
import ForegroundImg from "../assets/quizgameassets/Foreground.png";
import CloudImg from "../assets/quizgameassets/Cloud.png";

export class Landscape {
  constructor(scene, zone) {
    this.scene = scene;
    const { x, y, width, height } = zone;
    this.zone = { x, y, width, height };

    this.speeds = { forest: 0.3, foreground: 0.6, cloud: 0.1 };
    this.isMoving = false;
    this.moveDirection = 0;
    this.moveMultiplier = 1;
    this.moveTimer = null;

    // Layers
    this.sky = scene.add.image(x, y, "Sky")
      .setOrigin(0, 0)
      .setDisplaySize(width, height)
      .setDepth(1);

    // TileSprites for seamless looping
    this.forest = scene.add.tileSprite(x, y, width, height, "Forest")
      .setOrigin(0, 0)
      .setDepth(2);

    this.foreground = scene.add.tileSprite(x, y, width, height, "Foreground")
      .setOrigin(0, 0)
      .setDepth(3);

    this.cloud = scene.add.tileSprite(x, y, width, height, "Cloud")
      .setOrigin(0, 0)
      .setDepth(4);
  }

  static preload(scene) {
    scene.load.image("Sky", SkyImg);
    scene.load.image("Forest", ForestImg);
    scene.load.image("Foreground", ForegroundImg);
    scene.load.image("Cloud", CloudImg);
  }

  update() {
    // Cloud always moves
    this.cloud.tilePositionX += this.speeds.cloud;

    // Move forest and foreground only if isMoving
    if (this.isMoving) {
      this.forest.tilePositionX += this.speeds.forest * this.moveMultiplier * this.moveDirection;
      this.foreground.tilePositionX += this.speeds.foreground * this.moveMultiplier * this.moveDirection;
    }
  }

  /**
   * Temporarily move forest and foreground layers.
   * @param {number} direction - 1 = left (player moves right), -1 = right (player moves left)
   * @param {number} speedMultiplier - speed multiplier for effect
   * @param {number} duration - milliseconds to move
   */
  moveTemporarily(direction = 1, speedMultiplier = 3, duration = 1500) {
    if (this.isMoving) return;

    this.isMoving = true;
    this.moveDirection = direction;
    this.moveMultiplier = speedMultiplier;

    if (this.moveTimer) this.moveTimer.remove(false);

    this.moveTimer = this.scene.time.delayedCall(duration, () => {
      this.isMoving = false;
      this.moveDirection = 0;
      this.moveMultiplier = 1;
    });
  }
}
