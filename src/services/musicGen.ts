export async function generateMusic(prompt: string, duration: number = 30) {
  const response = await fetch("/api/generate-music", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, duration }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate music");
  }

  return await response.json();
}
