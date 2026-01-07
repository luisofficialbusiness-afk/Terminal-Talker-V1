import { WebSocketServer } from "ws";

const rooms = {};
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", socket => {
  socket.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.action === "resetServer") {
      for (const r in rooms) rooms[r] = [];
      wss.clients.forEach(c =>
        c.send(JSON.stringify({ room: "general", content: "[SYSTEM] Server reset" }))
      );
      return;
    }

    if (data.action === "join") {
      rooms[data.room] ??= [];
      socket.send(JSON.stringify({ room: data.room, content: `Joined ${data.room}` }));
      return;
    }

    if (data.action === "say") {
      rooms[data.room] ??= [];
      rooms[data.room].push(data);
      wss.clients.forEach(c =>
        c.send(JSON.stringify({
          room: data.room,
          content: `[${data.user}] > ${data.message}`
        }))
      );
    }
  });
});

export default wss;
