let messages = [];

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { room, user, text, system } = req.body;
  if (!room || !user || !text) return res.status(400).json({ error: "Missing fields" });

  const msg = {
    id: Date.now() + Math.random(),
    room,
    user,
    text,
    system: system || false,
    time: Date.now()
  };

  messages.push(msg);
  res.status(200).json({ success: true });
}
