export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Main channel webhook
  let webhookUrl = "https://discord.com/api/webhooks/1457877866577399841/gTQRwnsyE8m_Udwf--c4Q7p74UUGuLDdnC3gcNJ9fTYE6p2q-3HDpO0oQ_2PCOF65wrR";

  // Override if frontend specifies (mod-log)
  if (req.body.webhook) webhookUrl = req.body.webhook;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: req.body.message })
  });

  res.json({ success: true });
}


---

🔗 api/messages.js

let messages = []; // store messages temporarily

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { content } = req.body;

    messages.push({ content, timestamp: Date.now() });
    if (messages.length > 100) messages.shift();

    res.json({ success: true });
  } else if (req.method === "GET") {
    res.json({ messages });
  } else {
    res.status(405).end();
  }
}
