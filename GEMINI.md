# CodeQuest: Technical Architecture & Standards

## Project Overview
CodeQuest is a Phaser 3-based RPG educational game designed to teach coding. It features a top-down world, persistent save system via a Directus backend, and an interactive dialogue/inventory system.

## Directory Structure
- `codequest/src/components/CodeBattleQuiz/src/`: The core game source.
  - `assets/`: Contains Tiled JSON maps, sprite sheets (texture atlases), and dialogue JSONs.
  - `scenes/`: Phaser Scene classes (e.g., `SchoolScene.js`, `HomeScene.js`).
  - `utils/`: Modular helper logic (e.g., `PortalManager.js`, `saveManager.js`).
  - `overlay/`: UI scenes that run on top of main scenes (e.g., `HudOverlay.js`, `SchoolIDOverlay.js`).
- `src/assets/dialogue/`: Global NPC dialogue definition files.

## Sprite Animations
- **NPC Orientation Sequence:**
  1. **Right** (frames 0-5)
  2. **Up** (frames 6-11)
  3. **Left** (frames 12-17)
  4. **Down** (frames 18-23)
- **Standard Frame Rate:** 6 FPS for walking/idle.
- **Animations:** Always check if an animation key exists via `this.anims.exists(key)` before creating it to avoid Phaser console warnings.

## Save & Progress System (Persistent State)
- **Architecture:** Save data is stored in a `game_saves` collection in Directus. It is synchronized with `localStorage` for offline fallback and session management.
- **`save_json` Structure:**
  - `flags`: Boolean event markers (e.g., `guard_gone: true`).
  - `inventory`: Array of item objects (e.g., `[{ name: "School ID", icon: "SchoolIDItem" }]`).
  - `taxi`: Object containing `{ scene, x, y }` for cross-scene vehicle persistence.
- **New Games:** Initialized via `isNewGame: true` in `setSave`, which MUST reset flags, inventory, and taxi data.
- **Session Sync:** `playerLoader.js` is responsible for pulling save data into the active `localStorage` user object during scene transitions.

## NPC & Dialogue Logic
- **Dialogue Nodes:** Defined in JSON. Support `conditions` (e.g., `HAS_ITEM`, `FLAG_EQUALS`) and `actions` (e.g., `SET_FLAG`).
- **Condition Checking:** Managed in `DialogueManager.js`.
- **Interaction:** Triggered by proximity check + "E" key.

## Technical Workflows
- **Manual Save (Hotkey 'L'):** Must capture `this.player`, `this.taxi`, and current session `flags/inventory` via `setSave`.
- **Scene Initialization:** Always reset scene-level booleans (e.g., `isGuardChecking`) in `create()` to prevent state bleeding between save slots.
- **Portals:** Handled via `setupPortals`. Use `p.properties.name` to identify specific portals for conditional logic (e.g., disabling the hallway entrance).

## UI Standards
- **Menu/Home Button:** Pinned to viewport using `createMenuButton` with `scrollFactor: 0`.
- **Overlays:** Use `scene.launch` for UI scenes to keep them independent of world physics.
- **School ID:** Controlled via `SchoolIDOverlay` with `showID(scale, showDim)` and `hideID()`.

## Future Expansion: Dynamic NPC Progress System
    To make the school feel reactive to the player's 10-level progress in Python, Java, and C++.

    ### Proposed Dialogue Conditions (to be added to `DialogueManager.js`):
    - `QUIZ_LEVEL_COMPLETED`: `{ "type": "QUIZ_LEVEL_COMPLETED", "language": "Python", "level": 5 }`
    - `CODE_TASK_COMPLETED`: `{ "type": "CODE_TASK_COMPLETED", "language": "Java", "level": 3 }`
    - `GLOBAL_LEVEL_REACHED`: `{ "type": "MIN_LEVEL", "value": 10 }`

    ### NPC Archetypes:
    1. **Subject Professors:** React to mastery of their specific language. Give hints if player fails multiple times.
    2. **Peer Students:**
      - **Rivals:** Compare their level to yours.
      - **Novices:** Ask for help if you've passed a level they are stuck on.
      - **Graduates:** NPCs who only talk to you once you hit Level 10.

    ### Integration Strategy:
    - Store progress-based dialogue in `src/assets/dialogue/`.
    - Use the existing condition filtering to pick the highest priority node (most advanced progress).
