import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ noServer:true });
let rooms = { general: [] };
let messages = {};
let modLogs = {};
let lockdown = false;

function isAdmin(ws){ return ws.isAdmin; } // simple placeholder if you implement per-user auth

wss.on("connection", ws => {
  ws.currentRoom = "general";
  ws.isAdmin=false; // default
  if(!rooms.general) rooms.general=[]; 
  rooms.general.push(ws);

  ws.on("message", data=>{
    const d=JSON.parse(data);
    const room=d.room || ws.currentRoom;

    switch(d.action){
      case "join":
        if(ws.currentRoom && rooms[ws.currentRoom]) rooms[ws.currentRoom]=rooms[ws.currentRoom].filter(x=>x!==ws);
        ws.currentRoom=room;
        if(!rooms[room]) rooms[room]=[];
        rooms[room].push(ws);
        break;

      case "say":
        const msgObj={content:`[${d.user}] ${d.message}`, timestamp:Date.now()};
        if(!messages[room]) messages[room]=[];
        messages[room].push(msgObj);
        rooms[room].forEach(client=>{ if(client.readyState===client.OPEN) client.send(JSON.stringify(msgObj)); });
        break;

      case "modLog":
        const log={content:d.message,timestamp:Date.now()};
        if(!modLogs[room]) modLogs[room]=[];
        modLogs[room].push(log);
        rooms[room].forEach(client=>{ if(client.readyState===client.OPEN) client.send(JSON.stringify(log)); });
        break;

      case "listRooms":
        ws.send(JSON.stringify({content:`Rooms: ${Object.keys(rooms).join(", ")}`, room:ws.currentRoom}));
        break;

      case "history1":
        (messages[room]||[]).forEach(m=>ws.send(JSON.stringify({content:m.content, room})));
        break;

      case "history2":
        (modLogs[room]||[]).forEach(m=>ws.send(JSON.stringify({content:m.content, room})));
        break;

      case "global":
        const gm={content:`[GLOBAL] ${d.message}`, timestamp:Date.now()};
        if(!messages[room]) messages[room]=[];
        messages[room].push(gm);
        rooms[room].forEach(client=>{ if(client.readyState===client.OPEN) client.send(JSON.stringify(gm)); });
        break;

      case "lockdown":
        if(!isAdmin(ws)) break;
        lockdown=d.status;
        wss.clients.forEach(client=>{ if(client.readyState===client.OPEN) client.send(JSON.stringify({lockdown})); });
        break;
    }
  });

  ws.on("close", ()=>{
    if(ws.currentRoom && rooms[ws.currentRoom]) rooms[ws.currentRoom]=rooms[ws.currentRoom].filter(x=>x!==ws);
  });
});

export default wss;
