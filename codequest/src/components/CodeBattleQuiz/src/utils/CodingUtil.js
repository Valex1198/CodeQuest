import { EditorView, basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import WebFont from "webfontloader";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

window.python = python;
window.java = java;
window.cpp = cpp;

/** Load a web font */
export const loadWebFont = (scene, fontName = "Press Start 2P", url) => {
  return new Promise((resolve) => {
    scene.fontReady = false;
    WebFont.load({
      custom: { families: [fontName], urls: [url] },
      active: () => {
        scene.fontReady = true;
        resolve();
      },
    });
  });
};

/** Create a Phaser DOM element */
export const createDOMElement = (scene, obj, html, zIndex = 1) => {
  const dom = scene.add
    .dom(obj.x + obj.width / 2, obj.y + obj.height / 2)
    .createFromHTML(html)
    .setOrigin(0.5);

  if (zIndex) dom.node.style.zIndex = zIndex;
  return dom;
};

/** Initialize CodeMirror */
export const initCodeMirror = async (codeDiv, langId) => {
  const langMap = { 1: window.python(), 2: window.java(), 3: window.cpp() };
  const cm = await window.createCodeMirrorEditor(codeDiv, langId);

  return {
    editor: cm,
    setLanguage: (newLangId) => {
      const langExt = langMap[newLangId];
      cm.dispatch({
        effects: EditorView.reconfigure.of([basicSetup, langExt, oneDark]),
      });
    },
  };
};

/** Create Phaser text button */
export const createButton = (scene, obj, text, style, onClick, depth = 5) => {
  const btn = scene.add
    .text(obj.x + obj.width / 2, obj.y + obj.height / 2, text, style)
    .setOrigin(0.5)
    .setInteractive()
    .setDepth(depth);

  btn.on("pointerdown", onClick);
  return btn;
};

/** Enable / disable DOM elements (input/output) */
export const disableDOMElements = (elements, disable = true) => {
  elements.forEach((el) => {
    if (!el) return;
    el.style.pointerEvents = disable ? "none" : "auto";
    el.style.opacity = disable ? 0 : 1;
    el.style.display = disable ? "none" : "block";
  });
};

/** Completely hide/show a Phaser DOM element (CodeMirror container) */
export const disablePhaserDOM = (domElement, disable = true) => {
  if (!domElement) return;

  domElement.node.style.display = disable ? "none" : "block";
  domElement.node.style.pointerEvents = disable ? "none" : "auto";
  domElement.node.style.opacity = disable ? 0 : 1;
};

/** Create IO box */
export const createIOBox = (scene, obj, zIndex = 2) => {
  const ioArea = createDOMElement(
    scene,
    obj,
    `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <div id="inputText" contenteditable="true" style="
        width:${obj.width}px;
        height:${obj.height / 2 - 5}px;
        background:#111;
        color:#0f0;
        font-family:monospace;
        padding:10px;
        overflow:auto;
        border:1px solid #333;
      "></div>
      <pre id="outputText" style="
        width:${obj.width}px;
        height:${obj.height / 2 - 5}px;
        background:#000;
        color:#0f0;
        font-family:monospace;
        padding:10px;
        overflow:auto;
        border:1px solid #333;
      "></pre>
    </div>
  `,
    zIndex
  );

  return {
    ioArea,
    inputField: ioArea.getChildByID("inputText"),
    outputField: ioArea.getChildByID("outputText"),
  };
};

/** Create Task button and launch TaskOverlay */
export const createTaskButton = (
  scene,
  zone,
  codeEditorDiv,
  ioArea,
  taskData, // ✅ passed from CodingGameScene
  overlaySceneName = "TaskOverlay",
  depthLabel = 10,
  depthHitbox = 11
) => {
  const viewLabel = scene.add
    .text(zone.x + zone.width / 2, zone.y + zone.height / 2, "VIEW TASK", {
      fontFamily: '"Press Start 2P"',
      fontSize: "20px",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(depthLabel);

  const hitbox = scene.add
    .zone(
      zone.x + zone.width / 2,
      zone.y + zone.height / 2,
      zone.width,
      zone.height
    )
    .setOrigin(0.5)
    .setInteractive()
    .setDepth(depthHitbox);

  hitbox.on("pointerover", () =>
    scene.tweens.add({ targets: viewLabel, scale: 1.1, duration: 120 })
  );
  hitbox.on("pointerout", () =>
    scene.tweens.add({ targets: viewLabel, scale: 1.0, duration: 120 })
  );

  hitbox.on("pointerup", () => {
    if (scene.scene.isActive(overlaySceneName)) return;

    disablePhaserDOM(codeEditorDiv, true);
    disableDOMElements([ioArea.inputField, ioArea.outputField], true);

    scene.scene.pause(scene.scene.key);

    scene.scene.launch(overlaySceneName, {
      previousScene: scene.scene.key,
      task: taskData, // ✅ safe
    });

    const overlayScene = scene.scene.get(overlaySceneName);

    overlayScene.events.once("shutdown", () => {
      disablePhaserDOM(codeEditorDiv, false);
      disableDOMElements([ioArea.inputField, ioArea.outputField], false);
      scene.scene.resume(scene.scene.key);
    });
  });

  return { viewLabel, hitbox };
};

export const checkCondition = (studentCode, condition) => {
  // Check mustUse keywords/operators
  if (condition.mustUse) {
    for (const keyword of condition.mustUse) {
      if (!studentCode.includes(keyword)) {
        return `You must use '${keyword}' in your code.`;
      }
    }
  }

  // Check mustNotUse forbidden words/operators
  if (condition.mustNotUse) {
    for (const forbidden of condition.mustNotUse) {
      if (studentCode.includes(forbidden)) {
        return `You cannot use '${forbidden}' in your code.`;
      }
    }
  }

  return true; // All conditions passed
};

