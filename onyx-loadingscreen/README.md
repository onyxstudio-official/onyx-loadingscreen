# Onyx Loading Screen | Free & Open Source

A modern and cinematic loading screen crafted for FiveM roleplay servers. Designed with luxury glassmorphism aesthetics, real-time Discord integration, and an interactive music player.

---

### Features

* Real-Time Discord Integration: Automatically fetches the connecting player's Discord Avatar, Display Name, and Username with live online status.
* Interactive Music Player: Spotify-style floating music player featuring song covers, artist info, interactive seekbar, volume control, mute toggle, and smooth play/pause controls.
* Live Server & Network Stats: Displays real-time ping (ms) and live player count directly on the profile card.
* Cinematic Visual Engine: 
  * Supports high-resolution Image Slideshows with smooth crossfades.
  * Supports custom looping background videos (.mp4).
  * Built-in cinematic vignette, contrast boost, and edge-darkness effects.
* Modern SVG Circular Loader: Real-time loading percentage tracking with animated SVG progress ring and dynamic handoff status.
* 100% Lightweight: Built with pure Vanilla JavaScript (No heavy libraries / Zero bloat).

---

### How to Set Up the Discord Bot (Step-by-Step)

To display connecting players' Discord avatars and names, you need a Discord Bot Token:

1. Go to the Discord Developer Portal: https://discord.com/developers/applications
2. Click "New Application" in the top right, enter a name (e.g., Onyx Loader), and confirm.
3. In the left sidebar, navigate to the "Bot" tab.
4. Click "Reset Token" (or "View Token") and copy the generated token.
5. Scroll down to "Privileged Gateway Intents" on the same page and enable:
   * Server Members Intent
6. Open config.lua and paste your token:
   Config.DiscordBotToken = "PASTE_YOUR_DISCORD_BOT_TOKEN_HERE"
7. Make sure your bot is invited to your Discord server.

---

### Configuration

Easily customize everything inside config.lua:
- Configure background mode (Video or Image Slideshow).
- Add unlimited custom songs with custom album covers.
- Adjust slideshow intervals, vignette intensity, and default volume.

---

### Installation

1. Download or clone this repository.
2. Drag and drop onyx-loadingscreen into your FiveM resources folder.
3. Add "ensure onyx-loadingscreen" into your server.cfg.
4. Configure config.lua and restart your server.

---

### Credits & Author
* Author: Can Baygara (CB)
* Studio: Onyx Studio
* GitHub: https://github.com/onyxstudio-official
* Discord: https://discord.com/users/770626004783071234
