let messages = [];

export default function handler(req, res) {
  const { room } = req.query;
  if (!room) return res.status(400).json([]);

  res.status(200).json(messages.filter(m => m.room === room));
}
