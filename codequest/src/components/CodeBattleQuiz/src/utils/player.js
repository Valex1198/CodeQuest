import playerIdle from "../assets/PlayerIdleA.png";
import playerWalk from "../assets/PlayerWalk.png";

// Preload player assets
export function preloadPlayer(scene) {
  scene.load.spritesheet("playerIdle", playerIdle, { frameWidth: 32, frameHeight: 48 });
  scene.load.spritesheet("playerWalk", playerWalk, { frameWidth: 32, frameHeight: 48 });
}

// Create player sprite
export function createPlayer(scene, x, y, texture = "playerIdle") {
  // Add shadow before player so it's underneath
  const shadow = scene.add.ellipse(x, y, 24, 12, 0x000000, 0.3);
  
  const player = scene.physics.add.sprite(x, y, texture);
  player.setOrigin(0.5, 1);
  player.body.setSize(32, 32);
  player.body.setOffset(0, 16);
  player.setCollideWorldBounds(true);
  player.lastDir = "down";
  player.shadow = shadow;

  // Animations
  if (!scene.anims.exists("walk_down")) {
    const directions = ["right", "up", "left", "down"];
    const walkBases = [0, 6, 12, 18];

    directions.forEach((dir, i) => {
      scene.anims.create({
        key: `walk_${dir}`,
        frames: scene.anims.generateFrameNumbers("playerWalk", { start: walkBases[i], end: walkBases[i] + 5 }),
        frameRate: 8,
        repeat: -1,
      });
    });

    directions.forEach((dir, i) => {
      scene.anims.create({
        key: `idle_${dir}`,
        frames: scene.anims.generateFrameNumbers("playerIdle", { start: i * 6, end: i * 6 + 5 }),
        frameRate: 4,
        repeat: -1,
      });
    });
  }

  // Keyboard controls
  // The second argument `false` disables `event.preventDefault()`, which allows
  // typing into DOM elements like the code editor.
  const keys = scene.input.keyboard.addKeys('W,A,S,D,ENTER', false);
  player.keys = keys;

  // Camera follow
  const cam = scene.cameras.main;
  cam.startFollow(player, true, 1.0, 1.0); // 1.0 Lerp for instant follow, true for roundPixels
  cam.setZoom(1.5);
  cam.centerOn(player.x, player.y);

  // Sync shadow AFTER physics step to prevent micro-stutter
  scene.events.on("postupdate", () => {
    if (player.active && player.shadow) {
        player.shadow.x = player.x;
        player.shadow.y = player.y;
        player.shadow.setVisible(player.visible);
    }
  });

  return player;
}

// Update movement and animation
export function updatePlayer(player, speed = 200, skipControls = false) {
  if (!player || !player.body) return; // ✅ ensure body exists

  if (skipControls) return;

  const keys = player.keys;
  if (!keys) return; // safety check

  let moving = false;

  if (keys.A.isDown) { player.setVelocityX(-speed); player.setVelocityY(0); player.lastDir = "left"; moving = true; }
  else if (keys.D.isDown) { player.setVelocityX(speed); player.setVelocityY(0); player.lastDir = "right"; moving = true; }
  else if (keys.W.isDown) { player.setVelocityY(-speed); player.setVelocityX(0); player.lastDir = "up"; moving = true; }
  else if (keys.S.isDown) { player.setVelocityY(speed); player.setVelocityX(0); player.lastDir = "down"; moving = true; }
  else { player.setVelocity(0); }

  if (moving) player.anims.play(`walk_${player.lastDir}`, true);
  else player.anims.play(`idle_${player.lastDir}`, true);
}
