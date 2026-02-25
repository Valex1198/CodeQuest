/**
 * @typedef {import('phaser')} Phaser
 */

// --- Setup text zones from Tiled ---
export function setupTextZones(scene, map, player) {
  const textZones = map.getObjectLayer("TextZones")?.objects || [];
  scene.textZones = scene.physics.add.staticGroup();

  textZones.forEach((obj) => {
    const zone = scene.add.zone(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
    scene.physics.add.existing(zone, true);

    // Grab custom properties from Tiled (default fallback)
    zone.message = obj.properties?.find(p => p.name === "message")?.value || "No message";
    zone.duration = obj.properties?.find(p => p.name === "duration")?.value || 2000; // ms

    scene.textZones.add(zone);
  });

  // Setup overlap
  scene.physics.add.overlap(player, scene.textZones, (playerObj, zone) => {
    handleTextZoneTrigger(scene, zone);
  });
}

// --- Handle showing messages ---
export function handleTextZoneTrigger(scene, zone) {
  if (scene.currentText) {
    scene.currentText.destroy();
    scene.currentText = null;
  }

  scene.currentText = scene.add.text(
    scene.player.x, scene.player.y - 50,
    zone.message,
    {
      fontSize: "16px",
      fill: "#fff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 4, y: 2 }
    }
  ).setOrigin(0.5);

  // Fade out after duration
  scene.time.delayedCall(zone.duration, () => {
    if (scene.currentText) {
      const textObj = scene.currentText; // store local reference

      scene.tweens.add({
        targets: textObj,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (textObj && textObj.destroy) {
            textObj.destroy();
          }
          if (scene.currentText === textObj) {
            scene.currentText = null;
          }
        }
      });
    }
  });
}
