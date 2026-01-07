const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

/* ---------------- CONFIG ---------------- */
const WEBSITE_OWNER_PASS = "O#0363168";
const WEBSITE_ADMIN_PASS = "admin01";
const BETA_PASS = "BETA2026";
const EARLY_ACCESS_OPEN = true;

/* ---------------- STATE ---------------- */
let username = localStorage.getItem("tt_username") || "Guest";
let roles = {
  websiteOwner: false,
  websiteAdmin: false,
  roomOwner: false,
  roomAdmin: false
};
let isBeta = false;
let neonTheme = false;
let isEarlyUser = localStorage.getItem("tt_early") === "true";
let currentRoom = "general";
let rooms = ["general"];

/* ---------------- EARLY USER ---------------- */
if (!localStorage.getItem("tt_seen") && EARLY_ACCESS_OPEN) {
  localStorage.setItem("tt_early", "true");
  localStorage.setItem("tt_seen", "true");
  isEarlyUser = true;
}

/* ---------------- BADGE ---------------- */
function badge() {
  if (roles.websiteOwner) return "[OWNER]";
  if (roles.websiteAdmin) return "[ADMIN]";
  if (roles.roomOwner) return "[R-OWNER]";
  if (roles.roomAdmin) return "[R-ADMIN]";
  if (isBeta) return "[BETA]";
  if (isEarlyUser) return "[EARLY]";
  return "";
}

/* ---------------- PRINT ---------------- */
function print(msg, system = false) {
  const div = document.createElement("div");
  if (system) {
    div.innerHTML = `<span style="background:linear-gradient(90deg,red,orange,yellow,green,cyan,blue,violet);
      -webkit-background-clip:text;color:transparent">[SYSTEM] ${msg}</span>`;
  } else if (neonTheme) {
    div.innerHTML = `<span style="background:linear-gradient(90deg,#ff00ff,#00ffff,#00ff00);
      -webkit-background-clip:text;color:transparent">${msg}</span>`;
  } else {
    div.textContent = msg;
  }
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

/* ---------------- FETCH MESSAGES ---------------- */
async function fetchMessages() {
  try {
    const res = await fetch(`/api/messages?room=${currentRoom}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    const data = await res.json();
    terminal.innerHTML = "";
    data.forEach(m => {
      print(`[${m.user}] ${m.text}`, m.system);
    });
  } catch (err) {
    print("[SYSTEM] Could not fetch messages", true);
    console.error(err);
  }
}
setInterval(fetchMessages, 1500);

/* ---------------- SEND ---------------- */
async function send(text, system = false, userOverride = null) {
  try {
    await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: currentRoom,
        user: (userOverride || username) + " " + badge(),
        text,
        system
      })
    });
  } catch (err) {
    print("[SYSTEM] Could not send message", true);
    console.error(err);
  }
}

/* ---------------- INPUT HANDLER ---------------- */
input.addEventListener("keydown", async e => {
  if (e.key !== "Enter") return;

  const text = input.value.trim();
  input.value = "";
  if (!text) return;

  /* ---------------- COMMANDS ---------------- */
  if (text.startsWith("!")) {
    // Help
    if (text === "!help") {
      print("Commands:");
      print("!usernameset <name>");
      print("!login - Login as Admin");
      print("!ownlogin - Login as Website Owner");
      print("!betalogin BETA2026 - Get Beta Features");
      print("!theme neon");
      print("!makeroom <password> (Beta only)");
      print("!pjoin <password>");
      print("!saysystem <msg> (R-Owner and Website Owner only)");
      print("!resetserver (Website Owner only)");
      print("!mute <username>");
      return;
    }

    // Username
    if (text.startsWith("!usernameset ")) {
      username = text.slice(13);
      localStorage.setItem("tt_username", username);
      print(`Username set to ${username}`);
      return;
    }

    // Website Admin
    if (text === `!login ${WEBSITE_ADMIN_PASS}`) {
      roles.websiteAdmin = true;
      print("Website Admin logged in");
      return;
    }

    // Website Owner
    if (text === `!ownlogin ${WEBSITE_OWNER_PASS}`) {
      roles.websiteOwner = true;
      roles.websiteAdmin = true;
      print("Website Owner logged in");
      return;
    }

    // Beta Login
    if (text === `!betalogin ${BETA_PASS}`) {
      isBeta = true;
      print("Beta tester activated");
      return;
    }

    // Neon Theme
    if (text === "!theme neon") {
      if (!isBeta) return print("Beta only feature");
      neonTheme = true;
      print("Neon theme enabled");
      return;
    }

    // Say System
    if (text.startsWith("!saysystem ")) {
      if (!roles.websiteOwner) return print("Owner only");
      await send(text.slice(11), true, "System");
      return;
    }

    // Reset Server
    if (text === "!resetserver") {
      if (!roles.websiteOwner) return print("Owner only");
      await send("Server reset by owner", true, "System");
      return;
    }

    // Mute
    if (text.startsWith("!mute ")) {
      const target = text.slice(6);
      if (!roles.websiteAdmin && !roles.roomOwner && !roles.roomAdmin) return print("No permission");
      print(`${target} muted (demo)`); // placeholder
      return;
    }

    print("Unknown command");
    return;
  }

  /* ---------------- NORMAL MESSAGE ---------------- */
  await send(text);
});
