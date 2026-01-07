let typingUsers = {};

export default function handler(req, res) {
  if (req.method === "POST") {
    const { room, user } = req.body;
    typingUsers[room] = user;
    setTimeout(() => {
      if (typingUsers[room] === user) delete typingUsers[room];
    }, 3000); // 3s timeout
    return res.status(200).end();
  }

  const { room } = req.query;
  res.status(200).json({ user: typingUsers[room] || null });
}
