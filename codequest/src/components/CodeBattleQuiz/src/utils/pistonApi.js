// src/utils/pistonApi.js
const PISTON_URL = "/api/v2/execute";

export async function submitCode(sourceCode, language, input = "") {
  const url = PISTON_URL;

  // Normalize language for Piston
  let pistonLang = language.toLowerCase();
  if (pistonLang === "c++") pistonLang = "cpp";

  const body = {
    language: pistonLang,
    version: "*",
    files: [{ content: sourceCode }],
    stdin: input,
  };

  try {
    console.log(`[Piston] Submitting to: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[Piston] HTTP Error: ${response.status} ${response.statusText}`);
      throw new Error(`Piston API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize output similar to Judge0
    return {
      stdout: data.run.output,
      stderr: data.run.stderr,
      exitCode: data.run.code,
      language: data.language,
    };
  } catch (error) {
    console.error("Error submitting code to Piston:", error);
    return null;
  }
}
