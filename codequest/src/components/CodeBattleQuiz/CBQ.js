import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import testBg from "./src/assets/testbg.mp4";
import startbtn from "./src/assets/startbtn.png"; // PNG import
import { HomeScene } from "./src/scenes/HomeScene.js";
import { LivingRoomScene } from "./src/scenes/LivingRoomScene.js";
import { OutsideScene } from "./src/scenes/OutsideScene.js";
import { SchoolScene } from "./src/scenes/SchoolScene.js";
import { SaveSlotsScene } from "./src/scenes/SaveSlotsScene.js";
import { SchoolLobbyScene } from "./src/scenes/SchoolLobby.js";
import { SchoolHallwayScene } from "./src/scenes/SchoolHallway.js";
//import { DataTestScene } from "./src/scenes/DataTestScene.js";
import { MenuScene } from "./src/scenes/MenuScene.js";
import { CodingGameScene } from "./src/games/CodingGame.js";
import { Comlab1Scene } from "./src/scenes/Comlab1Scene.js";
import { Comlab2Scene } from "./src/scenes/Comlab2Scene.js";
import { Comlab3Scene } from "./src/scenes/Comlab3Scene.js";
// import TypingGame from "./src/games/TypingGame.js";
import QuizGame from "./src/games/QuizGame.js";
import StatsOverlay from "./src/overlay/StatsOverlay.js";
import TaskOverlay from "./src/overlay/TaskOverlay.js";
import { ClipboardOverlay } from "./src/overlay/ClipboardOverlay.js";
import { useNavigate } from "react-router-dom";
import { HudOverlay } from "./src/overlay/HudOverlay.js";
import { InventoryOverlay } from "./src/utils/HudInventory.js";
import { LeaderboardScene } from "./src/scenes/LeaderboardScene.js";  
import { TimerOverlayScene } from "./src/utils/TimerOverlayScene.js";
import { SchoolIDOverlay } from "./src/overlay/SchoolIDOverlay.js";
import { PickupOverlay } from "./src/overlay/PickupOverlay.js";
import { GoalOverlay } from "./src/overlay/GoalOverlay.js";
import { DialogueOverlay } from "./src/overlay/DialogueOverlay.js";
import { DialogueBubbleOverlay } from "./src/overlay/DialogueBubbleOverlay.js";
import { GuideOverlay } from "./src/overlay/GuideOverlay.js";

// Boot Scene (handles loading with progress bar)
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Progress bar graphics
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 60, "Loading...", {
      font: "20px Arial",
      fill: "#ffffff",
    }).setOrigin(0.5);

    // Update progress
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load assets
    this.load.video("bg", testBg, "loadeddata", true, true);
    this.load.image("startbtn", startbtn);

    // Load hub map JSON

  }

  create() {
    // Go to Start scene when done
    this.scene.start("MenuScene");
  }
}

// Start Scene
class Start extends Phaser.Scene {
  constructor() {
    super({ key: "Start" });
    this.bg = null;
  }

  create() {
    // Background video
    this.bg = this.add.video(this.scale.width / 2, this.scale.height / 2, "bg");
    this.bg.setDepth(-1);
    this.bg.setMute(true);
    this.bg.play(true);

    // Fix zoom issue: only resize after video is ready
    this.bg.on("play", () => this.stretchBackground());

    this.scale.on("resize", this.stretchBackground, this);

    // Start button as PNG
    const startButton = this.add.image(480, 350, "startbtn"); // x, y
    startButton.setOrigin(0.5);
    startButton.setDepth(1);

    startButton.setScale(0.2);

    startButton.setInteractive({ useHandCursor: true });
    startButton.on("pointerover", () => startButton.setScale(0.25));
    startButton.on("pointerout", () => startButton.setScale(0.2));
    startButton.on("pointerdown", () => {
      // this.scene.start("SaveSlotsScene");
      this.scene.start("MenuScene");
      // this.scene.start("LeaderboardScene");
      // this.scene.start("OutsideScene");
      // this.scene.start("DataTestScene");
      //  this.scene.start("CodingGameScene");
    });
  }

  // Stretch background video to fill canvas while keeping aspect ratio
  stretchBackground() {
    if (!this.bg || !this.bg.video) return;

    const videoWidth = this.bg.video.videoWidth;
    const videoHeight = this.bg.video.videoHeight;
    const canvasWidth = this.scale.width;
    const canvasHeight = this.scale.height;

    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;
    const scale = Math.max(scaleX, scaleY);

    this.bg.setDisplaySize(videoWidth * scale, videoHeight * scale);
    this.bg.setPosition(canvasWidth / 2, canvasHeight / 2);
  }
}

// React wrapper
export default function CodeBattleQuiz() {
  const arenaRef = useRef(null);
  const gameRef = useRef(null);
  const navigate = useNavigate();

  // Phaser game initialization
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    if (arenaRef.current) {
      const config = {
        type: Phaser.AUTO,
        width: 960,
        height: 540,
        parent: "phaser-game",
        dom: { createContainer: true },
        scene: [BootScene, Start, HomeScene, LivingRoomScene, OutsideScene, 
                SchoolScene, SchoolLobbyScene, SaveSlotsScene, SchoolHallwayScene,
                Comlab1Scene, Comlab2Scene, Comlab3Scene,
                 QuizGame , MenuScene, CodingGameScene, TaskOverlay,
                HudOverlay, InventoryOverlay, GoalOverlay, ClipboardOverlay, StatsOverlay, LeaderboardScene, TimerOverlayScene, SchoolIDOverlay, PickupOverlay, DialogueOverlay, DialogueBubbleOverlay, GuideOverlay],
        scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
        backgroundColor: 0x000000,
        render: { pixelArt: true },
        physics: { default: "arcade", arcade: { debug: true } },
      };
      
      
      gameRef.current = new Phaser.Game(config);
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Your game session will be closed. Do you really want to leave?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // --- Listen for Phaser Quit button ---
    const handlePhaserQuit = () => navigate("/"); // go to React Home route
    window.addEventListener("phaserQuit", handlePhaserQuit);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("phaserQuit", handlePhaserQuit);

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [navigate]);

  return (
    <div
      ref={arenaRef}
      id="phaser-game"
      style={{
        width: "960px",
        height: "540px",
        margin: "0 auto",
        border: "2px solid #333",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#000",
        pixelArt: true,
      }}
    />
  );
}
