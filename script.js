const input = document.getElementById("input");
const serverBox = document.getElementById("server-messages");
const localBox = document.getElementById("local-messages");
const typingBox = document.getElementById("typing-indicator");
const terminal = document.getElementById("terminal");
const sidebarButtons = document.querySelectorAll(".sidebar-button");

let username = localStorage.getItem("tt_username") || "Guest";
let currentRoom = "general";
let currentTheme = localStorage.getItem("tt_theme") || "classic";

/* ---------- APPLY THEME ---------- */
function applyTheme(theme) {
  terminal.className = "";
  terminal.classList.add(`theme-${theme}`);
  localStorage.setItem("tt_theme", theme);
  currentTheme = theme;
}
applyTheme(currentTheme);

/* ---------- PRINT FUNCTIONS ---------- */
function printServer(msg, system = false) {
  const div = document.createElement("div");
  if (system) {
    div.innerHTML = `<span style="
      background:linear-gradient(90deg,red,orange,yellow,green,cyan,blue,violet);
      -webkit-background-clip:text;
      color:transparent
    ">[SYSTEM] ${msg}</span>`;
  } else {
    div.textContent = msg;
  }
  serverBox.appendChild(div);
  serverBox.scrollTop = serverBox.scrollHeight;
}

function printLocal(msg) {
  const div = document.createElement("div");
  div.style.opacity = "0.7";
  div.textContent = msg;
  localBox.appendChild(div);
  localBox.scrollTop = localBox.scrollHeight;
}

/* ---------- FETCH MESSAGES ---------- */
async function fetchMessages() {
  try {
    const res = await fetch(`/api/messages?room=${currentRoom}`);
    const data = await res.json();
    serverBox.innerHTML = "";
    data.forEach(m => printServer(`[${m.user}] ${m.text}`, m.system));
  } catch { printLocal("⚠ Failed to fetch messages"); }
}

/* ---------- TYPING ---------- */
async function sendTyping() {
  try {
    await fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: currentRoom, user: username })
    });
  } catch {}
}

async function fetchTyping() {
  try {
    const res = await fetch(`/api/typing?room=${currentRoom}`);
    const data = await res.json();
    typingBox.textContent = data.user ? `${data.user} is typing...` : "";
  } catch {}
}

/* ---------- SEND MESSAGE ---------- */
async function sendMessage(text, system = false, userOverride = null) {
  try {
    await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: currentRoom,
        user: userOverride || username,
        text,
        system
      })
    });
  } catch { printLocal("⚠ Failed to send message"); }
}

/* ---------- INPUT ---------- */
input.addEventListener("input", sendTyping);

input.addEventListener("keydown", async e => {
  if (e.key !== "Enter") return;
  const text = input.value.trim();
  input.value = "";
  if (!text) return;

  /* ---------- COMMANDS ---------- */
  if (text === "!help") {
    printLocal("Available Commands:");
    printLocal("!usernameset <name>");
    printLocal("!profile");
    printLocal("!clear");
    printLocal("!theme <theme-name>");
    return;
  }

  if (text.startsWith("!usernameset ")) {
    username = text.slice(13);
    localStorage.setItem("tt_username", username);
    printLocal(`Username set to ${username}`);
    return;
  }

  if (text === "!clear") {
    localBox.innerHTML = "";
    printLocal("Terminal cleared");
    return;
  }

  if (text === "!profile") {
    printLocal(`Username: ${username}`);
    printLocal(`Room: ${currentRoom}`);
    printLocal(`Theme: ${currentTheme}`);
    return;
  }

  if (text.startsWith("!theme ")) {
    const themeName = text.slice(7).toLowerCase();
    const allowedThemes = ["classic","matrix","cyberpunk","ocean","amber","solarized","forest","candy","twilight","minimal","neon"];
    if (!allowedThemes.includes(themeName)) printLocal("Theme not found. Try: " + allowedThemes.join(", "));
    else { applyTheme(themeName); printLocal(`Theme changed to ${themeName}`); }
    return;
  }

  /* ---------- SEND AS MESSAGE ---------- */
  await sendMessage(text);
});

/* ---------- SIDEBAR BUTTONS ---------- */
sidebarButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    if (action === "themes") printLocal("Use !theme <theme-name> to change theme.");
    if (action === "report") printLocal("Report: Use Discord server link or type your report message.");
    if (action === "discord") window.open("https://discord.gg/kt4ySqjpbs", "_blank");
  });
});

/* ---------- LOOPS ---------- */
setInterval(fetchMessages, 1500);
setInterval(fetchTyping, 1000);

/* ---------- FAKE BOOT SCREEN ---------- */
window.addEventListener("load", () => {
  printLocal("Initializing Terminal Talker...");
  printLocal("Loading modules...");
  printLocal("Connecting to server...");
  printLocal("Ready!");
});
