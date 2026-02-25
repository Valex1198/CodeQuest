import Phaser from "phaser";
import WebFont from "webfontloader";
import menuMap from "../assets/Menu.json";
import MenuBG from "../assets/Menu.png";
import PythonImg from "../assets/python.png";
import JavaImg from "../assets/java.png";
import CppImg from "../assets/c++.png";
import ArrowImg from "../assets/Arrow.png";

import {
  getObjectByName,
  createAvatar,
  createLanguageCarousel
} from "../utils/menuUtil.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    this.fontReady = false;
  }

  preload() {
    this.load.tilemapTiledJSON("menuMap", menuMap);
    this.load.image("MenuBG", MenuBG);
    this.load.image("pythonImg", PythonImg);
    this.load.image("javaImg", JavaImg);
    this.load.image("cppImg", CppImg);
    this.load.spritesheet("arrow", ArrowImg, { frameWidth: 32, frameHeight: 32 });

    WebFont.load({
      custom: { families: ["Press Start 2P"], urls: ["src/components/CodeBattleQuiz/src/fonts/fonts.css"] },
      active: () => { this.fontReady = true; },
      inactive: () => { console.warn("⚠️ Failed to load font"); },
    });
  }

  create() {
    const canvasWidth = this.sys.game.config.width;
    const canvasHeight = this.sys.game.config.height;
    this.add.image(canvasWidth / 2, canvasHeight / 2, "MenuBG").setOrigin(0.5);

    const map = this.make.tilemap({ key: "menuMap" });
    const statBoxZone = getObjectByName(map, "StatBox");
    const avatarZone = getObjectByName(map, "AvatarZone");
    const nameZone = getObjectByName(map, "NameZone");

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (user && avatarZone && nameZone) createAvatar(this, avatarZone, nameZone, user);

    // Wait for font to load before creating carousel
    const waitForFont = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.fontReady && statBoxZone) {
          createLanguageCarousel(
            this,
            statBoxZone,
            map,
            ["pythonImg", "javaImg", "cppImg"],
            ["Python", "Java", "C++"],
            (selectedLang) => this.scene.start("SaveSlotsScene", { selectedLanguage: selectedLang })
          );
          waitForFont.remove();
        }
      },
      loop: true
    });
  }
}
