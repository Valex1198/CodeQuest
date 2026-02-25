export function setupCollisions(scene, map, layerName = "Collisions") {
  const objects = map.getObjectLayer(layerName)?.objects || [];
  const collisionGroup = scene.physics.add.staticGroup();

  objects.forEach((obj) => {
    if (obj.polygon) {
      // --- Polygon collision ---
      // Phaser Arcade Physics can't handle polygons directly, so we create edges between points
      for (let i = 0; i < obj.polygon.length; i++) {
        const p1 = obj.polygon[i];
        const p2 = obj.polygon[(i + 1) % obj.polygon.length]; // wrap to first point

        const x = obj.x + Math.min(p1.x, p2.x);
        const y = obj.y + Math.min(p1.y, p2.y);
        const width = Math.abs(p2.x - p1.x) || 1;
        const height = Math.abs(p2.y - p1.y) || 1;

        const edge = scene.add.zone(x, y, width, height).setOrigin(0, 0);
        scene.physics.add.existing(edge, true);
        collisionGroup.add(edge);
      }
    } else {
      // --- Rectangle collision ---
      const zone = scene.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0, 0);
      scene.physics.add.existing(zone, true);
      collisionGroup.add(zone);
    }
  });

  return collisionGroup;
}
