const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let terminalUsername = localStorage.getItem("username") || "Guest";
let lastUserLine = null;
let isAdmin = false;
let isOwner = false;
let mutedUsers = {};
let currentRoom = "general";
let lockdownActive = false;

/* ---------------- UTILITY ---------------- */
function print(html, track=false){
  const line=document.createElement("div");
  line.innerHTML=html;
  terminal.appendChild(line);
  terminal.scrollTop=terminal.scrollHeight;
  if(track) lastUserLine=line;
}
function badge(){ if(isOwner) return "<span class='owner-badge'>[OWNER]</span>"; if(isAdmin) return "<span class='admin-badge'>[ADMIN]</span>"; return ""; }
function roomBadge(){ return `<span class='room-badge'>[${currentRoom}]</span>`; }
function isMuted(user){ const t=mutedUsers[user]; if(!t) return false; if(Date.now()>t){ delete mutedUsers[user]; return false; } return true; }

/* ---------------- THEMES ---------------- */
const themes={green:{bg:"black",text:"lime"},amber:{bg:"black",text:"#ffbf00"},red:{bg:"black",text:"#ff4d4d"},blue:{bg:"black",text:"#4dd2ff"},reset:{bg:"black",text:"lime"}};
function applyTheme(name){ const t=themes[name]; if(!t) return false; document.documentElement.style.setProperty("--bg",t.bg); document.documentElement.style.setProperty("--text",t.text); localStorage.setItem("theme",name); return true;}
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
    if(cmd === "!help"){
      print("💻 Terminal Talker V4 Commands 💻");
      print("!usernameset <name> — Set your username");
      print("!login admin01 — Login as Admin");
      print("!ownlogin STUC02526 — Login as Owner");
      print("!logout — Logout from Admin/Owner");
      print("!join <room> — Join a chat room");
      print("!rooms — List all available rooms");
      print("!theme green|amber|red|blue|reset — Change terminal theme");
      print("!edit last <message> — Edit your last message");
      print("!mute <user> <seconds> — Admin only");
      print("!lockdown — Admin only");
      print("!system <message> — Admin only system message");
      print("!history1 — Owner only, view chat history");
      print("!history2 — Owner only, view mod log history");
      print("!globalmessage <message> — Owner only, broadcast global message");
      print("Normal messages — Type anything without ! to chat in the room");
      return;
    }

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
    
    print("Unknown command."); return;
  }

  if(isMuted(terminalUsername)){ print("You are muted."); return; }
  ws.send(JSON.stringify({action:"say", room:currentRoom, user:terminalUsername, message:cmd}));
});
