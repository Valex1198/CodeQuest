export default class ProgressTracker {
  constructor(scene, totalQuestions) {
    this.scene = scene;
    this.totalQuestions = totalQuestions;
    this.current = 0;
    this.results = []; // "o" = correct, "x" = wrong

    // Container
    this.container = scene.add.container(20, 20);

    // Title
    this.title = scene.add.text(0, 0, "Quiz 1/" + totalQuestions, {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff",
    });
    this.container.add(this.title);

    // Results row (below title)
    this.resultText = scene.add.text(0, 40, "", {
      fontFamily: "Arial",
      fontSize: "30px",
      color: "#ffcc00",
    });
    this.container.add(this.resultText);
  }

  updateProgress(isCorrect) {
    this.current++;
    this.results.push(isCorrect ? "o" : "x");

    // Update title
    this.title.setText(`Quiz ${this.current}/${this.totalQuestions}`);

    // Build "o x o o x o ..."
    const visual = [];

    for (let i = 0; i < this.totalQuestions; i++) {
      if (this.results[i] === "o") visual.push("o");
      else if (this.results[i] === "x") visual.push("x");
      else visual.push("•"); // unanswered
    }

    this.resultText.setText(visual.join(" "));
  }
}
