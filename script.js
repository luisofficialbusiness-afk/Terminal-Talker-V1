const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

/* ---------------- STATE ---------------- */
let username = localStorage.getItem("username") || "Guest";
let currentRoom = "general";
let isAdmin = false;
let isOwner = false;
let isBeta = false;
let lockdownActive = false;
let lastLine = null;
const privateRooms = {};
let neonTheme = false;

/* ---------------- PRINT ---------------- */
function print(msg, track = false) {
  const div = document.createElement("div");

  if (neonTheme) {
    div.innerHTML = `<span style="background:linear-gradient(90deg,#ff00ff,#00ffff,#00ff00,#ffff00,#ff0000);
      -webkit-background-clip:text;color:transparent">${msg}</span>`;
  } else {
    div.innerHTML = msg;
  }

  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
  if (track) lastLine = div;
}

/* ---------------- BADGES ---------------- */
function badge() {
  if (isOwner) return "<span style='color:yellow'>[OWNER]</span>";
  if (isAdmin) return "<span style='color:cyan'>[ADMIN]</span>";
  if (isBeta) return "<span style='color:purple'>[BETA]</span>";
  return "";
}

/* ---------------- WEBSOCKET ---------------- */
const protocol = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${location.host}/api/rooms`);

ws.onopen = () => {
  print("✅ Connected to Terminal Talker V4");
};

ws.onerror = () => {
  print("❌ WebSocket error – messages may not send");
};

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);

  if (data.lockdown !== undefined) {
    lockdownActive = data.lockdown;
    return;
  }

  if (data.room === currentRoom && data.content) {
    print(data.content);
  }
};

/* ---------------- INPUT HANDLER (FIXED) ---------------- */
input.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const text = input.value.trim();
  input.value = "";
  if (!text) return;

  if (lockdownActive) {
    print("⚠ Terminal Talker is in lockdown.");
    return;
  }

  print(`[${username}] ${badge()} [${currentRoom}] > ${text}`, true);

  /* -------- COMMANDS -------- */
  if (text.startsWith("!")) {

    if (text === "!help") {
      print("📘 Commands:");
      print("!usernameset <name>");
      print("!login admin01");
      print("!ownlogin STUC02526");
      print("!logout");
      print("!betalogin BETA2026");
      print("!theme neon (beta only)");
      print("!makeroom <room> <pass>");
      print("!pjoin <room> <pass>");
      print("!saysystem <msg> (owner)");
      print("!resetserver (owner)");
      return;
    }

    if (text.startsWith("!usernameset ")) {
      username = text.slice(13).trim();
      localStorage.setItem("username", username);
      print(`Username set to ${username}`);
      return;
    }

    if (text === "!login admin01") {
      isAdmin = true;
      print("Admin logged in");
      return;
    }

    if (text === "!ownlogin STUC02526") {
      isAdmin = true;
      isOwner = true;
      print("Owner logged in");
      return;
    }

    if (text === "!logout") {
      isAdmin = false;
      isOwner = false;
      isBeta = false;
      neonTheme = false;
      print("Logged out");
      return;
    }

    if (text === "!betalogin BETA2026") {
      isBeta = true;
      print("🧪 Beta Tester activated");
      return;
    }

    if (text === "!theme neon") {
      if (!isBeta) return print("Beta only theme");
      neonTheme = true;
      print("🌈 Neon theme enabled");
      return;
    }

    if (text.startsWith("!makeroom ")) {
      if (!isBeta) return print("Beta only command");
      const [, room, pass] = text.split(" ");
      if (!room || !pass) return print("Usage: !makeroom <room> <pass>");
      privateRooms[room] = pass;
      currentRoom = room;
      ws.send(JSON.stringify({ action: "join", room }));
      print(`🔒 Private room "${room}" created`);
      return;
    }

    if (text.startsWith("!pjoin ")) {
      const [, room, pass] = text.split(" ");
      if (privateRooms[room] !== pass) return print("❌ Wrong password");
      currentRoom = room;
      ws.send(JSON.stringify({ action: "join", room }));
      print(`✅ Joined ${room}`);
      return;
    }

    if (text.startsWith("!saysystem ")) {
      if (!isOwner) return print("Owner only");
      const msg = text.slice(11);
      ws.send(JSON.stringify({
        action: "say",
        room: currentRoom,
        user: "System",
        message: msg
      }));
      print(`🌐 [System] ${msg}`);
      return;
    }

    if (text === "!resetserver") {
      if (!isOwner) return print("Owner only");
      ws.send(JSON.stringify({ action: "resetServer" }));
      print("♻ Server reset");
      return;
    }

    print("❓ Unknown command");
    return;
  }

  /* -------- NORMAL MESSAGE (FIXED) -------- */
  if (ws.readyState !== 1) {
    print("❌ Not connected to server");
    return;
  }

  ws.send(JSON.stringify({
    action: "say",
    room: currentRoom,
    user: username,
    message: text
  }));
});
