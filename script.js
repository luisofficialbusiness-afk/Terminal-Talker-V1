const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let terminalUsername = localStorage.getItem("username") || "Guest";
let isAdmin = false;
let isOwner = false;
let lastUserLine = null;

function print(html, track = false) {
  const line = document.createElement("div");
  line.innerHTML = html;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;

  if (track) lastUserLine = line;
}

function badge() {
  if (isOwner) return "<span class='owner-badge'>[OWNER]</span>";
  if (isAdmin) return "<span class='admin-badge'>[ADMIN]</span>";
  return "";
}

/* ================= THEMES ================= */

const themes = {
  green: { bg: "black", text: "lime" },
  amber: { bg: "black", text: "#ffbf00" },
  red: { bg: "black", text: "#ff4d4d" },
  blue: { bg: "black", text: "#4dd2ff" },
  reset: { bg: "black", text: "lime" }
};

function applyTheme(name) {
  const theme = themes[name];
  if (!theme) return false;

  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--text", theme.text);
  localStorage.setItem("theme", name);
  return true;
}

// Load saved theme
applyTheme(localStorage.getItem("theme") || "green");

print("Terminal online. Type !help");

input.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  const cmd = input.value.trim();
  input.value = "";

  print(
    `[${terminalUsername}] ${badge()} &gt; ${cmd}`,
    true
  );

  /* ================= HELP ================= */

  if (cmd === "!help") {
    print("!usernameset <name>");
    print("!login admin01");
    print("!ownlogin STUC02526");
    print("!logout");
    print("!say <msg>");
    print("!system <msg> (ADMIN)");
    print("!edit last <msg>");
    print("!theme green|amber|red|blue|reset");
    return;
  }

  /* ================= USERNAME ================= */

  if (cmd.startsWith("!usernameset ")) {
    terminalUsername = cmd.slice(13).trim().slice(0, 20);
    localStorage.setItem("username", terminalUsername);
    print(`Username set to "${terminalUsername}"`);
    return;
  }

  /* ================= LOGIN ================= */

  if (cmd === "!login admin01") {
    isAdmin = true;
    isOwner = false;
    print("Admin logged in.");
    return;
  }

  if (cmd === "!ownlogin STUC02526") {
    isAdmin = true;
    isOwner = true;
    print("Owner logged in.");
    return;
  }

  if (cmd === "!logout") {
    isAdmin = false;
    isOwner = false;
    print("Logged out.");
    return;
  }

  /* ================= SAY ================= */

  if (cmd.startsWith("!say ")) {
    if (!isAdmin) return print("Admin only.");

    await fetch("/api/say", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `[${terminalUsername}] ${cmd.slice(5)}`
      })
    });

    print("Message sent.");
    return;
  }

  /* ================= SYSTEM MESSAGE ================= */

  if (cmd.startsWith("!system ")) {
    if (!isAdmin) return print("Admin only.");

    const msg = cmd.slice(8);
    print(`<span class="system">[SYSTEM] ${msg}</span>`);
    return;
  }

  /* ================= EDIT LAST ================= */

  if (cmd.startsWith("!edit last ")) {
    if (!lastUserLine) return print("Nothing to edit.");

    lastUserLine.innerHTML =
      `[${terminalUsername}] ${badge()} &gt; ${cmd.slice(11)}`;
    return;
  }

  /* ================= THEME ================= */

  if (cmd.startsWith("!theme ")) {
    const name = cmd.slice(7);
    if (!applyTheme(name)) {
      print("Unknown theme.");
    } else {
      print(`Theme set to ${name}`);
    }
    return;
  }

  print("Unknown command.");
});
