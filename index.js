/**
 * reiini.edit - Linktree Premium JS Logic
 */

// ==========================================
// CONFIGURATION
// ==========================================
// IMPORTANT: Remplacer par votre ID numérique Discord (17-19 chiffres)
// Pour l'obtenir : Paramètres Discord -> Avancés -> Cochez "Mode Développeur"
// Faites ensuite un clic droit sur votre profil en bas à gauche -> Copier l'identifiant
const DISCORD_USER_ID = "779745551776219166";

// Enable status simulation if the ID above is not configured
const ENABLE_SIMULATION = DISCORD_USER_ID === "YOUR_DISCORD_USER_ID_HERE" || DISCORD_USER_ID === "";

// ==========================================
// AUDIO & VOLUME MANAGEMENT (BACKGROUND VIDEO SOUND)
// ==========================================
const video = document.getElementById("bg-video");
const volumeToggle = document.getElementById("volume-toggle");
const volumeIcon = document.getElementById("volume-icon");

// Initial video volume
video.volume = 0.5;

// Toggle audio function for video
function toggleAudio() {
  if (video.muted) {
    video.muted = false;
    video.play().catch(err => console.log("Play failed on toggle:", err));
    volumeIcon.className = "fas fa-volume-high";
    volumeToggle.classList.add("active");
    localStorage.setItem("bg_audio_enabled", "true");
  } else {
    video.muted = true;
    volumeIcon.className = "fas fa-volume-xmark";
    volumeToggle.classList.remove("active");
    localStorage.setItem("bg_audio_enabled", "false");
  }
}

volumeToggle.addEventListener("click", toggleAudio);

// Restore user's volume preference on load
window.addEventListener("DOMContentLoaded", () => {
  // Enable audio by default on first visit
  if (localStorage.getItem("bg_audio_enabled") === null) {
    localStorage.setItem("bg_audio_enabled", "true");
  }

  // We keep the video MUTED initially so the browser allows autoplay (visuals play immediately)
  video.muted = true;
  video.play().catch(err => console.log("Muted autoplay blocked, waiting for interaction...", err));

  // Unmute as soon as the user clicks or touches anywhere on the screen
  const forceUnmuteOnInteraction = (e) => {
    const audioPref = localStorage.getItem("bg_audio_enabled");
    if (audioPref === "true") {
      video.muted = false;
      video.volume = 0.5;
      volumeIcon.className = "fas fa-volume-high";
      volumeToggle.classList.add("active");
    }
    video.play().catch(err => console.log("Play failed on interaction:", err));

    document.removeEventListener("click", forceUnmuteOnInteraction);
    document.removeEventListener("touchend", forceUnmuteOnInteraction);
  };

  document.addEventListener("click", forceUnmuteOnInteraction);
  document.addEventListener("touchend", forceUnmuteOnInteraction);
});

// ==========================================
// DISCORD COPY TAG TO CLIPBOARD
// ==========================================
const discordCopyBtn = document.getElementById("discord-copy-btn");
const copyTooltip = document.getElementById("copy-tooltip");
const discordUsername = discordCopyBtn.getAttribute("data-username");

discordCopyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(discordUsername)
    .then(() => {
      // Succès
      copyTooltip.textContent = "Copié !";
      copyTooltip.style.opacity = "1";
      copyTooltip.style.transform = "translateY(0)";

      // Animation flash sur le bouton
      discordCopyBtn.style.transform = "scale(0.9)";
      setTimeout(() => {
        discordCopyBtn.style.transform = "";
      }, 150);

      // Réinitialiser le tooltip après 2 secondes
      setTimeout(() => {
        copyTooltip.textContent = `Copy ${discordUsername}`;
        copyTooltip.style.opacity = "";
        copyTooltip.style.transform = "";
      }, 2000);
    })
    .catch(err => {
      console.error("Impossible de copier dans le presse-papier", err);
    });
});

// ==========================================
// DISCORD LANYARD REAL-TIME INTEGRATION
// ==========================================
const discordStatusCard = document.getElementById("discord-status-card");
const discordAvatar = document.getElementById("discord-status-avatar");
const discordStatusDot = document.getElementById("discord-status-dot");
const discordName = document.getElementById("discord-status-name");
const discordBadge = document.getElementById("discord-status-badge");
const discordActivity = document.getElementById("discord-status-activity");
const profileAvatar = document.getElementById("profile-avatar"); // Avatar principal en haut

// Discord status mapping
const statusMap = {
  online: { label: "Online", color: "online" },
  idle: { label: "Idle", color: "idle" },
  dnd: { label: "Do Not Disturb", color: "dnd" },
  offline: { label: "Offline", color: "offline" }
};

// Met à jour l'interface utilisateur avec les données d'activité de Discord
function updateDiscordUI(presence) {
  if (!presence) return;

  const user = presence.discord_user;
  const status = presence.discord_status;
  const activities = presence.activities;
  const spotify = presence.listening_to_spotify;

  // 1. Mise à jour des photos de profil (si présentes)
  if (user && user.avatar) {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.png?size=256`;
    discordAvatar.src = avatarUrl;

  }

  // 2. Mise à jour du pseudo / nom d'affichage
  if (user) {
    discordName.textContent = user.global_name || user.username || "furiously5241";
  }

  // 3. Mise à jour de la pastille de statut
  const mappedStatus = statusMap[status] || statusMap.offline;
  discordStatusDot.className = `status-dot ${mappedStatus.color}`;
  discordBadge.textContent = mappedStatus.label;
  discordBadge.className = `discord-status-badge ${status !== 'offline' ? 'active-status' : ''}`;

  // 4. Update real-time activity
  if (status === "offline") {
    discordActivity.textContent = "Offline";
    return;
  }

  // If listening to Spotify (Priority)
  if (spotify && presence.spotify) {
    const song = presence.spotify.track;
    const artist = presence.spotify.artist.replace(/;/g, ",");
    discordActivity.innerHTML = `<i class="fab fa-spotify" style="color: #1db954; margin-right: 4px;"></i> Listening to <strong>${song}</strong> by <em>${artist}</em>`;
    return;
  }

  // If playing a game or active in another app
  if (activities && activities.length > 0) {
    // Filter custom status (type 4) to find a real game/app first
    const activeGame = activities.find(act => act.type === 0);
    const customStatus = activities.find(act => act.type === 4);

    if (activeGame) {
      discordActivity.innerHTML = `<i class="fas fa-gamepad" style="color: var(--neon-blue); margin-right: 4px;"></i> Playing <strong>${activeGame.name}</strong>`;
      return;
    } else if (customStatus) {
      // Display custom status
      const state = customStatus.state || "";
      const emojiText = customStatus.emoji ? `${customStatus.emoji.name} ` : "";
      discordActivity.textContent = `${emojiText}${state}` || "Online";
      return;
    }
  }

  discordActivity.textContent = "Online";
}

// ------------------------------------------
// Lanyard WebSocket Connection
// ------------------------------------------
let socket = null;
let heartbeatInterval = null;

function connectLanyard() {
  if (ENABLE_SIMULATION) {
    runSimulator();
    return;
  }

  socket = new WebSocket("wss://api.lanyard.rest/socket");

  socket.onopen = () => {
    console.log("Connected to Lanyard API (WebSocket)...");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Lanyard envoie un code operation (op)
    switch (data.op) {
      case 1: // Hello (commence le heartbeat et envoie l'init)
        heartbeatInterval = setInterval(() => {
          socket.send(JSON.stringify({ op: 3 }));
        }, data.d.heartbeat_interval);

        // Envoyer la souscription à notre ID utilisateur
        socket.send(JSON.stringify({
          op: 2,
          d: { subscribe_to_id: DISCORD_USER_ID }
        }));
        break;

      case 0: // Event (mise à jour des données)
        if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
          updateDiscordUI(data.d);
        }
        break;
    }
  };

  socket.onerror = (err) => {
    console.error("Erreur WebSocket Lanyard:", err);
  };

  socket.onclose = () => {
    console.log("Lanyard WebSocket disconnected, reconnecting in 5s...");
    clearInterval(heartbeatInterval);
    setTimeout(connectLanyard, 5000);
  };
}

// ------------------------------------------
// Simulateur de Statut (Fallback / Démo)
// ------------------------------------------
function runSimulator() {
  console.log("Discord status simulation mode active (No valid Discord ID configured).");

  const mockPresences = [
    {
      discord_user: { username: "furiously5241", global_name: "Reiini", avatar: null },
      discord_status: "online",
      listening_to_spotify: false,
      activities: [{ type: 4, name: "Custom Status", state: "🎬 Editing on CapCut...", emoji: { name: "✨" } }]
    },
    {
      discord_user: { username: "furiously5241", global_name: "Reiini", avatar: null },
      discord_status: "dnd",
      listening_to_spotify: false,
      activities: [{ type: 0, name: "Visual Studio Code" }]
    },
    {
      discord_user: { username: "furiously5241", global_name: "Reiini", avatar: null },
      discord_status: "online",
      listening_to_spotify: true,
      spotify: { track: "Lovely", artist: "Billie Eilish; Khalid" },
      activities: []
    }
  ];

  let currentIndex = 0;

  function cycleSimulation() {
    updateDiscordUI(mockPresences[currentIndex]);
    currentIndex = (currentIndex + 1) % mockPresences.length;
  }

  // Lancer le premier cycle immédiatement
  cycleSimulation();
  // Changer toutes le 15 secondes
  setInterval(cycleSimulation, 15000);
}

// Initialisation Lanyard
connectLanyard();

// ==========================================
// DYNAMIC DISCORD SERVERS DETAILS FETCHING
// ==========================================
// Cette fonction appelle l'API d'invitation publique de Discord pour récupérer
// dynamiquement le nom du serveur, son icône, et le nombre de membres.
async function fetchDiscordServerData(inviteCode, serverCardId, descriptionId, fallbackIconId) {
  try {
    const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
    if (!response.ok) throw new Error("Erreur de récupération Discord");

    const data = await response.json();

    // Récupérer les éléments du DOM
    const serverCard = document.getElementById(serverCardId);
    const descriptionElement = document.getElementById(descriptionId);
    const iconWrapper = serverCard.querySelector(".server-icon-wrapper");

    // Mettre à jour le titre si nécessaire
    const titleElement = serverCard.querySelector(".server-name");
    if (data.guild && data.guild.name) {
      titleElement.textContent = data.guild.name;
    }

    // Mettre à jour le compteur de membres
    if (data.approximate_member_count) {
      const onlineCount = data.approximate_presence_count || 0;
      const totalCount = data.approximate_member_count;
      descriptionElement.innerHTML = `<span class="online-indicator" style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:#23a55a; margin-right:4px;"></span>${onlineCount.toLocaleString()} Online • ${totalCount.toLocaleString()} Members`;
    }

    // Charger l'icône du serveur
    if (data.guild && data.guild.id && data.guild.icon) {
      const iconUrl = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=128`;
      iconWrapper.innerHTML = `<img src="${iconUrl}" alt="${data.guild.name} Icon" class="server-icon-image">`;
    }

  } catch (error) {
    console.warn(`Could not retrieve online details for server ${inviteCode} (CORS or offline). Using fallback.`, error);
  }
}

// Initialize page content on load
window.addEventListener("DOMContentLoaded", () => {
  // Fetch servers data
  fetchDiscordServerData("NFaw5PXAXX", "server-yuz-hub", "members-yuz-hub", "icon-yuz-hub");
  fetchDiscordServerData("Bm3haSZkFf", "server-romance-anime", "members-romance-anime", "icon-romance-anime");

  // Splash screen interaction and auto-dismiss
  const splash = document.getElementById("splash-screen");
  const dismissSplash = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!document.body.classList.contains("loaded")) {
      document.body.classList.add("loaded");
      document.body.classList.add("entrance-animating");

      // Unmute video according to user preference directly inside user gesture
      const audioPref = localStorage.getItem("bg_audio_enabled");
      if (audioPref === "true") {
        video.muted = false;
        video.volume = 0.5;
        if (volumeIcon) volumeIcon.className = "fas fa-volume-high";
        if (volumeToggle) volumeToggle.classList.add("active");
      }

      // Explicitly trigger play when splash is dismissed
      video.play().catch(err => console.log("Play failed on splash dismiss:", err));

      // Remove entrance-animating class after entry animations complete (2.5s)
      setTimeout(() => {
        document.body.classList.remove("entrance-animating");
      }, 2500);

      // Start the idle timer for the Discord logo (3.0 seconds after loaded class is added)
      setTimeout(() => {
        const discordLogo = document.querySelector(".discord-lanyard-brand");
        if (discordLogo) {
          discordLogo.classList.add("idle-active");
        }
      }, 3000);
    }
  };

  if (splash) {
    splash.addEventListener("click", dismissSplash);
    splash.addEventListener("touchend", dismissSplash);
  }
});
