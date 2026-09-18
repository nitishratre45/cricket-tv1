const PLAYLIST_URL =
  "https://raw.githubusercontent.com/freecasthub/public-iptv/main/sports.m3u";

const video = document.getElementById("player");
const overlay = document.getElementById("overlay");
const channelList = document.getElementById("channelList");
const categoriesEl = document.getElementById("categories");
const searchEl = document.getElementById("search");

let channels = [];
let activeCategory = "All";
let hls = null;

let liveWatching = 3450;
let totalViewers = 20000;

function formatNumber(n) {
  return n.toLocaleString("en-IN");
}

function updateViewerDisplay() {
  document.getElementById("viewerCount").textContent =
    `👁 ${formatNumber(liveWatching)} Watching`;
  document.getElementById("totalViewers").textContent =
    `👥 ${formatNumber(totalViewers)} Total`;
}

setInterval(() => {
  let change = 0;
  while (change === 0) {
    change = Math.floor(Math.random() * 61) - 30;
  }

  liveWatching = Math.max(3200, Math.min(8000, liveWatching + change));
  updateViewerDisplay();
}, 60000);

setInterval(() => {
  if (totalViewers < 80000) {
    totalViewers = Math.min(
      80000,
      totalViewers + Math.floor(Math.random() * 101) + 50
    );
    updateViewerDisplay();
  }
}, 60000);

function parseM3U(text) {
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("#EXTINF")) continue;

    const info = lines[i];
    const url = lines[i + 1] && !lines[i + 1].startsWith("#")
      ? lines[i + 1]
      : "";

    if (!url) continue;

    const name = info.includes(",")
      ? info.substring(info.indexOf(",") + 1).trim()
      : "Unknown Channel";

    const groupMatch = info.match(/group-title="([^"]*)"/i);
    const logoMatch = info.match(/tvg-logo="([^"]*)"/i);

    result.push({
      name,
      url,
      group: groupMatch ? groupMatch[1] : "Sports",
      logo: logoMatch ? logoMatch[1] : ""
    });
  }

  return result;
}

function renderCategories() {
  const groups = ["All", ...new Set(channels.map(c => c.group).filter(Boolean))];

  categoriesEl.innerHTML = groups.map(group => `
    <button class="${group === activeCategory ? "active" : ""}"
            data-category="${escapeHtml(group)}">
      ${escapeHtml(group)}
    </button>
  `).join("");

  categoriesEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderCategories();
      renderChannels();
    });
  });
}

function renderChannels() {
  const query = searchEl.value.trim().toLowerCase();

  const filtered = channels.filter(channel => {
    const categoryMatch =
      activeCategory === "All" || channel.group === activeCategory;

    const searchMatch =
      !query ||
      channel.name.toLowerCase().includes(query) ||
      channel.group.toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  if (!filtered.length) {
    channelList.innerHTML = "<p>No channels found.</p>";
    return;
  }

  channelList.innerHTML = filtered.map((channel, index) => `
    <article class="channel-card" data-index="${index}">
      <div class="channel-name">${escapeHtml(channel.name)}</div>
      <div class="channel-group">${escapeHtml(channel.group)}</div>
    </article>
  `).join("");

  channelList.querySelectorAll(".channel-card").forEach(card => {
    const visibleIndex = Number(card.dataset.index);
    card.addEventListener("click", () => playChannel(filtered[visibleIndex]));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function playChannel(channel) {
  overlay.textContent = `Loading ${channel.name}...`;
  overlay.style.display = "grid";

  if (hls) {
    hls.destroy();
    hls = null;
  }

  const url = channel.url;

  if (window.Hls && Hls.isSupported() &&
      (url.includes(".m3u8") || url.includes("m3u8"))) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 30,
      maxMaxBufferLength: 60
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      overlay.style.display = "none";
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        overlay.textContent = "This channel is unavailable right now.";
        overlay.style.display = "grid";
      }
    });
  } else {
    video.src = url;
    video.load();

    video.addEventListener("loadedmetadata", () => {
      overlay.style.display = "none";
      video.play().catch(() => {});
    }, { once: true });

    video.addEventListener("error", () => {
      overlay.textContent = "This channel is unavailable right now.";
      overlay.style.display = "grid";
    }, { once: true });
  }
}

async function loadPlaylist() {
  try {
    const response = await fetch(PLAYLIST_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Playlist HTTP ${response.status}`);
    }

    const text = await response.text();
    channels = parseM3U(text);

    renderCategories();
    renderChannels();
  } catch (error) {
    console.error("Playlist error:", error);
    channelList.innerHTML =
      "<p>Could not load the sports playlist. Please try again later.</p>";
  }
}

searchEl.addEventListener("input", renderChannels);

updateViewerDisplay();
loadPlaylist();
