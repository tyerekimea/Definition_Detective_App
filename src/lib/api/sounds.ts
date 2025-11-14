export async function requestGameSound(soundType: string) {
    const res = await fetch("/api/genkit/game-sounds-flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "game-sounds-flow",
        body: soundType,
      }),
    });
  
    if (!res.ok) throw new Error("Sound request failed");
  
    return res.json();
  }
  