export function createMenuButton(scene, emoji = "🏠", options = {}) {
  if (!scene || !scene.add) {
    console.warn("createMenuButton: Scene or scene.add is null. Returning null.");
    return null;
  }
  const {
    x = 755,
    y = 405,
    width = 60,
    height = 60,
    fontSize = 32
  } = options;

  const cam = scene.cameras.main;

  // Background like Song UI
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.5);
  bg.fillRoundedRect(0, 0, width, height, 10);

  // Text emoji
  const text = scene.add.text(width / 2, height / 2, emoji, {
    font: `${fontSize}px Arial`,
    color: "#ffffff"
  }).setOrigin(0.5);

  // Container pinned to viewport
  const container = scene.add.container(x, y, [bg, text]);
  container.setDepth(1000);
  container.setScrollFactor(0);
  container.setScale(1 / cam.zoom);

  // --- Make the ENTIRE container interactive ---
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on("pointerdown", () => {
    if (scene.scene.isActive("HudOverlay")) {
        scene.scene.stop("HudOverlay");
    }
    scene.scene.start("MenuScene"); // Now reliably triggers
  });

  // Hover effect (still scales the text only)
  container.on("pointerover", () => text.setScale(1.2));
  container.on("pointerout", () => text.setScale(1));

  return container;
}


// Single message box (like Song UI)
export function createMessageBox(scene, text = "Tip", options = {}) {
  const {
    x = 200,
    y = 400,
    width = 300,
    height = 80,
    fontSize = 18,
    displayTime = 4000
  } = options;

  const cam = scene.cameras.main;

  // --- Safe scale: only if cam exists ---
  const scale = cam ? 1 / cam.zoom : 1;

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.7);
  bg.fillRoundedRect(0, 0, width, height, 10);

  // Text
  const label = scene.add.text(width / 2, height / 2, text, {
    font: `${fontSize}px Arial`,
    color: "#ffffff",
    wordWrap: { width: width - 20 }
  }).setOrigin(0.5);

  // Container pinned to camera
  const container = scene.add.container(x, y, [bg, label]);
  container.setDepth(1000);
  container.setScrollFactor(0);
  container.setScale(scale);

  // Fade-in animation
  container.alpha = 0;
  const fadeInTween = scene.tweens.add({
    targets: container,
    alpha: 1,
    duration: 400,
    ease: "Power1"
  });

  // Auto-hide after displayTime
  const timer = scene.time.delayedCall(displayTime, () => {
    if (!scene || !container) return;
    scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 400,
      ease: "Power1",
      onComplete: () => container.destroy()
    });
  });

  // Click to close immediately
  container.setSize(width, height);
  container.setInteractive();
  container.on("pointerdown", () => {
    if (timer) timer.remove();
    if (fadeInTween) fadeInTween.stop();
    container.destroy();
  });

  // Cleanup if scene shuts down
  scene.events.once("shutdown", () => {
    if (timer) timer.remove();
    if (fadeInTween) fadeInTween.stop();
    if (container) container.destroy();
  });

  return container;
}


export function showTutorialSequence(scene, tips = [], options = {}) {
  let index = 0;
  let activeBox = null;
  let isSceneAlive = true;

  // When the scene shuts down, prevent further tips
  scene.events.once("shutdown", () => {
    isSceneAlive = false;
    if (activeBox) activeBox.destroy();
  });

  const showNextTip = () => {
    if (!isSceneAlive) return; // scene is gone
    if (index >= tips.length) return;

    const tip = tips[index];
    index++;

    activeBox = createMessageBox(scene, tip.text, {
      x: tip.x || options.x,
      y: tip.y || options.y,
      width: tip.width || options.width,
      height: tip.height || options.height,
      fontSize: tip.fontSize || options.fontSize,
      displayTime: tip.displayTime || options.displayTime
    });

    // Show next tip when this one disappears
    activeBox.on("destroy", () => {
      activeBox = null;
      showNextTip();
    });
  };

  showNextTip();
}