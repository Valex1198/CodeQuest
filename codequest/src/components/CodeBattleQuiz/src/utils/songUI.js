import SongUI from "../assets/songUI.png";

export function preloadSongUI(scene) {
  scene.load.image("songUI", SongUI);
}

export function createSongUI(scene, text = "Now Playing: Song", options = {}) {
  const { useImage = true, imageKey = "songUI", x = 165, y = 405, displayTime = 3000 } = options; // displayTime in ms

  let width = 250;
  let height = 60;

  // --- Background ---
  let bg;
  if (useImage && scene.textures.exists(imageKey)) {
    bg = scene.add.image(0, 0, imageKey).setOrigin(0, 0);
    width = bg.width;
    height = bg.height;
  } else {
    bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, width, height);
  }

  // --- Text ---
  const label = scene.add.text(width / 2, height / 2, text, {
    fontSize: "18px",
    fontFamily: "Arial",
    color: "#ffffff"
  }).setOrigin(0.5);

  const cam = scene.cameras.main;

  // --- Position: manual x/y ---
  const container = scene.add.container(x, y, [bg, label]);
  container.setDepth(1000);
  container.setScrollFactor(0);      // fixed to camera
  container.setScale(1 / cam.zoom);  // appear like 1x zoom

  // --- Pop-in animation ---
  container.alpha = 0;
  container.y += 30;
  scene.tweens.add({
    targets: container,
    alpha: 1,
    y: container.y - 30,
    ease: "Back.Out",
    duration: 3200,
    onComplete: () => {
      // --- Fade-out after displayTime ---
      scene.time.delayedCall(displayTime, () => {
        scene.tweens.add({
          targets: container,
          alpha: 0,
          duration: 600,
          ease: "Power1",
          onComplete: () => {
            container.destroy(); // remove from scene
          }
        });
      });
    }
  });

  return {
    bg,
    label,
    container,
    updateText(newText) {
      label.setText(newText);
    }
  };
}
