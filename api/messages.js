let messages = [];

export default function handler(req, res) {
  const { room } = req.query;
  if (!room) return res.status(400).json({ error: "Room missing" });
  const roomMessages = messages.filter(m => m.room === room);
  res.status(200).json(roomMessages.slice(-200));
}
