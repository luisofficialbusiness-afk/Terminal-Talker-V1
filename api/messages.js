let messages = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    messages.push({
      content: req.body.content,
      timestamp: Date.now()
    });
    if (messages.length > 100) messages.shift();
    res.json({ success: true });
  } else {
    res.json({ messages });
  }
}
