const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let terminalUsername = localStorage.getItem("username") || "Guest";
let lastUserLine = null;
let isAdmin = false;
let isOwner = false;
let isBeta = false;
let mutedUsers = {};
let currentRoom = "general";
let lockdownActive = false;
const privateRooms = {}; // beta tester private rooms

/* ---------------- UTILITY ---------------- */
function print(html, track=false){
  const line=document.createElement("div");

  if(window.currentThemeIsNeon){
    line.innerHTML = `<span style="background: linear-gradient(90deg, #ff00ff, #00ffff, #00ff00, #ffff00, #ff0000); -webkit-background-clip: text; color: transparent;">${html}</span>`;
  } else {
    line.innerHTML = html;
  }

  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
  if(track) lastUserLine = line;
}

function printGradient(text) {
  const line = document.createElement("div");
  line.innerHTML = `<span style="background: linear-gradient(90deg, #00f, #0ff, #0f0, #ff0, #f00); -webkit-background-clip: text; color: transparent;">${text}</span>`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
  lastUserLine = line;
}

function badge(){ 
  if(isOwner) return "<span class='owner-badge'>[OWNER]</span>"; 
  if(isAdmin) return "<span class='admin-badge'>[ADMIN]</span>"; 
  if(isBeta) return "<span class='beta-badge'>[BETA]</span>"; 
  return ""; 
}

function roomBadge(){ return `<span class='room-badge'>[${currentRoom}]</span>`; }
function isMuted(user){ const t=mutedUsers[user]; if(!t) return false; if(Date.now()>t){ delete mutedUsers[user]; return false; } return true; }

/* ---------------- THEMES ---------------- */
const themes={
  green:{bg:"black",text:"lime"},
  amber:{bg:"black",text:"#ffbf00"},
  red:{bg:"black",text:"#ff4d4d"},
  blue:{bg:"black",text:"#4dd2ff"},
  reset:{bg:"black",text:"lime"},
  neon:{bg:"#000000",text:"neon"} // beta only
};

function applyTheme(name){
  const t=themes[name];
  if(!t) return false;

  if(name==="neon" && isBeta){
    document.documentElement.style.setProperty("--bg", t.bg);
    window.currentThemeIsNeon = true;
  } else {
    window.currentThemeIsNeon = false;
    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--text", t.text);
  }
  localStorage.setItem("theme", name);
  return true;
}

applyTheme(localStorage.getItem("theme")||"green");
print("Terminal Talker V4 online. Type !help");

/* ---------------- WEBSOCKET ---------------- */
const protocol=location.protocol==="https:"?"wss":"ws";
const ws=new WebSocket(`${protocol}://${location.host}/api/rooms`);

ws.onmessage=(event)=>{
  const data=JSON.parse(event.data);

  if(data.lockdown!==undefined){
    lockdownActive=data.lockdown;
    document.getElementById("lockdown-overlay").style.display=lockdownActive?"flex":"none";
  }

  if(data.room!==currentRoom) return;
  if(data.content) print(data.content);
};

/* ---------------- LOCKDOWN SUBMIT ---------------- */
document.getElementById("lockdown-submit").addEventListener("click", ()=>{
  const code=document.getElementById("lockdown-code").value;
  if(code==="749262001"){
    ws.send(JSON.stringify({action:"lockdown", status:false}));
    lockdownActive=false;
    document.getElementById("lockdown-overlay").style.display="none";
  }else alert("Incorrect code");
});

/* ---------------- COMMAND HANDLER ---------------- */
input.addEventListener("keydown", async (e)=>{
  if(e.key!=="Enter") return;
  if(lockdownActive){ e.preventDefault(); return; }
  const cmd=input.value.trim(); input.value="";
  if(!cmd) return;

  print(`[${terminalUsername}] ${badge()} ${roomBadge()} > ${cmd}`, true);

  if(cmd.startsWith("!")){

    // ---------------- HELP ----------------
    if(cmd === "!help"){
      print("💻 Terminal Talker V4 Commands 💻");
      print("!usernameset <name> — Set your username");
      print("!login admin01 — Login as Admin");
      print("!ownlogin STUC02526 — Login as Owner");
      print("!logout — Logout from Admin/Owner");
      print("!join <room> — Join a chat room");
      print("!rooms — List all available rooms");
      print("!theme green|amber|red|blue|reset — Change terminal theme");
      print("!theme neon — Beta only neon theme");
      print("!edit last <message> — Edit your last message");
      print("!mute <user> <seconds> — Admin only");
      print("!lockdown — Admin only");
      print("!system <message> — Admin only system message");
      print("!saysystem <message> — Owner only System message");
      print("!resetserver — Owner only, resets all messages");
      print("!history1 — Owner only, view chat history");
      print("!history2 — Owner only, view mod action history");
      print("!globalmessage <message> — Owner only, broadcast global message");
      print("!makeroom <roomName> <password> — Beta only, create private room");
      print("!pjoin <roomName> <password> — Join private room with password");
      print("!betalogin <code> — Activate Beta Tester badge");
      print("Normal messages — Type anything without ! to chat in the room");
      return;
    }

    // ---------------- USERNAME ----------------
    if(cmd.startsWith("!usernameset ")){ terminalUsername=cmd.slice(13).trim().slice(0,20); localStorage.setItem("username",terminalUsername); print(`Username set to "${terminalUsername}"`); return; }
    if(cmd==="!login admin01"){ isAdmin=true; isOwner=false; print("Admin logged in."); return;}
    if(cmd==="!ownlogin STUC02526"){ isAdmin=true; isOwner=true; print("Owner logged in."); return;}
    if(cmd==="!logout"){ isAdmin=false; isOwner=false; print("Logged out."); return;}
    if(cmd.startsWith("!theme ")){ if(!applyTheme(cmd.slice(7))) print("Unknown theme."); else print(`Theme set to ${cmd.slice(7)}`); return;}
    if(cmd.startsWith("!mute ")){ if(!isAdmin){print("Admin only."); return;} const parts=cmd.split(" "); const user=parts[1]; const dur=parseInt(parts[2],10); if(!user||isNaN(dur)){print("Usage: !mute <user> <seconds>"); return;} mutedUsers[user]=Date.now()+dur*1000; ws.send(JSON.stringify({action:"modLog", room:currentRoom, message:`[MOD] ${terminalUsername} muted ${user} for ${dur} seconds`})); print(`[MOD] ${terminalUsername} muted ${user} for ${dur} seconds`); return;}
    if(cmd.startsWith("!join ")){ currentRoom=cmd.slice(6).trim(); ws.send(JSON.stringify({action:"join", room:currentRoom})); print(`Joined room "${currentRoom}"`); return;}
    if(cmd==="!rooms"){ ws.send(JSON.stringify({action:"listRooms"})); return;}
    if(cmd==="!history1"&&isOwner){ ws.send(JSON.stringify({action:"history1", room:currentRoom})); return;}
    if(cmd==="!history2"&&isOwner){ ws.send(JSON.stringify({action:"history2", room:currentRoom})); return;}
    if(cmd.startsWith("!globalmessage ")&&isOwner){ ws.send(JSON.stringify({action:"global", room:currentRoom, message:cmd.slice(15)})); return;}
    if(cmd==="!lockdown" && isAdmin){ ws.send(JSON.stringify({action:"lockdown", status:true})); print("Lockdown activated for all users!"); return;}
    if(cmd.startsWith("!system ")){ if(!isAdmin){print("Admin only."); return;} print(`<span class="system">[SYSTEM] ${cmd.slice(8)}</span>`); return;}
    if(cmd.startsWith("!edit last ")){ if(!lastUserLine){ print("Nothing to edit."); return;} lastUserLine.innerHTML=`[${terminalUsername}] ${badge()} ${roomBadge()} > ${cmd.slice(11)}`; return;}

    // ---------------- BETA LOGIN ----------------
    if(cmd.startsWith("!betalogin ")){
      const code = cmd.slice(11).trim();
      if(code==="Beta#027"){ isBeta=true; print("✅ Beta Tester badge activated!"); } 
      else print("❌ Invalid beta code.");
      return;
    }

    // ---------------- MAKE ROOM (BETA ONLY) ----------------
    if(cmd.startsWith("!makeroom ")){
      if(!isBeta){ print("Beta Tester only command."); return; }
      const parts=cmd.slice(10).trim().split(" ");
      const roomName=parts[0], password=parts[1];
      if(!roomName||!password){ print("Usage: !makeroom <roomName> <password>"); return; }
      if(privateRooms[roomName]){ print("Room already exists!"); return; }
      privateRooms[roomName]=password;
      ws.send(JSON.stringify({action:"join", room:roomName}));
      currentRoom=roomName;
      print(`✅ Private room "${roomName}" created! Share password to join: ${password}`);
      return;
    }

    // ---------------- JOIN PRIVATE ROOM ----------------
    if(cmd.startsWith("!pjoin ")){
      const parts=cmd.slice(7).trim().split(" ");
      const roomName=parts[0], password=parts[1];
      if(!roomName||!password){ print("Usage: !pjoin <roomName> <password>"); return; }
      if(privateRooms[roomName]&&privateRooms[roomName]===password){
        currentRoom=roomName;
        ws.send(JSON.stringify({action:"join", room:roomName}));
        print(`✅ Joined private room "${roomName}"`);
      } else { print("❌ Incorrect room name or password"); }
      return;
    }

    // ---------------- SAY SYSTEM ----------------
    if(cmd.startsWith("!saysystem ")){
      if(!isOwner){ print("Owner only command."); return; }
      const message = cmd.slice(11).trim();
      if(!message){ print("Usage: !saysystem <message>"); return; }
      printGradient(`[System] ${message}`);
      ws.send(JSON.stringify({ action:"say", room:currentRoom, user:"System", message }));
      return;
    }

    // ---------------- RESET SERVER ----------------
    if(cmd==="!resetserver"){
      if(!isOwner){ print("Owner only command."); return; }
      ws.send(JSON.stringify({ action:"resetServer" }));
      print("✅ Server has been reset. All messages cleared!");
      return;
    }

    print("Unknown command."); return;
  }

  // ---------------- NORMAL MESSAGE ----------------
  if(isMuted(terminalUsername)){ print("You are muted."); return; }
  ws.send(JSON.stringify({action:"say", room:currentRoom, user:terminalUsername, message:cmd}));
});


---

⭐ api/rooms.js

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
