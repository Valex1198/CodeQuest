// import Phaser from "phaser";
// import FallingArena from "../assets/fallingArena.png";
// import FallingArenaStats from "../assets/fallingArenaStats.png";

// class HealthBar {
//   constructor(scene, x, y, width = 120, height = 16) {
//     this.scene = scene;
//     this.x = x;
//     this.y = y;
//     this.width = width;
//     this.height = height;
//     this.maxHealth = 100;
//     this.health = 100;

//     this.bg = scene.add.rectangle(x, y, width, height, 0x555555).setOrigin(0.5);
//     this.bar = scene.add.rectangle(x, y, width, height, 0x00ff00).setOrigin(0.5);
//   }

//   setHealth(value) {
//     const newHealth = Phaser.Math.Clamp(value, 0, this.maxHealth);
//     this.health = newHealth;
//     const targetWidth = (newHealth / this.maxHealth) * this.width;

//     this.scene.tweens.add({
//       targets: this.bar,
//       width: targetWidth,
//       duration: 300,
//       ease: "Sine.easeOut",
//     });

//     if (newHealth > 60) this.bar.fillColor = 0x00ff00;
//     else if (newHealth > 30) this.bar.fillColor = 0xffff00;
//     else this.bar.fillColor = 0xff0000;

//     // 🔴 Trigger Game Over when health hits 0
//     if (this.health <= 0) {
//       this.scene.endGame();
//     }
//   }
// }

// export default class TypingGame extends Phaser.Scene {
//   constructor() {
//     super("TypingGame");
//     this.words = [];
//     this.wordSpeed = 40;
//     this.spawnInterval = 2500;
//     this.score = 0;
//     this.activeWord = null;
//     this.combo = 0;
//     this.streak = 0;
//     this.difficultyTimer = 0;
//     this.elapsedTime = 0;
//     this.currentTier = "easy";
//     this.gameOver = false;
//   }

//   preload() {
//     this.load.image("fallingArena", FallingArena);
//     this.load.image("fallingArenaStats", FallingArenaStats);
//   }

//   create() {
//     // Arena
//     this.arena = this.add.image(480, 270, "fallingArena").setOrigin(0.5);

//     // Stats Panel
//     this.statsPanel = this.add.image(174, 170, "fallingArenaStats").setOrigin(0.5);
//     this.statsPanel.displayWidth = 200;
//     this.statsPanel.displayHeight = 300;

//     this.scoreText = this.add.text(this.statsPanel.x, this.statsPanel.y - 100, "Score: 0", {
//       fontSize: "20px",
//       fill: "#fff",
//     }).setOrigin(0.5);

//     this.healthBar = new HealthBar(this, this.statsPanel.x, this.statsPanel.y, 120, 16);
//     this.healthBar.setHealth(100);

//     // Typing input
//     this.input.keyboard.on("keydown", (event) => {
//       if (event.key === "Escape") {
//         this.endGame();
//         return;
//       }
//       if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
//         const key = event.key.toLowerCase();
//         this.handleTyping(key);
//       }
//     });

//     // Spawn words
//     this.wordSpawnEvent = this.time.addEvent({
//       delay: this.spawnInterval,
//       loop: true,
//       callback: this.spawnWord,
//       callbackScope: this,
//     });
//   }

//   handleTyping(key) {
//     if (this.gameOver) return;

//     if (!this.activeWord || !this.words.includes(this.activeWord)) {
//       if (this.words.length === 0) return;
//       this.activeWord = this.words.reduce((closest, w) => {
//         if (!closest) return w;
//         return w.texts[0].y > closest.texts[0].y ? w : closest;
//       }, null);
//     }

//     const word = this.activeWord;
//     const expectedLetter = word.wordText[word.typedIndex];
//     if (key === expectedLetter) {
//       if (word.texts[word.typedIndex] && word.texts[word.typedIndex].active) {
//         word.texts[word.typedIndex].setColor("#0f0");
//       }
//       word.typedIndex++;

//       if (word.typedIndex < word.wordText.length && word.texts[word.typedIndex] && word.texts[word.typedIndex].active) {
//         word.texts[word.typedIndex].setColor("#ff0");
//       }

//       if (word.typedIndex === word.wordText.length) {
//         this.completeWord(word);
//       }
//     } else {
//       this.combo = 0;
//       this.streak = 0;
//       this.healthBar.setHealth(this.healthBar.health - 5);
//       this.flashArenaRed();
//     }
//   }

//   completeWord(word) {
//     word.texts.forEach(letter => { if (letter && letter.active) letter.destroy(); });

//     this.words = this.words.filter(w => w !== word);
//     this.activeWord = null;

//     const earned = 10 * (this.combo + 1);
//     this.score += earned;
//     this.scoreText.setText("Score: " + this.score);

//     this.combo++;
//     this.streak++;

//     const healingWords = ["heal", "life", "restore", "recovery"];
//     if (healingWords.includes(word.wordText.toLowerCase())) {
//       this.healthBar.setHealth(this.healthBar.health + 10);
//     }

//     this.showFloatingScore(word.texts[0]?.x || 480, word.texts[0]?.y || 50, `+${earned}`);
//     this.showComboBadge();

//     if (this.streak % 5 === 0) this.spawnBonusWord();
//   }

//   flashArenaRed() {
//     this.arena.setTint(0xff0000);
//     this.time.delayedCall(200, () => this.arena.clearTint());
//   }

//   spawnBonusWord() {
//     const bonusWords = ["bonus", "jackpot"];
//     const wordText = Phaser.Utils.Array.GetRandom(bonusWords);
//     this.spawnWordWithText(wordText, "#ff69b4");
//   }

//   spawnWord() {
//     const javaWordsEasy = ["int", "for", "if", "else", "void", "new"];
//     const javaWordsMedium = ["class", "public", "static", "return", "boolean", "while"];
//     const javaWordsHard = ["interface", "implements", "extends", "synchronized", "throws", "finally", "package"];
//     const javaWordsExpert = ["annotation", "transient", "volatile", "instanceof", "serialization"];
//     const healingWords = ["heal", "life", "restore", "recovery"];

//     let javaWords = [...javaWordsEasy];

//     if (this.currentTier === "medium" || this.currentTier === "hard" || this.currentTier === "expert") {
//       javaWords = javaWords.concat(javaWordsMedium);
//     }
//     if (this.currentTier === "hard" || this.currentTier === "expert") {
//       javaWords = javaWords.concat(javaWordsHard);
//     }
//     if (this.currentTier === "expert") {
//       javaWords = javaWords.concat(javaWordsExpert);
//     }

//     let wordText;
//     let color = null;

//     if (Phaser.Math.Between(0, 100) < 20) {
//       wordText = Phaser.Utils.Array.GetRandom(healingWords);
//       color = "#0ff";
//     } else {
//       wordText = Phaser.Utils.Array.GetRandom(javaWords);
//     }

//     this.spawnWordWithText(wordText, color);
//   }

//   spawnWordWithText(wordText, color) {
//     const bounds = this.arena.getBounds();
//     const texts = [];
//     let totalWidth = 0;
//     const fontSize = 22;

//     for (let i = 0; i < wordText.length; i++) {
//       const temp = this.add.text(0, 0, wordText[i], { fontSize: fontSize + "px", fontFamily: "Arial" });
//       totalWidth += temp.width;
//       temp.destroy();
//     }

//     const xStart = Phaser.Math.Between(bounds.left + 10, bounds.right - totalWidth - 10);
//     const y = bounds.top + 10;

//     let xOffset = xStart;
//     for (let i = 0; i < wordText.length; i++) {
//       const letter = this.add.text(xOffset, y, wordText[i], {
//         fontSize: fontSize + "px",
//         color: i === 0 && !color ? "#ff0" : color || "#fff",
//         fontFamily: "Arial",
//       }).setOrigin(0, 0.5);
//       texts.push(letter);
//       xOffset += letter.width;
//     }

//     const wordObj = { texts, wordText, typedIndex: 0 };
//     this.words.push(wordObj);
//   }

//   showFloatingScore(x, y, text) {
//     const scoreText = this.add.text(x, y, text, { fontSize: "24px", color: "#0f0", fontStyle: "bold" }).setOrigin(0.5);
//     this.tweens.add({
//       targets: scoreText,
//       y: y - 50,
//       alpha: 0,
//       duration: 800,
//       ease: "Cubic.easeOut",
//       onComplete: () => scoreText.destroy()
//     });
//   }

//   showComboBadge() {
//     if (this.combo < 2) return;
//     const badge = this.add.text(480, 80, `x${this.combo} COMBO!`, {
//       fontSize: "28px",
//       fontStyle: "bold",
//       color: "#ff0",
//       stroke: "#000",
//       strokeThickness: 4
//     }).setOrigin(0.5);

//     this.tweens.add({
//       targets: badge,
//       y: 40,
//       alpha: 0,
//       duration: 1000,
//       ease: "Cubic.easeOut",
//       onComplete: () => badge.destroy()
//     });
//   }

//   update(time, delta) {
//     if (this.gameOver) return;

//     this.elapsedTime += delta;
//     const bounds = this.arena.getBounds();

//     this.words.forEach(word => {
//       word.texts.forEach(letter => {
//         if (letter && letter.active) letter.y += (this.wordSpeed * delta) / 1000;
//       });

//       if (word.texts[0] && word.texts[0].y > bounds.bottom - 10) {
//         word.texts.forEach(letter => { if (letter && letter.active) letter.destroy(); });
//         if (this.activeWord === word) this.activeWord = null;
//         this.healthBar.setHealth(this.healthBar.health - 10);
//         this.words = this.words.filter(w => w !== word);
//       }
//     });

//     this.updateDifficulty(delta);
//   }

//   updateDifficulty(delta) {
//     this.difficultyTimer += delta;

//     if (this.difficultyTimer >= 10000) {
//       this.difficultyTimer = 0;

//       this.wordSpeed = Math.min(this.wordSpeed + 5, 200);
//       this.spawnInterval = Math.max(this.spawnInterval - 100, 500);

//       if (this.wordSpawnEvent) {
//         this.wordSpawnEvent.remove(false);
//       }
//       this.wordSpawnEvent = this.time.addEvent({
//         delay: this.spawnInterval,
//         loop: true,
//         callback: this.spawnWord,
//         callbackScope: this,
//       });

//       this.checkDifficultyTier();
//     }
//   }

//   checkDifficultyTier() {
//     let newTier;
//     if (this.elapsedTime < 20000) newTier = "easy";
//     else if (this.elapsedTime < 40000) newTier = "medium";
//     else if (this.elapsedTime < 60000) newTier = "hard";
//     else newTier = "expert";

//     if (newTier !== this.currentTier) {
//       this.currentTier = newTier;
//       this.showDifficultyPopup(newTier);
//     }
//   }

//   showDifficultyPopup(tier) {
//     const messages = {
//       easy: "Easy Java Words Activated!",
//       medium: "Medium Java Words Unlocked!",
//       hard: "Hard Java Words Incoming!",
//       expert: "Expert Words Activated!"
//     };

//     const colors = {
//       easy: "#fff",
//       medium: "#ff0",
//       hard: "#ffa500",
//       expert: "#f00"
//     };

//     const icons = {
//       easy: "⚪",
//       medium: "🟡",
//       hard: "🟠",
//       expert: "🔴"
//     };

//     const popup = this.add.text(480, 100, `${icons[tier]} ${messages[tier]}`, {
//       fontSize: "28px",
//       fontStyle: "bold",
//       color: colors[tier],
//       stroke: "#000",
//       strokeThickness: 4,
//       align: "center"
//     }).setOrigin(0.5);

//     this.tweens.add({
//       targets: popup,
//       y: 60,
//       alpha: 0,
//       duration: 2000,
//       ease: "Cubic.easeOut",
//       onComplete: () => popup.destroy()
//     });
//   }

//   endGame() {
//     if (this.gameOver) return;
//     this.gameOver = true;

//     // Stop spawning
//     if (this.wordSpawnEvent) {
//       this.wordSpawnEvent.remove(false);
//     }

//     // Destroy words
//     this.words.forEach(word => {
//       word.texts.forEach(letter => letter.destroy());
//     });
//     this.words = [];

//     // Darken arena
//     this.arena.setTint(0x000000);

//     // Show Game Over text
//     const gameOverText = this.add.text(480, 270, "GAME OVER", {
//       fontSize: "64px",
//       fontStyle: "bold",
//       color: "#ff0000",
//       stroke: "#000",
//       strokeThickness: 6
//     }).setOrigin(0.5);

//     this.add.text(480, 340, `Final Score: ${this.score}`, {
//       fontSize: "28px",
//       color: "#fff"
//     }).setOrigin(0.5);

//     this.add.text(480, 400, "Press R to Restart or ESC to Exit", {
//       fontSize: "20px",
//       color: "#ff0"
//     }).setOrigin(0.5);

//     // Key bindings
//     this.input.keyboard.once("keydown-R", () => {
//       this.scene.restart();
//     });

//     this.input.keyboard.once("keydown-ESC", () => {
//       this.scene.stop("TypingGame");
//       this.scene.resume("OutsideScene");
//     });
//   }
// }
