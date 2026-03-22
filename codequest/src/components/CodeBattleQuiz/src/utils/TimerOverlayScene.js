import Phaser from "phaser";

export class TimerOverlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "TimerOverlayScene" });
    this.TOTAL_TIME = 900; // 15 minutes
    this.timeLeft = this.TOTAL_TIME;
    this.timerInterval = null;
  }

  create() {
    // Reset the timer every time the scene starts
    this.timeLeft = this.TOTAL_TIME;

    // Remove any old intervals
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Create the DOM timer
    this.timerDOM = this.add.dom(this.sys.canvas.width / 2 - 40, this.sys.canvas.height - 40).createFromHTML(`
      <div id="timerHUD" style="
        font-family: 'Press Start 2P';
        font-size: 24px;
        color: #00ff00;
        background-color: rgba(0,0,0,0.5);
        padding: 8px 12px;
        border-radius: 8px;
        user-select: none;
      ">15:00</div>
    `).setOrigin(0.5, 1).setScrollFactor(0);

    // Start counting down
    this.timerInterval = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.updateDisplay();

      if (this.timeLeft === 0) {
        const timerEl = document.getElementById("timerHUD");
        if (timerEl) timerEl.style.color = "#ff0000";
      }
    }, 1000);
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, "0");
    const seconds = (this.timeLeft % 60).toString().padStart(2, "0");

    const timerEl = document.getElementById("timerHUD");
    if (timerEl) timerEl.textContent = `${minutes}:${seconds}`;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }
}
