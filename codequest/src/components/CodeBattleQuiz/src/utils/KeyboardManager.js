export class KeyboardManager {
  constructor(scene, x, y, keyboardImage) {
    this.scene = scene;
    this.frameWidth = 384;
    this.frameHeight = 135;
    this.baseX = x;
    this.baseY = y;

    // Sound keys
    this.soundKeys = ["keySound1", "keySound2", "keySound3", "keySound4"];
    this.lastSoundKey = null;

    // Map JS event.key/code to Atlas Tag Names
    this.keyMap = {
      "~": "~", "`": "~",
      "1": "1", "2": "2", "3": "3", "4": "4", "5": "5",
      "6": "6", "7": "7", "8": "8", "9": "9", "0": "0",
      "!": "1", "@": "2", "#": "3", "$": "4", "%": "5",
      "^": "6", "&": "7", "*": "8", "(": "9", ")": "0",
      "-": "-", "_": "-", "=": "=/+", "+": "=/+",
      "Backspace": "Backspace",
      "Tab": "Tab",
      "q": "Q", "w": "W", "e": "E", "r": "R", "t": "T", "y": "Y", "u": "U", "i": "I", "o": "O", "p": "P",
      "[": "[", "{": "[", "]": "]", "}": "]",
      "Enter": "Enter",
      "CapsLock": "Caps",
      "a": "A", "s": "S", "d": "D", "f": "F", "g": "G", "h": "H", "j": "J", "k": "K", "l": "L",
      ";": ";", ":": ";", "\"": "'", "'": "'", "\\": "\\", "|": "\\",
      "Shift": "Left Shift",
      "Right Shift": "Right Shift",
      "Left Shift": "Left Shift",
      "Right ALT": "RIGHT ALT",
      "z": "Z", "x": "X", "c": "C", "v": "V", "b": "B", "n": "N", "m": "M",
      ",": ",", "<": ",", ".": ".", ">": ".", "/": "/", "?": "/",
      "ArrowUp": "UP ",
      "ArrowLeft": "LEFT",
      "ArrowDown": "DOWN",
      "ArrowRight": "RIGHT",
      "Control": "CTRL",
      "Meta": "WINDOWS",
      "Alt": "LEFT ALT",
      " ": "SPACE"
    };

    // Frame indices from JSON
    this.tags = {
      "Base": 0, "~": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "7": 8, "8": 9, "9": 10, "0": 11, "-": 12, "=/+": 13,
      "Backspace": 14, "Tab": 15, "Q": 16, "W": 17, "E": 18, "R": 19, "T": 20, "Y": 21, "U": 22, "I": 23, "O": 24, "P": 25,
      "[": 26, "]": 27, "Enter": 28, "Caps": 29, "A": 30, "S": 31, "D": 32, "F": 33, "G": 34, "H": 35, "J": 36, "K": 37,
      "L": 38, ";": 39, "'": 40, "\\": 41, "Right Shift": 42, "Left Shift": 43, "Z": 44, "X": 45, "C": 46, "V": 47,
      "B": 48, "N": 49, "M": 50, ",": 51, ".": 52, "?": 53, "/": 54, "UP ": 55, "LEFT": 56, "DOWN": 57, "RIGHT": 58,
      "CTRL": 59, "WINDOWS": 60, "LEFT ALT": 61, "SPACE": 62, "RIGHT ALT": 63, "RIGHT WINDOWS": 64
    };

    this.createSprite(keyboardImage);
    this.setupListeners();
  }

  createSprite(imageUrl) {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (!this.scene || !this.scene.textures) return;

      const canvas1 = document.createElement("canvas");
      const canvas2 = document.createElement("canvas");
      
      const mid = 32; 
      canvas1.width = this.frameWidth * (mid + 1);
      canvas1.height = this.frameHeight;
      canvas2.width = this.frameWidth * (65 - mid - 1);
      canvas2.height = this.frameHeight;

      const ctx1 = canvas1.getContext("2d");
      const ctx2 = canvas2.getContext("2d");

      ctx1.drawImage(img, 0, 0, canvas1.width, this.frameHeight, 0, 0, canvas1.width, this.frameHeight);
      ctx2.drawImage(img, canvas1.width, 0, canvas2.width, this.frameHeight, 0, 0, canvas2.width, this.frameHeight);

      if (this.scene.textures.exists("kbd_part1")) this.scene.textures.remove("kbd_part1");
      if (this.scene.textures.exists("kbd_part2")) this.scene.textures.remove("kbd_part2");

      this.scene.textures.addSpriteSheet("kbd_part1", canvas1, { frameWidth: this.frameWidth, frameHeight: this.frameHeight });
      this.scene.textures.addSpriteSheet("kbd_part2", canvas2, { frameWidth: this.frameWidth, frameHeight: this.frameHeight });

      this.sprite = this.scene.add.sprite(this.baseX, this.baseY, "kbd_part1", 0)
        .setOrigin(0.5)
        .setDepth(5);

      this.splitPoint = mid;
    };
  }

  playRandomSound() {
    if (!this.scene || !this.scene.sound) return;

    // Filter out the last played sound to avoid repetition
    const availableKeys = this.soundKeys.filter(k => k !== this.lastSoundKey);
    const randomIndex = Math.floor(Math.random() * availableKeys.length);
    const key = availableKeys[randomIndex];
    
    if (this.scene.cache.audio.has(key)) {
      this.scene.sound.play(key, { volume: 0.5 });
      this.lastSoundKey = key;
    }
  }

  setupListeners() {
    this.activeKeys = new Set();

    this.onKeyDown = (e) => {
      if (!this.sprite) return;
      let key = e.key;
      if (e.code === "ShiftRight") key = "Right Shift";
      if (e.code === "ShiftLeft") key = "Left Shift";
      if (e.code === "AltRight") key = "Right ALT";
      
      const tagName = this.keyMap[key] || this.keyMap[key.toLowerCase()] || null;
      if (tagName && this.tags[tagName] !== undefined) {
        if (!this.activeKeys.has(tagName)) {
           this.playRandomSound();
        }
        this.activeKeys.add(tagName);
        this.setFrame(this.tags[tagName]);
      }
    };

    this.onKeyUp = (e) => {
      if (!this.sprite) return;
      let key = e.key;
      if (e.code === "ShiftRight") key = "Right Shift";
      if (e.code === "ShiftLeft") key = "Left Shift";
      if (e.code === "AltRight") key = "Right ALT";

      const tagName = this.keyMap[key] || this.keyMap[key.toLowerCase()] || null;
      if (tagName) {
        this.activeKeys.delete(tagName);
      }

      if (this.activeKeys.size === 0) {
        this.setFrame(0);
      } else {
        const lastKey = Array.from(this.activeKeys).pop();
        this.setFrame(this.tags[lastKey]);
      }
    };

    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);

    this.scene.events.on("shutdown", () => this.destroy());
  }

  setFrame(index) {
    if (!this.sprite || !this.sprite.scene) return;
    
    if (index <= this.splitPoint) {
      this.sprite.setTexture("kbd_part1");
      this.sprite.setFrame(index);
    } else {
      this.sprite.setTexture("kbd_part2");
      this.sprite.setFrame(index - this.splitPoint - 1);
    }
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("keyup", this.onKeyUp, true);
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
