// =====================================================
// IMPORTS
// =====================================================
import { EditorView, basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

// =====================================================
// CODE TEMPLATES
// =====================================================
export const CODE_TEMPLATES = {
  python: `# Write your Python code below

`,

  java: `import java.util.*;
  
public class Main {
    public static void main(String[] args) {
        
    }
}
`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    
    return 0;
}
`,
};

// =====================================================
// LANGUAGE HELPERS
// =====================================================
export function getCodeTemplate(langId) {
  switch (langId) {
    case 1: return CODE_TEMPLATES.python;
    case 2: return CODE_TEMPLATES.java;
    case 3: return CODE_TEMPLATES.cpp;
    default: return CODE_TEMPLATES.python;
  }
}

export function getPistonLanguage(langId) {
  switch (langId) {
    case 1: return { lang: "python", version: "*" };
    case 2: return { lang: "java", version: "*" };
    case 3: return { lang: "cpp", version: "*" };
    default: return { lang: "python", version: "*" };
  }
}

// =====================================================
// CODEMIRROR INITIALIZER
// =====================================================
export async function createCodeMirrorEditor(domElement, langId = 1) {
  const langExtMap = {
    1: python(),
    2: java(),
    3: cpp(),
  };

  const editor = new EditorView({
    parent: domElement,
    doc: getCodeTemplate(langId),
    extensions: [
      basicSetup,
      oneDark,
      langExtMap[langId] || python(),
      EditorView.theme({
        "&": {
          height: "100%",        // Fill the parent container
          width: "100%",
          fontSize: "14px",
        },
        ".cm-scroller": {
          overflow: "auto",      // Scrollbar appears if content exceeds box
          padding: "4px",
        },
        ".cm-content": {
          minHeight: "100%",     // Ensure content fills container
        },
      }),
    ],
  });

  return editor;
}

// Make globally accessible for Phaser scene
window.createCodeMirrorEditor = createCodeMirrorEditor;

// =====================================================
// PISTON API EXECUTION
// =====================================================
const PISTON_URL = process.env.REACT_APP_PISTON_URL || "http://localhost:2000/api/v2/execute";

export async function runCodeWithPiston(langId, code) {
  const { lang, version } = getPistonLanguage(langId);

  try {
    const response = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: lang,
        version: version,
        files: [{ content: code }],
          // <-- pass input here
      }),
    });

    const data = await response.json();
    return data.run?.output || data.run?.stderr || "No output.";
  } catch (err) {
    return "❌ Error running code: " + err.message;
  }
}


// Make globally accessible
window.runCodeWithPiston = runCodeWithPiston;

// =====================================================
// HTML GENERATORS
// =====================================================
export function codeEditorHTML(width = 500, height = 300) {
  return `
    <div style="
      width: ${width}px;
      height: ${height}px;
      background: #1e1e1e;
      overflow: auto;
      border: 2px solid #444;
      border-radius: 4px;
    ">
      <div id="codeInput" style="width:100%;height:100%;"></div>
    </div>
  `;
}

export function languageDropdownHTML(width = 120) {
  return `
    <select id="langSelect" style="
      width:${width}px;
      font-size:16px;
      padding:5px;
      border-radius:4px;
      background-color:#222;
      color:#0f0;
    ">
      <option value="1">Python</option>
      <option value="2">Java</option>
      <option value="3">C++</option>
    </select>
  `;
}

export function outputBoxHTML(width = 500, height = 150) {
  return `
    <div style="
      width:${width}px;
      height:${height}px;
      background:#111;
      color:#0f0;
      font-family:monospace;
      padding:10px;
      overflow:auto;
    ">
      <pre id="outputText"></pre>
    </div>
  `;
}
