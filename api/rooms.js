// Very simple WebSocket backend for rooms
import { WebSocketServer } from "ws";

const rooms = {};
const wss = new WebSocketServer({ noServer: true });

export default function handler(req, res) {
  if (req.method === "GET") res.status(200).json({ message: "Use WebSocket for TT" });
}

export { wss, rooms };
