// import Phaser from "phaser";
// import { submitCode } from "../utils/pistonApi";
// import {
//   codeEditorHTML,
//   languageDropdownHTML,
//   getCodeTemplate
// } from "../utils/codeEditorUtil";

// export class DataTestScene extends Phaser.Scene {
//   constructor() {
//     super({ key: "DataTestScene" });
//   }

//   create() {
//     // -------------------------------
//     // 1. Title
//     // -------------------------------
//     this.add
//       .text(400, 40, "Code Runner (Piston API)", {
//         fontSize: "32px",
//         color: "#ffffff",
//       })
//       .setOrigin(0.5);

//     // -------------------------------
//     // 2. Language Dropdown
//     // -------------------------------
//     this.dropdown = this.add.dom(400, 100).createFromHTML(languageDropdownHTML());
//     const dropdownElem = this.dropdown.getChildByID("langSelect");

//     // Default language
//     this.languageId = "python3";

//     dropdownElem.onchange = () => {
//       switch (dropdownElem.value) {
//         case "71":
//           this.languageId = "python3";
//           break;
//         case "62":
//           this.languageId = "java";
//           break;
//         case "54":
//           this.languageId = "cpp";
//           break;
//       }
//       this.updateCodeBox();
//     };

//     // -------------------------------
//     // 3. Code Editor Box
//     // -------------------------------
//     this.codeBox = this.add.dom(400, 260).createFromHTML(codeEditorHTML());

//     // Fill with default template
//     this.updateCodeBox();

//     // -------------------------------
//     // 4. Output Text
//     // -------------------------------
//     this.outputText = this.add.text(50, 500, "", {
//       fontSize: "20px",
//       color: "#ffff00",
//       wordWrap: { width: 700 },
//     });

//     // -------------------------------
//     // 5. Run Button
//     // -------------------------------
//     const runBtn = this.add
//       .text(400, 420, "RUN CODE", {
//         fontSize: "28px",
//         color: "#00ff00",
//         backgroundColor: "#000",
//         padding: { x: 12, y: 8 },
//       })
//       .setOrigin(0.5)
//       .setInteractive({ useHandCursor: true });

//     runBtn.on("pointerdown", () => this.runCode());
//   }

//   // -------------------------------
//   // Fill editor with correct template
//   // -------------------------------
//   updateCodeBox() {
//     const textarea = this.codeBox.getChildByID("codeInput");

//     switch (this.languageId) {
//       case "python3":
//         textarea.value = getCodeTemplate(71);
//         break;
//       case "java":
//         textarea.value = getCodeTemplate(62);
//         break;
//       case "cpp":
//         textarea.value = getCodeTemplate(54);
//         break;
//     }
//   }

//   // -------------------------------
//   // Run code via Piston
//   // -------------------------------
//   async runCode() {
//     const code = this.codeBox.getChildByID("codeInput").value.trim();

//     if (!code) {
//       this.outputText.setText("❌ Please type code first.");
//       return;
//     }

//     this.outputText.setText("⏳ Running code...");

//     try {
//       const result = await submitCode(code, this.languageId);

//       if (!result) {
//         this.outputText.setText("❌ Failed to contact Piston API.");
//         return;
//       }

//       const output = result.stdout || result.stderr || "No output";
//       this.outputText.setText(`🟢 Output:\n${output}`);
//     } catch (err) {
//       this.outputText.setText(`❌ Error: ${err.message}`);
//     }
//   }
// }
