// src/utils/completeTaskUtil.js

/**
 * Display a "Task Level # Completed" overlay
 * @param {Phaser.Scene} scene - The scene to add the overlay to
 * @param {number} taskLevel - The completed task level
 * @param {number} duration - Duration in ms before fading out (default: 2000)
 */
export const showTaskCompletionOverlay = (scene, taskLevel, duration = 7000, fadeInDuration = 2000) => {
  const cam = scene.cameras.main;
  const camCenterX = cam.scrollX + cam.width / 2;
  const camCenterY = cam.scrollY + cam.height / 2;

  // Semi-transparent rectangle (start invisible)
  const bg = scene.add
    .rectangle(camCenterX, camCenterY, 400, 100, 0x000000, 0.7)
    .setOrigin(0.5)
    .setDepth(1000)
    .setStrokeStyle(2, 0xffffff)
    .setAlpha(0);

  // Task completed text (start invisible)
  const text = scene.add
    .text(camCenterX, camCenterY, `Task Level ${taskLevel} Completed!`, {
      fontFamily: '"Press Start 2P"',
      fontSize: "16px",
      color: "#00ff00",
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(1001)
    .setAlpha(0);

  // Fade in
  scene.tweens.add({
    targets: [bg, text],
    alpha: 1,
    duration: fadeInDuration,
    ease: "Power1",
    onComplete: () => {
      // After fade-in, fade out
      scene.tweens.add({
        targets: [bg, text],
        alpha: 0,
        duration: duration,
        ease: "Power1",
        onComplete: () => {
          bg.destroy();
          text.destroy();
        },
      });
    },
  });
};
