import { WebSocketServer } from "ws";

export const rooms = {};
export const wss = new WebSocketServer({ noServer: true });

wss.on("connection", socket => {
  socket.on("message", msg => {
    const data = JSON.parse(msg);

    // ---------------- RESET SERVER ----------------
    if(data.action === "resetServer"){
      for(const room in rooms) rooms[room] = [];
      wss.clients.forEach(client => {
        if(client.readyState === 1){
          client.send(JSON.stringify({content:"[SYSTEM] Server has been reset. All messages cleared!", room:"general"}));
        }
      });
      return;
    }

    // ---------------- SAY MESSAGE ----------------
    if(data.action === "say"){
      if(!rooms[data.room]) rooms[data.room]=[];
      rooms[data.room].push({user:data.user,message:data.message,time:Date.now()});
      wss.clients.forEach(client=>{
        if(client.readyState===1) client.send(JSON.stringify({room:data.room, content:`[${data.user}] > ${data.message}`}));
      });
      return;
    }

    // ---------------- JOIN ROOM ----------------
    if(data.action === "join"){
      if(!rooms[data.room]) rooms[data.room]=[];
      socket.send(JSON.stringify({room:data.room, content:`Joined room "${data.room}"`}));
      return;
    }

    // ---------------- LIST ROOMS ----------------
    if(data.action === "listRooms"){
      socket.send(JSON.stringify({room:"general", content:`Available rooms: ${Object.keys(rooms).join(", ")}`}));
      return;
    }

    // ---------------- GLOBAL MESSAGE ----------------
    if(data.action==="global"){
      wss.clients.forEach(client=>{
        if(client.readyState===1) client.send(JSON.stringify({room:data.room, content:`[GLOBAL] ${data.message}`}));
      });
      return;
    }

    // ---------------- LOCKDOWN ----------------
    if(data.action==="lockdown"){
      wss.clients.forEach(client=>{
        if(client.readyState===1) client.send(JSON.stringify({lockdown:data.status}));
      });
      return;
    }

    // ---------------- MOD LOG ----------------
    if(data.action==="modLog"){
      wss.clients.forEach(client=>{
        if(client.readyState===1) client.send(JSON.stringify({room:data.room, content:data.message}));
      });
      return;
    }
  });
});
