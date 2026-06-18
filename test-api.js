// Native global fetch is used


async function run() {
  const payload = {
    message: "Based on the attached document, what is the secret keyword?",
    history: [],
    file: {
      name: "secret.txt",
      type: "text/plain",
      base64: Buffer.from("The secret keyword for today's research evaluation is OLYMPUS-99.").toString('base64')
    }
  };

  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rawText = await res.text();
    console.log("Response status:", res.status);
    try {
      const data = JSON.parse(rawText);
      console.log("Response body (JSON):", JSON.stringify(data, null, 2));
    } catch {
      console.log("Response body (HTML/Text):", rawText.slice(0, 1000));
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

run();
