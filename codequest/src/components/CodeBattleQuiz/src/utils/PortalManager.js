/**
 * @typedef {import('phaser')} Phaser
 */

// --- Setup portals and the ENTER popup text ---
export function setupPortals(scene, map, player) {
  const portals = map.getObjectLayer("Portal")?.objects || [];
  scene.portalZones = scene.physics.add.staticGroup();

  portals.forEach((obj) => {
    const zone = scene.add
      .zone(obj.x, obj.y, obj.width, obj.height)
      .setOrigin(0, 0);
    scene.physics.add.existing(zone, true);

    zone.name = obj.name || "Portal";
    zone.properties = {};

    // Copy custom properties from Tiled
    (obj.properties || []).forEach((p) => {
      zone.properties[p.name] = p.value;
    });

    scene.portalZones.add(zone);
  });

  // Create popup text once, hidden by default
  scene.enterText = scene.add
    .text(0, 0, "Press ENTER", {
      fontSize: "16px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: { x: 6, y: 2 },
    })
    .setOrigin(0.5, 1)
    .setVisible(false);

  scene.activePortal = null;

  // Overlap detection sets the active portal
  scene.physics.add.overlap(player, scene.portalZones, (_, portal) => {
    scene.activePortal = portal;
    scene.enterText.setVisible(true);
  });
}

// --- Handle portal update per frame ---
export function handlePortalUpdate(scene, player, keys) {
  if (!player || !scene.enterText || !scene.portalZones) return; // safety check

  if (scene.activePortal) {
    // Position popup above player
    scene.enterText.setPosition(player.x, player.y - (player.height ?? 0) - 5);

    // ENTER pressed → start transition
    if (scene.input.keyboard.checkDown(keys.ENTER, 250)) {
      const target = scene.activePortal.properties?.targetScene || "HomeScene";
      const spawnX = scene.activePortal.properties?.spawnX ?? player.x;
      const spawnY = scene.activePortal.properties?.spawnY ?? player.y;

      runPortalTransition(scene, target, player, {
        x: spawnX,
        y: spawnY,
        fromPortal: true,
        loadSlot: scene.currentSlot,
        newGame: false,
      });
    }
  } else {
    scene.enterText.setVisible(false);
  }

  // Reset if player leaves all portals
  if (scene.portalZones && !scene.physics.overlap(player, scene.portalZones)) {
    scene.activePortal = null;
  }
}


// --- Fade-out → transition ---
function runPortalTransition(scene, targetScene, player, data) {
  const cam = scene.cameras.main;

  const blocker = scene.add.graphics();
  blocker.fillStyle(0x000000, 1);
  blocker.fillRect(0, 0, cam.width, cam.height);

  const shape = scene.make.graphics();
  const maxR = Math.sqrt(cam.width ** 2 + cam.height ** 2);

  shape.fillCircle(player.x, player.y - player.height / 2, maxR);

  const mask = shape.createGeometryMask();
  mask.invertAlpha = true;
  blocker.setMask(mask);

  const tweenObj = { r: maxR };

  scene.tweens.add({
    targets: tweenObj,
    r: 0,
    duration: 2000,
    ease: "Cubic.easeInOut",
    onUpdate: () => {
      const centerX = player.x;
      const centerY = player.y - player.height / 2;

      shape.clear();
      shape.fillCircle(centerX, centerY, tweenObj.r);
    },
    onComplete: () => {
      // Pass data including portal info
      scene.scene.start(targetScene, data);

      scene.scene.get(targetScene).events.once("create", () => {
        if (data?.fromPortal) {
          fadeInFromPortal(scene.scene.get(targetScene), data);
        }
      });
    },
  });
}

// --- Fade-in from portal ---
export function fadeInFromPortal(scene, data) {
  const cam = scene.cameras.main;

  // Use portal destination if provided, fallback to current player
  const spawnX = data?.x ?? (scene.player ? scene.player.x : cam.centerX);
  const spawnY = data?.y ?? (scene.player ? scene.player.y - (scene.player.height / 2) : cam.centerY);

  if (scene.player) {
    scene.player.x = spawnX;
    scene.player.y = spawnY;
  }

  const blocker = scene.add.graphics();
  blocker.fillStyle(0x000000, 1);
  blocker.fillRect(0, 0, cam.width, cam.height);

  const shape = scene.make.graphics();
  const maxR = Math.sqrt(cam.width ** 2 + cam.height ** 2);

  shape.fillCircle(spawnX, spawnY, 0);

  const mask = shape.createGeometryMask();
  mask.invertAlpha = true;
  blocker.setMask(mask);

  const tweenObj = { r: 0 };

  scene.tweens.add({
    targets: tweenObj,
    r: maxR,
    duration: 2000,
    ease: "Cubic.easeInOut",
    onUpdate: () => {
      shape.clear();
      shape.fillCircle(spawnX, spawnY, tweenObj.r);
    },
    onComplete: () => {
      blocker.destroy();
      shape.destroy();
    },
  });
}
