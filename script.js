const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let isAdmin = false;
let isOwner = false;
let terminalUsername = "Guest";
let lastMessageTimestamp = 0;
let modActions = [];
let globalMessages = [];

function print(text) {
  terminal.innerHTML += text + "<br>";
  terminal.scrollTop = terminal.scrollHeight;
}

function printBadge() {
  if (isOwner) return "<span class='owner-badge'>[OWNER]</span>";
  if (isAdmin) return "<span class='admin-badge'>[ADMIN]</span>";
  return "";
}

print("Terminal online. Type !help");

setInterval(fetchMessages, 3000);

async function fetchMessages() {
  const res = await fetch("/api/messages");
  const data = await res.json();

  data.messages.forEach(msg => {
    if (msg.timestamp > lastMessageTimestamp) {
      print(msg.content);
      lastMessageTimestamp = msg.timestamp;
      globalMessages.push(msg.content);
    }
  });
}

input.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  const cmd = input.value.trim();
  input.value = "";

  print(`<span class="username">[${terminalUsername}]</span> ${printBadge()} &gt; ${cmd}`);

  if (!cmd) return;

  /* ================= USERNAME SET ================= */
  if (cmd.startsWith("!usernameset ")) {
    const name = cmd.slice(13).trim();
    if (!name || name.length > 20) {
      print("Invalid username (1–20 chars).");
      return;
    }
    terminalUsername = name;
    print(`Username set to "${terminalUsername}"`);
    return;
  }

  /* ================= HELP ================= */
  if (cmd === "!help") {
    print("Commands:");
    print("!usernameset <name>");
    print("!login admin01");
    print("!ownlogin STUC02526");
    print("!logout");
    print("!say <message>");
    print("!mod kick/ban <users>");
    print("!history1 (OWNER)");
    print("!history2 (OWNER)");
    print("!globalmessage <msg> (OWNER)");
    return;
  }

  /* ================= LOGIN ================= */
  if (cmd.startsWith("!login ")) {
    if (cmd.slice(7) === "admin01") {
      isAdmin = true;
      isOwner = false;
      print("Admin login successful.");
    } else {
      print("Wrong admin password.");
    }
    return;
  }

  if (cmd.startsWith("!ownlogin ")) {
    if (cmd.slice(10) === "STUC02526") {
      isOwner = true;
      isAdmin = true;
      print("Owner login successful.");
    } else {
      print("Wrong owner password.");
    }
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
    if (!isAdmin) {
      print("Admin only.");
      return;
    }

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

  /* ================= MODERATION ================= */
  if (cmd.startsWith("!mod ")) {
    if (!isAdmin) {
      print("Admin only.");
      return;
    }

    const parts = cmd.split(" ");
    const action = parts[1];
    const users = parts.slice(2);

    users.forEach(async user => {
      modActions.push(`${action.toUpperCase()} ${user}`);
      await fetch("/api/say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[MOD] ${terminalUsername} ${action}ed ${user}`,
          webhook: "https://discord.com/api/webhooks/1458229518861861081/RxK9QPitWn61df7BuSuXDjc-_BPvlHcpr8ORa5S-OmWU48HUpzuHbTu8yx3jnqbSTRDD"
        })
      });
    });

    print("Moderation action sent.");
    return;
  }

  /* ================= OWNER ================= */
  if (cmd === "!history1" && isOwner) {
    globalMessages.forEach(m => print(m));
    return;
  }

  if (cmd === "!history2" && isOwner) {
    modActions.forEach(m => print(m));
    return;
  }

  if (cmd.startsWith("!globalmessage ") && isOwner) {
    await fetch("/api/say", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `[GLOBAL] ${cmd.slice(15)}`
      })
    });
    print("Global message sent.");
    return;
  }

  print("Unknown command.");
});

