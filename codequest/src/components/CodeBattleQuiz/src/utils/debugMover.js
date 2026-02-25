// utils/debugMover.js
import Phaser from "phaser";

/**
 * Attaches arrow key controls to move a game object around for debugging layout.
 * - Arrow keys move object
 * - Hold SHIFT for faster movement
 * - Press S to log current position
 *
 * @param {Phaser.Scene} scene - The scene
 * @param {Phaser.GameObjects.GameObject} target - The object to move
 * @param {Object} options - { speed, fastMultiplier }
 */
export function attachDebugMover(scene, target, options = {}) {
  const baseSpeed = options.speed ?? 1;           // default slow = 1px
  const fastMultiplier = options.fastMultiplier ?? 5; // Shift = 5x

  const cursors = scene.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.UP,
    down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    left: Phaser.Input.Keyboard.KeyCodes.LEFT,
    right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    s: Phaser.Input.Keyboard.KeyCodes.S,
  });

  scene.events.on("update", () => {
    if (!target) return;

    let step = cursors.shift.isDown ? baseSpeed * fastMultiplier : baseSpeed;

    if (cursors.left.isDown) target.x -= step;
    if (cursors.right.isDown) target.x += step;
    if (cursors.up.isDown) target.y -= step;
    if (cursors.down.isDown) target.y += step;

    if (Phaser.Input.Keyboard.JustDown(cursors.s)) {
      console.log(
        `[DEBUG MOVER] ${target.texture?.key || target.type} at x:${Math.round(target.x)}, y:${Math.round(target.y)}`
      );
    }
  });
}
