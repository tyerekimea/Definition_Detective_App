export async function requestSmartHint(payload: {
    word: string;
    incorrectGuesses: string;
    lettersToReveal: number;
  }) {
    const res = await fetch("/api/genkit/smart-word-hints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "smart-word-hints",
        body: payload,
      }),
    });
  
    if (!res.ok) {
      throw new Error("Hint request failed");
    }
  
    return res.json();
  }
  