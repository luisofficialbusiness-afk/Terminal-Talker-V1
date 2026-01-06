const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let isAdmin = false;
let isOwner = false;
let lastMessageTimestamp = 0;
let modActions = [];
let globalMessages = [];

function print(text) {
  terminal.innerHTML += text + "<br>";
  terminal.scrollTop = terminal.scrollHeight;
}

function printRoleBadge() {
  if (isOwner) print("<span class='owner-badge'>[OWNER]</span>");
  else if (isAdmin) print("<span class='admin-badge'>[ADMIN]</span>");
}

print("Terminal online. Type !help");

setInterval(fetchMessages, 3000);

async function fetchMessages() {
  try {
    const res = await fetch("/api/messages");
    const data = await res.json();

    data.messages.forEach(msg => {
      if (msg.timestamp > lastMessageTimestamp) {
        print(msg.content);
        lastMessageTimestamp = msg.timestamp;
        globalMessages.push(msg.content);
      }
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
  }
}

input.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  const cmd = input.value.trim();
  input.value = "";
  print("> " + cmd);
  printRoleBadge();

  if (!cmd) return;

  // HELP
  if (cmd === "!help") {
    print("Commands:");
    print("!help - show commands");
    print("!login <password> - login as admin");
    print("!ownlogin <password> - login as owner");
    print("!logout - logout");
    print("!clear - clear terminal");
    print("!ping - test terminal");
    print("!echo <msg> - print message");
    print("!time - server time (admin only)");
    print("!whoami - visitor info (admin only)");
    print("!say <msg> - send to Discord (admin only)");
    print("!mod <action> <username1> <username2> ... - moderation (admin only)");
    print("Owner commands:");
    print("!history1 - see message history");
    print("!history2 - see mod action history");
    print("!globalmessage <msg> - send global message");
    return;
  }

  // LOGIN - Admin
  if (cmd.startsWith("!login ")) {
    const pass = cmd.slice(7);
    if (pass === "admin01") {
      isAdmin = true;
      isOwner = false;
      print("Login successful. Admin access granted.");
      printRoleBadge();
    } else {
      print("Login failed. Incorrect password.");
    }
    return;
  }

  // LOGIN - Owner
  if (cmd.startsWith("!ownlogin ")) {
    const pass = cmd.slice(10);
    if (pass === "STUC02526") {
      isOwner = true;
      isAdmin = true;
      print("Login successful. Owner access granted.");
      printRoleBadge();
    } else {
      print("Login failed. Incorrect password.");
    }
    return;
  }

  // LOGOUT
  if (cmd === "!logout") {
    if (!isAdmin && !isOwner) print("You are not logged in.");
    else {
      isAdmin = false;
      isOwner = false;
      print("Logged out. Access revoked.");
    }
    return;
  }

  // CLEAR
  if (cmd === "!clear") {
    terminal.innerHTML = "";
    return;
  }

  // PING
  if (cmd === "!ping") {
    print("pong 🟢");
    return;
  }

  // ECHO
  if (cmd.startsWith("!echo ")) {
    print(cmd.slice(6));
    return;
  }

  // Admin/Owner permission check
  const adminCmds = ["!say", "!time", "!whoami", "!mod"];
  const ownerCmds = ["!history1", "!history2", "!globalmessage"];
  if (!isAdmin && adminCmds.some(c => cmd.startsWith(c))) {
    print("Permission denied. Admin only.");
    return;
  }
  if (!isOwner && ownerCmds.some(c => cmd.startsWith(c))) {
    print("Permission denied. Owner only.");
    return;
  }

  // SAY
  if (cmd.startsWith("!say ")) {
    await fetch("/api/say", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: cmd.slice(5) })
    });
    print("Message sent to Discord.");
    return;
  }

  // TIME & WHOAMI
  if (cmd === "!time") {
    print(new Date().toLocaleString());
    return;
  }
  if (cmd === "!whoami") {
    print("Visitor info: simulated");
    return;
  }

  // MODERATION
  if (cmd.startsWith("!mod ")) {
    const parts = cmd.split(" ");
    if (parts.length < 3) {
      print("Usage: !mod <action> <username1> <username2> ...");
    } else {
      const action = parts[1].toLowerCase();
      const usernames = parts.slice(2);

      if (action === "kick" || action === "ban") {
        usernames.forEach(async (username) => {
          print(`User "${username}" has been ${action}ed (simulated).`);

          // Store mod action
          modActions.push(`[${new Date().toLocaleString()}] Admin ${action}ed user ${username}`);
          if (modActions.length > 100) modActions.shift();

          // Main channel webhook
          await fetch("/api/say", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `[MODERATION] Admin ${action}ed user ${username}` })
          });

          // Mod-log webhook
          await fetch("/api/say", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `[LOG] Admin ${action}ed user ${username} at ${new Date().toLocaleString()}`,
              webhook: "https://discord.com/api/webhooks/1458229518861861081/RxK9QPitWn61df7BuSuXDjc-_BPvlHcpr8ORa5S-OmWU48HUpzuHbTu8yx3jnqbSTRDD"
            })
          });
        });
      } else {
        print("Unknown moderation action. Use kick or ban.");
      }
    }
    return;
  }

  // OWNER ONLY
  if (cmd === "!history1") {
    print("Message history:");
    globalMessages.forEach(m => print(m));
    return;
  }

  if (cmd === "!history2") {
    print("Mod actions history:");
    modActions.forEach(m => print(m));
    return;
  }

  if (cmd.startsWith("!globalmessage ")) {
    const msg = cmd.slice(15);
    await fetch("/api/say", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `[GLOBAL] ${msg}` })
    });
    print("Global message sent to Discord.");
    return;
  }

  print("Unknown command. Type !help");
});
