let rooms = ["general"]; // default room

export default function handler(req, res) {
  res.status(200).json(rooms);
}
