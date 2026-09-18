// ======================================================
// CRICKET LIVE
// CHANNEL SYSTEM
// ======================================================


// ======================================================
// 1. IPTV SPORTS PLAYLIST
// ======================================================

const PLAYLIST_URL =
  "https://iptv-org.github.io/iptv/categories/sports.m3u";


// ======================================================
// 2. ONLY THESE CHANNELS WILL APPEAR
// ======================================================
//
// IMPORTANT:
// Yaha exact channel name likho.
//
// Example:
// "Channel Name"
// "Another Channel"
//
// Jo naam yaha nahi hoga,
// woh website par show nahi hoga.
// ======================================================
const ALLOWED_CHANNELS = [
  // Sony Sports
  "Sony Sports Ten 1",
  "Sony Sports Ten 1 HD",
  "Sony Sports Ten 2",
  "Sony Sports Ten 2 HD",
  "Sony Sports Ten 3 Hindi",
  "Sony Sports Ten 3 Hindi HD",
  "Sony Sports Ten 4 Tamil",
  "Sony Sports Ten 4 Telugu",
  "Sony Sports Ten 5",
  "Sony Sports Ten 5 HD",

  // Star Sports
  "Star Sports 1",
  "Star Sports 1 HD",
  "Star Sports 1 HD Hindi",
  "Star Sports 1 Hindi",
  "Star Sports 1 Kannada",
  "Star Sports 1 Tamil",
  "Star Sports 1 Telugu",
  "Star Sports 2",
  "Star Sports 2 HD",
  "Star Sports 2 Hindi",
  "Star Sports 2 Hindi HD",
  "Star Sports 2 Kannada",
  "Star Sports 2 Tamil",
  "Star Sports 2 Telugu",
  "Star Sports Khel"
];
  // Example:
  // "Your Authorized Sports Channel",
  // "Your Authorized Cricket Channel"

];


// ======================================================
// 3. LOCAL TEST CHANNEL
// ======================================================
//
// Ye Mux ka public test stream hai.
// Isse website/player testing ke liye use kar sakte ho.
//
// ======================================================

const TEST_CHANNEL = {

  name: "Cricket Test",

  logo: "🏏",

  url:
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"

};


// ======================================================
// 4. HTML ELEMENTS
// ======================================================

const video =
  document.getElementById("player");

const overlay =
  document.getElementById("overlay");

const overlayTitle =
  document.getElementById("overlayTitle");

const message =
  document.getElementById("message");

const channelsContainer =
  document.getElementById("channels");

const channelStatus =
  document.getElementById("channelStatus");

const matchTitle =
  document.getElementById("matchTitle");

const statusText =
  document.getElementById("statusText");

const refreshChannels =
  document.getElementById("refreshChannels");


// ======================================================
// 5. HLS INSTANCE
// ======================================================

let hls = null;


// ======================================================
// 6. SHOW / HIDE OVERLAY
// ======================================================

function hideOverlay() {

  overlay.classList.add("hidden");

}


function showOverlay(title, text) {

  overlayTitle.textContent = title;

  message.textContent = text;

  overlay.classList.remove("hidden");

}


// ======================================================
// 7. DESTROY OLD HLS PLAYER
// ======================================================

function destroyPlayer() {

  if (hls) {

    hls.destroy();

    hls = null;

  }

  video.pause();

  video.removeAttribute("src");

  video.load();

}


// ======================================================
// 8. PLAY CHANNEL
// ======================================================

function playChannel(channel) {

  if (!channel || !channel.url) {

    showOverlay(
      "Stream unavailable",
      "This channel has no valid stream URL."
    );

    return;

  }


  destroyPlayer();


  matchTitle.textContent =
    channel.name;

  statusText.textContent =
    "LOADING";


  showOverlay(
    channel.name,
    "Connecting to live stream..."
  );


  // ==================================================
  // HLS.JS
  // ==================================================

  if (
    window.Hls &&
    Hls.isSupported()
  ) {

    hls = new Hls({

      enableWorker: true,

      lowLatencyMode: false,

      maxBufferLength: 20,

      maxMaxBufferLength: 30,

      liveSyncDurationCount: 3

    });


    hls.loadSource(channel.url);

    hls.attachMedia(video);


    hls.on(
      Hls.Events.MANIFEST_PARSED,
      () => {

        statusText.textContent =
          "LIVE";

        video.play().catch(() => {

          showOverlay(
            channel.name,
            "Tap the play button to start."
          );

        });

      }
    );


    hls.on(
      Hls.Events.ERROR,
      (_, data) => {

        console.log(
          "HLS ERROR:",
          data
        );


        if (data.fatal) {

          statusText.textContent =
            "ERROR";


          showOverlay(
            "Stream unavailable",
            "This stream could not be played."
          );

        }

      }
    );


    video.addEventListener(
      "playing",
      () => {

        hideOverlay();

        statusText.textContent =
          "LIVE";

      },
      { once: true }
    );

  }


  // ==================================================
  // NATIVE HLS
  // ==================================================

  else if (
    video.canPlayType(
      "application/vnd.apple.mpegurl"
    )
  ) {

    video.src =
      channel.url;


    video.addEventListener(
      "loadedmetadata",
      () => {

        video.play().catch(() => {

          showOverlay(
            channel.name,
            "Tap the play button to start."
          );

        });

      },
      { once: true }
    );


    video.addEventListener(
      "playing",
      () => {

        hideOverlay();

        statusText.textContent =
          "LIVE";

      },
      { once: true }
    );

  }


  else {

    showOverlay(
      "Not supported",
      "This browser does not support HLS playback."
    );

  }

}


// ======================================================
// 9. CREATE CHANNEL CARD
// ======================================================

function createChannelCard(channel) {

  const card =
    document.createElement("button");


  card.className =
    "channel-card";


  card.type =
    "button";


  card.innerHTML = `

    <div class="channel-logo">

      ${
        channel.logo
          ? `<img
               src="${channel.logo}"
               alt=""
               onerror="this.style.display='none'"
             >`
          : `<span>🏏</span>`
      }

    </div>


    <div class="channel-info">

      <strong>
        ${escapeHtml(channel.name)}
      </strong>

      <small>
        LIVE
      </small>

    </div>

  `;


  card.addEventListener(
    "click",
    () => {

      document
        .querySelectorAll(".channel-card")
        .forEach(item => {

          item.classList.remove(
            "active"
          );

        });


      card.classList.add(
        "active"
      );


      playChannel(channel);

    }
  );


  return card;

}


// ======================================================
// 10. HTML ESCAPE
// ======================================================

function escapeHtml(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ======================================================
// 11. PARSE M3U
// ======================================================

function parseM3U(text) {

  const lines =
    text.split(/\r?\n/);

  const channels = [];

  let currentInfo = null;


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const line =
      lines[i].trim();


    if (
      line.startsWith("#EXTINF:")
    ) {

      const commaIndex =
        line.indexOf(",");


      let name =
        commaIndex !== -1
          ? line
              .substring(commaIndex + 1)
              .trim()
          : "Unknown Channel";


      const logoMatch =
        line.match(
          /tvg-logo="([^"]*)"/i
        );


      currentInfo = {

        name: name,

        logo:
          logoMatch
            ? logoMatch[1]
            : ""

      };

    }


    else if (
      currentInfo &&
      line &&
      !line.startsWith("#")
    ) {

      currentInfo.url =
        line;


      channels.push(
        currentInfo
      );


      currentInfo =
        null;

    }

  }


  return channels;

}


// ======================================================
// 12. FIND SELECTED CHANNELS
// ======================================================

function filterAllowedChannels(
  channels
) {

  if (
    !ALLOWED_CHANNELS.length
  ) {

    return [];

  }


  return channels.filter(
    channel => {

      return ALLOWED_CHANNELS.some(
        allowed => {

          return (
            channel.name
              .trim()
              .toLowerCase()
              ===
            allowed
              .trim()
              .toLowerCase()
          );

        }
      );

    }
  );

}


// ======================================================
// 13. LOAD PLAYLIST
// ======================================================

async function loadPlaylist() {

  channelStatus.textContent =
    "Loading sports playlist...";


  try {

    const response =
      await fetch(
        PLAYLIST_URL,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Playlist request failed"
      );

    }


    const text =
      await response.text();


    const allChannels =
      parseM3U(text);


    const selectedChannels =
      filterAllowedChannels(
        allChannels
      );


    renderChannels(
      selectedChannels
    );

  }


  catch (error) {

    console.error(error);


    channelStatus.textContent =
      "Could not load playlist.";


    renderChannels([]);

  }

}


// ======================================================
// 14. RENDER CHANNELS
// ======================================================

function renderChannels(
  channels
) {

  channelsContainer.innerHTML =
    "";


  // Always show our local test channel
  // if it is allowed.

  let finalChannels =
    [...channels];


  if (
    ALLOWED_CHANNELS.some(
      name =>
        name.toLowerCase()
        ===
        TEST_CHANNEL.name.toLowerCase()
    )
  ) {

    const alreadyExists =
      finalChannels.some(
        channel =>
          channel.name
            .toLowerCase()
          ===
          TEST_CHANNEL.name
            .toLowerCase()
      );


    if (!alreadyExists) {

      finalChannels.unshift(
        TEST_CHANNEL
      );

    }

  }


  if (
    finalChannels.length === 0
  ) {

    channelStatus.textContent =
      "No selected channels found.";

    return;

  }


  channelStatus.textContent =
    `${finalChannels.length} channel(s) available`;


  finalChannels.forEach(
    channel => {

      const card =
        createChannelCard(
          channel
        );


      channelsContainer.appendChild(
        card
      );

    }
  );

}


// ======================================================
// 15. REFRESH BUTTON
// ======================================================

refreshChannels.addEventListener(
  "click",
  () => {

    loadPlaylist();

  }
);


// ======================================================
// 16. FIREBASE
// ======================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyDm3DIHJfRPEqNqrUlYJutRQm8XIA6H3fs",

  authDomain:
    "cricket-live-39106.firebaseapp.com",

  databaseURL:
    "https://cricket-live-39106-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "cricket-live-39106",

  storageBucket:
    "cricket-live-39106.firebasestorage.app",

  messagingSenderId:
    "841890143",

  appId:
    "1:841890143:web:ca5b87c9395bdc19145eea",

  measurementId:
    "G-ZNEZC8YVMX"

};


firebase.initializeApp(
  firebaseConfig
);


const database =
  firebase.database();


// ======================================================
// 17. LIVE VIEWER COUNT
// ======================================================

const viewerCountElement =
  document.getElementById(
    "viewerCount"
  );


const viewerRef =
  database
    .ref("liveViewers")
    .push();


viewerRef
  .onDisconnect()
  .remove();


viewerRef.set(true);


database
  .ref("liveViewers")
  .on(
    "value",
    snapshot => {

      const count =
        snapshot.numChildren();


      if (
        viewerCountElement
      ) {

        viewerCountElement.textContent =
          `👁 ${count} Watching`;

      }

    }
  );


// ======================================================
// 18. START
// ======================================================

loadPlaylist();
