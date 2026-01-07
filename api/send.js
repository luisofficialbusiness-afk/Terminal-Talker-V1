let messages = [];

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { room, user, text, system } = req.body;
  if (!room || !user || !text) return res.status(400).end();

  messages.push({
    id: Date.now(),
    room,
    user,
    text,
    system: !!system
  });

  res.status(200).json({ success: true });
}
