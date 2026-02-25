// src/utils/judge0Api.js
export async function submitCode(sourceCode, language) {
  // Judge0 endpoint (hosted free API)
  const url = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

  // Map your friendly language names to Judge0 language IDs
  const languageMap = {
    python: 71,
    javascript: 63,
    java: 62,
    c: 50,
    "c++": 54,
  };

  const languageId = languageMap[language.toLowerCase()];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const body = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: "",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // If using RapidAPI, you'll need these headers:
        // "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
        // "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Judge0 API error ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Return normalized output
    return {
      stdout: data.stdout || "",
      stderr: data.stderr || data.compile_output || "",
      exitCode: data.status?.id === 3 ? 0 : data.status?.id || 1,
      language,
    };
  } catch (err) {
    console.error("Error submitting code to Judge0:", err);
    return { stdout: "", stderr: err.message, exitCode: 1, language };
  }
}