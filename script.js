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

  // Lockdown
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
input.addEventListener("keydown", async(e)=>{
  if(e.key!=="Enter") return;
  if(lockdownActive){ e.preventDefault(); return; } // block during lockdown
  const cmd=input.value.trim(); input.value="";
  print(`[${terminalUsername}] ${badge()} ${roomBadge()} &gt; ${cmd}`,true);
  if(!cmd) return;

  if(cmd==="!help"){
    print("!usernameset <name>");
    print("!login admin01");
    print("!ownlogin STUC02526");
    print("!logout");
    print("!say <msg>");
    print("!system <msg> (ADMIN)");
    print("!edit last <msg>");
    print("!theme green|amber|red|blue|reset");
    print("!mute <user> <seconds> (ADMIN)");
    print("!join <room>");
    print("!rooms");
    print("!history1 (OWNER)");
    print("!history2 (OWNER)");
    print("!globalmessage <msg> (OWNER)");
    print("!lockdown (ADMIN)");
    return;
  }

  /* ---------------- USERNAME ---------------- */
  if(cmd.startsWith("!usernameset ")){ terminalUsername=cmd.slice(13).trim().slice(0,20); localStorage.setItem("username",terminalUsername); print(`Username set to "${terminalUsername}"`); return; }

  /* ---------------- LOGIN ---------------- */
  if(cmd==="!login admin01"){ isAdmin=true; isOwner=false; print("Admin logged in."); return;}
  if(cmd==="!ownlogin STUC02526"){ isAdmin=true; isOwner=true; print("Owner logged in."); return;}
  if(cmd==="!logout"){ isAdmin=false; isOwner=false; print("Logged out."); return;}

  /* ---------------- JOIN / ROOMS ---------------- */
  if(cmd.startsWith("!join ")){
    currentRoom = cmd.slice(6).trim();
    ws.send(JSON.stringify({action:"join", room:currentRoom}));
    print(`Joined room "${currentRoom}"`);
    return;
  }
  if(cmd==="!rooms"){
    ws.send(JSON.stringify({action:"listRooms"}));
    return;
  }

  /* ---------------- SAY ---------------- */
  if(cmd.startsWith("!say ")){
    if(!isAdmin) return print("Admin only.");
    if(isMuted(terminalUsername)) return print("You are muted.");
    ws.send(JSON.stringify({action:"say", room:currentRoom, user:terminalUsername, message:cmd.slice(5)}));
    return;
  }

  /* ---------------- SYSTEM ---------------- */
  if(cmd.startsWith("!system ")){ if(!isAdmin) return print("Admin only."); print(`<span class="system">[SYSTEM] ${cmd.slice(8)}</span>`); return; }

  /* ---------------- EDIT ---------------- */
  if(cmd.startsWith("!edit last ")){ if(!lastUserLine) return print("Nothing to edit."); lastUserLine.innerHTML=`[${terminalUsername}] ${badge()} ${roomBadge()} &gt; ${cmd.slice(11)}`; return;}

  /* ---------------- THEME ---------------- */
  if(cmd.startsWith("!theme ")){ if(!applyTheme(cmd.slice(7))) print("Unknown theme."); else print(`Theme set to ${cmd.slice(7)}`); return;}

  /* ---------------- MUTE ---------------- */
  if(cmd.startsWith("!mute ")){
    if(!isAdmin) return print("Admin only.");
    const parts = cmd.split(" "); const user=parts[1]; const dur=parseInt(parts[2],10);
    if(!user||isNaN(dur)) return print("Usage: !mute <user> <seconds>");
    mutedUsers[user]=Date.now()+dur*1000;
    ws.send(JSON.stringify({action:"modLog", room:currentRoom, message:`[MOD] ${terminalUsername} muted ${user} for ${dur} seconds`}));
    print(`[MOD] ${terminalUsername} muted ${user} for ${dur} seconds`);
    return;
  }

  /* ---------------- HISTORY / GLOBAL ---------------- */
  if(cmd==="!history1"&&isOwner){ ws.send(JSON.stringify({action:"history1", room:currentRoom})); return;}
  if(cmd==="!history2"&&isOwner){ ws.send(JSON.stringify({action:"history2", room:currentRoom})); return;}
  if(cmd.startsWith("!globalmessage ")&&isOwner){ ws.send(JSON.stringify({action:"global", room:currentRoom, message:cmd.slice(15)})); return;}

  /* ---------------- LOCKDOWN ---------------- */
  if(cmd==="!lockdown" && isAdmin){
    ws.send(JSON.stringify({action:"lockdown", status:true}));
    print("Lockdown activated for all users!");
    return;
  }

  print("Unknown command.");
});
