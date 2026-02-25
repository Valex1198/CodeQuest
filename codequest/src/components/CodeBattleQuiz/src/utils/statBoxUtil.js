// --- utils/statBoxUtil.js ---
export async function createStatBox(scene, directusUrl, statBoxZone) {
  // 1️⃣ Fetch data directly using fetch()
  const [cplus, python, java] = await Promise.all([
    getStats(`${directusUrl}/items/cplus_quizgame`),
    getStats(`${directusUrl}/items/python_quizgame`),
    getStats(`${directusUrl}/items/java_quizgame`),
  ]);

  // 2️⃣ Prepare stat data
  const stats = [
    { title: "C++ Quiz Game", ...formatStats(cplus) },
    { title: "Python Quiz Game", ...formatStats(python) },
    { title: "Java Quiz Game", ...formatStats(java) },
  ];

  // 🧱 Create wrapper anchored at the zone position (acts as container for pages)
  const wrapper = scene.add.container(statBoxZone.x, statBoxZone.y);

  // 🎭 Create an exact graphics rectangle at the world coordinates of the zone
  // This ensures the mask size/position matches the zone exactly.
  const maskGraphics = scene.add.graphics();
  maskGraphics.fillStyle(0xffffff, 1);
  maskGraphics.fillRect(statBoxZone.x, statBoxZone.y, statBoxZone.width, statBoxZone.height);
  maskGraphics.setVisible(false); // hide the visible graphics

  // Create a geometry mask from that graphics object and apply to wrapper
  const mask = maskGraphics.createGeometryMask();
  wrapper.setMask(mask);

  // Animation lock to prevent overlapping transitions
  let isAnimating = false;

  // 🏁 Add first page (local coordinates inside wrapper)
  let currentIndex = 0;
  let currentPage = createStatPage(scene, statBoxZone, stats[currentIndex]);
  wrapper.add(currentPage);

  // ⬅️➡️ Arrow navigation (blocked while animating)
  scene.input.keyboard.on("keydown-RIGHT", () => {
    if (isAnimating) return;
    if (currentIndex < stats.length - 1) {
      currentIndex++;
      slideToPage(scene, statBoxZone, wrapper, currentPage, stats[currentIndex], "right", (newPage) => {
        currentPage = newPage;
      }, () => { isAnimating = false; }, () => { isAnimating = true; });
    }
  });

  scene.input.keyboard.on("keydown-LEFT", () => {
    if (isAnimating) return;
    if (currentIndex > 0) {
      currentIndex--;
      slideToPage(scene, statBoxZone, wrapper, currentPage, stats[currentIndex], "left", (newPage) => {
        currentPage = newPage;
      }, () => { isAnimating = false; }, () => { isAnimating = true; });
    }
  });
}

// 🔧 Helper: Fetch and return first record
async function getStats(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data?.[0] || {};
  } catch (err) {
    console.error(`Failed to fetch stats from ${url}`, err);
    return {};
  }
}

// 🔧 Helper: Format level stats
function formatStats(row) {
  if (!row) return {};
  return {
    level1: row.level1score ?? "N/A",
    level2: row.level2score ?? "N/A",
    level3: row.level3score ?? "N/A",
    level4: row.level4score ?? "N/A",
    level5: row.level5score ?? "N/A",
  };
}

// 🧱 Create one stat page
function createStatPage(scene, zone, data) {
  // Local coordinates inside wrapper
  const page = scene.add.container(0, 0);

  // background rectangle sized to the zone (ensures page visuals exactly match the mask)
  const bg = scene.add.rectangle(0, 0, zone.width, zone.height, 0x000000, 0.6).setOrigin(0);

  const title = scene.add.text(20, 15, data.title, {
    fontSize: "20px",
    color: "#ffffff",
  });

  const stats = Object.entries(data)
    .filter(([key]) => key.startsWith("level"))
    .map(([key, value], i) =>
      scene.add.text(20, 50 + i * 30, `${key.toUpperCase()}: ${value}`, {
        fontSize: "16px",
        color: "#ffffff",
      })
    );

  page.add([bg, title, ...stats]);
  return page;
}

// 🎞️ Slide transition animation
// onStart(), onEnd() optional callbacks to control "isAnimating" outside
function slideToPage(scene, zone, wrapper, oldPage, data, direction, onComplete, onEnd, onStart) {
  // defensive: ensure wrapper anchored correctly (shouldn't be needed normally)
  wrapper.x = zone.x;
  wrapper.y = zone.y;

  // Create new page (positioned at 0,0 inside wrapper)
  const newPage = createStatPage(scene, zone, data);
  wrapper.add(newPage);

  // Offset newPage so it starts just outside wrapper's visible area (local coords)
  const offset = direction === "right" ? zone.width : -zone.width;
  newPage.x = offset;
  newPage.y = 0;

  // call onStart if provided (e.g., to set isAnimating = true)
  if (typeof onStart === "function") onStart();

  // Animate both pages inside wrapper
  scene.tweens.add({
    targets: oldPage,
    x: -offset,
    duration: 400,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: newPage,
    x: 0,
    duration: 400,
    ease: "Sine.easeInOut",
    onComplete: () => {
      // destroy old page cleanly
      try {
        oldPage.destroy();
      } catch (err) {
        // ignore if already destroyed
      }
      // call onEnd if provided (e.g., to set isAnimating = false)
      if (typeof onEnd === "function") onEnd();
      onComplete(newPage);
    },
  });
}
