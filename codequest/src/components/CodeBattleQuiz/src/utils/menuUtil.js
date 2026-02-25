// --- menuUtils.js ---

// Create a single image page for carousel
export function createImagePage(scene, zone, key) {
  const page = scene.add.container(0, 0);
  const bg = scene.add.rectangle(0, 0, zone.width, zone.height, 0x111111, 0.2).setOrigin(0);
  const img = scene.add.image(zone.width / 2, zone.height / 2 - 20, key).setOrigin(0.5);

  const scale = Math.min((zone.width * 0.5) / img.width, (zone.height * 0.5) / img.height);
  img.setScale(scale);

  page.add([bg, img]);
  return page;
}

// Animate slide between pages
export function animateSlide(scene, zone, wrapper, oldPage, key, direction, onComplete, onEnd, onStart) {
  wrapper.x = zone.x;
  wrapper.y = zone.y;
  const newPage = createImagePage(scene, zone, key);
  wrapper.add(newPage);
  const offset = direction === "right" ? zone.width : -zone.width;
  newPage.x = offset;

  onStart();

  scene.tweens.add({ targets: oldPage, x: -offset, duration: 400, ease: "Sine.easeInOut" });
  scene.tweens.add({
    targets: newPage,
    x: 0,
    duration: 400,
    ease: "Sine.easeInOut",
    onComplete: () => {
      oldPage.destroy();
      onEnd();
      onComplete(newPage);
    },
  });
}

// Arrow idle floating + frame toggle
export function arrowIdleAnimation(arrow) {
  arrow.scene.tweens.add({
    targets: arrow,
    duration: 400,
    repeat: -1,
    yoyo: true,
    onYoyo: () => arrow.setFrame((arrow.frame.name + 1) % 2),
    onRepeat: () => arrow.setFrame((arrow.frame.name + 1) % 2),
  });
  arrow.scene.tweens.add({
    targets: arrow,
    y: arrow.y - 5,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}

// Arrow click animation
export function arrowClickAnimation(arrow) {
  arrow.scene.tweens.add({
    targets: arrow,
    scaleX: 1.8,
    scaleY: 1.8,
    duration: 100,
    yoyo: true,
    ease: "Power1",
  });
}

// Floating + pulse effect for language image
export function applyImageEffects(scene, img, isSelected) {
  scene.tweens.killTweensOf(img);
  img.setScale(img.scale);

  scene.tweens.add({
    targets: img,
    y: img.y - 10,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  if (isSelected) {
    scene.tweens.add({
      targets: img,
      scale: img.scale * 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}

// Get object by name from Tiled map
export function getObjectByName(map, name) {
  for (const layer of map.objects) {
    if (!layer.objects) continue;
    for (const obj of layer.objects) {
      if (obj.name === name) return obj;
    }
  }
  return null;
}

// Create interactive zone with overlay for hover/click feedback
export function createInteractiveZone(scene, obj, onClickCallback) {
  const brightPiece = scene.add
    .image(obj.x + obj.width / 2, obj.y + obj.height / 2, "MenuBG")
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(5);

  const maskGraphics = scene.make.graphics();
  maskGraphics.fillStyle(0xffffff);
  maskGraphics.fillRect(obj.x, obj.y, obj.width, obj.height);
  brightPiece.setMask(maskGraphics.createGeometryMask());

  const zone = scene.add.zone(obj.x, obj.y, obj.width, obj.height)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true });

  zone.on("pointerover", () => {
    scene.tweens.add({ targets: brightPiece, alpha: 0.3, scale: 1.02, duration: 120 });
  });

  zone.on("pointerout", () => {
    scene.tweens.add({ targets: brightPiece, alpha: 0, scale: 1, duration: 120 });
  });

  zone.on("pointerdown", () => {
    scene.tweens.add({ targets: brightPiece, scale: 0.97, duration: 80 });
    onClickCallback();
  });

  zone.on("pointerup", () => {
    scene.tweens.add({ targets: brightPiece, scale: 1.02, duration: 100 });
  });

  return zone;
}

// Create avatar & username display
export function createAvatar(scene, avatarZone, nameZone, user) {
  let avatarPath = user.avatar || "/avatars/default.png";
  if (avatarPath.startsWith("/")) avatarPath = avatarPath.slice(1);

  scene.load.image("userAvatar", avatarPath);
  scene.load.once("complete", () => {
    const avatar = scene.add.image(avatarZone.x, avatarZone.y, "userAvatar").setOrigin(0,0);
    avatar.setDisplaySize(avatarZone.width, avatarZone.height);
    scene.add.text(
      nameZone.x + nameZone.width / 2,
      nameZone.y + nameZone.height / 2,
      user.username,
      { fontFamily: "Arial", fontSize: "24px", color: "#fff", fontStyle: "bold" }
    ).setOrigin(0.5);
  });
  scene.load.start();
}

// Create full language carousel + arrows + buttons
export function createLanguageCarousel(scene, statBoxZone, map, images, languageNames, startCallback) {
  const wrapper = scene.add.container(statBoxZone.x, statBoxZone.y);

  const maskGraphics = scene.add.graphics();
  maskGraphics.fillStyle(0xffffff, 1);
  maskGraphics.fillRect(statBoxZone.x, statBoxZone.y, statBoxZone.width, statBoxZone.height);
  maskGraphics.setVisible(false);
  wrapper.setMask(maskGraphics.createGeometryMask());

  let isAnimating = false;
  let currentIndex = 0;
  let currentPage = createImagePage(scene, statBoxZone, images[currentIndex]);
  wrapper.add(currentPage);
  applyImageEffects(scene, currentPage.list[1], true);

  const langText = scene.add.text(
    statBoxZone.x + statBoxZone.width / 2,
    statBoxZone.y + statBoxZone.height - 30,
    `Language: ${languageNames[currentIndex]}`,
    { fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#fff', align: 'center' }
  ).setOrigin(0.5);

  // Arrows
  const arrowOffsetY = statBoxZone.height / 2;
  const arrowPadding = 20;
  const leftArrow = scene.add.sprite(statBoxZone.x + arrowPadding, statBoxZone.y + arrowOffsetY, "arrow", 1)
    .setInteractive({ useHandCursor: true }).setScale(2);
  const rightArrow = scene.add.sprite(statBoxZone.x + statBoxZone.width - arrowPadding, statBoxZone.y + arrowOffsetY, "arrow", 0)
    .setInteractive({ useHandCursor: true }).setScale(2);

  arrowIdleAnimation(leftArrow);
  arrowIdleAnimation(rightArrow);

  leftArrow.on("pointerdown", () => {
    arrowClickAnimation(leftArrow);
    if (isAnimating || currentIndex <= 0) return;
    currentIndex--;
    langText.setText(`Language: ${languageNames[currentIndex]}`);
    animateSlide(scene, statBoxZone, wrapper, currentPage, images[currentIndex], "left",
      (newPage) => { currentPage = newPage; applyImageEffects(scene, currentPage.list[1], true); },
      () => isAnimating = false,
      () => isAnimating = true
    );
  });

  rightArrow.on("pointerdown", () => {
    arrowClickAnimation(rightArrow);
    if (isAnimating || currentIndex >= images.length - 1) return;
    currentIndex++;
    langText.setText(`Language: ${languageNames[currentIndex]}`);
    animateSlide(scene, statBoxZone, wrapper, currentPage, images[currentIndex], "right",
      (newPage) => { currentPage = newPage; applyImageEffects(scene, currentPage.list[1], true); },
      () => isAnimating = false,
      () => isAnimating = true
    );
  });

  // --- Buttons ---
  const startObj = getObjectByName(map, "startBtn");
    if (startObj) createInteractiveZone(scene, startObj, () => {
      // Start a new game → mode: "new"
      scene.scene.start("SaveSlotsScene", {
        selectedLanguage: languageNames[currentIndex],
        mode: "new",
        defaultScene: "HomeScene" // change if your starting scene is different
      });
    });

  const loadObj = getObjectByName(map, "loadBtn");
    if (loadObj) createInteractiveZone(scene, loadObj, () => {
      // Load existing game → mode: "load"
      scene.scene.start("SaveSlotsScene", {
        selectedLanguage: languageNames[currentIndex],
        mode: "load",
        defaultScene: "HomeScene"
      });
    });

  const quitObj = getObjectByName(map, "quitBtn");
    if (quitObj) createInteractiveZone(scene, quitObj, () => {
      window.dispatchEvent(new CustomEvent("phaserQuit"));
    });

}
