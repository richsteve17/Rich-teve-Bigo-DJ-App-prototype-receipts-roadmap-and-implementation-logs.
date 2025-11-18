# BIGO DJ App - Quick Start Guide

Get your DJ app running in **under 5 minutes**!

## Option 1: Demo Mode (Fastest - No Setup!)

**Perfect for:** Testing features, learning the app, BIGO/SUGO streaming practice

1. **Start a local server (defaults to port 8080):**
   ```bash
   python3 -m http.server 8080
   ```

   > Need to use a different port? Update the `LOCAL_DEV_PORT` constant near the top of `config.js`, then restart your server on that port and update your Spotify redirect URIs to match.

2. **Open the app:**
   ```
   http://127.0.0.1:8080/app/web/dj-mixer/index.html
   ```

3. **Select Demo Mode** when prompted
   - 8 preloaded tracks ready to mix
   - Full CUE system, staging, recording
   - Beat matching, EQ, crossfader
   - No Spotify setup required!

4. **Start DJing!** 🎧

---

## Option 2: Full Mode with Spotify

**Perfect for:** Full music library, AI recommendations, unlimited tracks

### Step 1: Create Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Click **"Create app"**
3. Fill in:
   - **App name:** BIGO DJ (or anything you want)
   - **App description:** Mobile DJ app for streaming
   - **Redirect URI:** `http://127.0.0.1:8080/app/web/dj-mixer/callback.html`
     - ⚠️ **IMPORTANT:** Use `127.0.0.1` NOT `localhost` (Spotify requirement)
     - ⚠️ **IMPORTANT:** Use port `8080` to match the local server
     - 🔁 If you change the port, update both `LOCAL_DEV_PORT` in `config.js` and your Spotify redirect URIs.
   - **Which API/SDKs are you planning to use:** Check "Web API"

4. Click **"Save"**
5. Copy your **Client ID**

### Step 2: Configure App

1. Open `config.js` in the project root
2. Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID:
   ```javascript
   clientId: 'abc123your-client-id-here',
   ```
3. Save the file

### Step 3: Run the App

1. **Start local server (default 8080):**
   ```bash
   python3 -m http.server 8080
   ```

   > If you switch ports, edit `LOCAL_DEV_PORT` in `config.js` and restart your server on the same port.

2. **Open in browser:**
   ```
   http://127.0.0.1:8080/app/web/dj-mixer/index.html
   ```
   - ⚠️ Use `127.0.0.1` NOT `localhost` (must match redirect URI)

3. **Select Full Mode** when prompted

4. **Click "Connect Spotify"** and log in

5. **Start mixing!** 🎵

---

## Using the DJ Features

### 🎧 CUE System (Preview Tracks)
- Click **CUE A** or **CUE B** to preview a track quietly
- Button glows cyan when active
- Perfect for mobile streaming without headphones

### 📋 Track Staging
- **Single-click** any track → Stages it in "Next Up" area
- **Double-click** any track → Loads and plays immediately
- Click **"LOAD TO DECK"** to load staged track

### ⏺️ Recording Your Mix
1. Click **⏺ RECORD** to start capturing
2. DJ your mix (all audio is recorded)
3. Click **⏹ STOP REC** to finish
4. Mix auto-downloads as `.webm` file

### 🎚️ Beat Matching
1. Load tracks on both decks
2. Click **SYNC** to auto-match BPMs
3. Use crossfader to blend tracks
4. Adjust EQ (Low/Mid/High) per deck

### 🎹 EQ Controls
- **Low (Bass):** Bottom slider on each deck
- **Mid:** Middle slider
- **High (Treble):** Top slider
- Range: -12dB to +12dB

---

## BIGO/SUGO Streaming Setup

### For BIGO (Screen Share):
1. Open DJ app on phone/tablet
2. Select Demo Mode or Full Mode
3. Use **CUE** to preview tracks before mixing
4. Start BIGO stream with screen share
5. Use **RECORD** to capture your mix

### For SUGO (Audio Rooms):
1. Open DJ app on device
2. Play Spotify tracks through speaker
3. Phone mic picks up audio for room
4. Use **staging area** for smooth transitions
5. **CUE** lets you preview quietly before bringing into mix

---

## Troubleshooting

### "Spotify authentication failed"
- Make sure redirect URI is exactly: `http://127.0.0.1:8080/app/web/dj-mixer/callback.html`
- Use `127.0.0.1` NOT `localhost`
- Check Client ID is correct in `config.js`

### "No tracks loading"
- In Demo Mode: Tracks are preloaded automatically
- In Full Mode: Click "Connect Spotify" first
- In Simple Mode: Use "Upload Files" to add local MP3s

### "Audio not playing"
- Click anywhere on the page first (browsers require user interaction)
- Check browser console for errors (F12)
- Make sure tracks are loaded to decks before pressing play

### "Can't access on phone"
To access from your phone on same WiFi:
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Open `http://YOUR_IP:8080/app/web/dj-mixer/index.html` on phone
3. For Spotify: Add `http://YOUR_IP:8080/app/web/dj-mixer/callback.html` to redirect URIs

---

## App Modes Explained

| Feature | Demo | Simple | Full |
|---------|------|--------|------|
| Preloaded Tracks | ✅ 8 tracks | ❌ | ❌ |
| Local File Upload | ❌ | ✅ | ✅ |
| Spotify Integration | ❌ | ❌ | ✅ |
| AI Recommendations | ❌ | ❌ | ✅ |
| Dual Decks | ✅ | ❌ Single | ✅ |
| Beat Matching | ✅ | ❌ | ✅ |
| CUE System | ✅ | ✅ | ✅ |
| Recording | ✅ | ✅ | ✅ |
| Streamer Safety | ❌ | ❌ | ✅ |

---

## Next Steps

1. **Read GETTING_STARTED.md** for detailed feature guides
2. **Try the tutorial** - Click tutorial button in app
3. **Practice beat matching** with demo tracks
4. **Test BIGO/SUGO streaming** with CUE and recording
5. **Explore AI suggestions** in Full Mode

---

## Need Help?

- **Issues?** Check browser console (F12) for errors
- **Questions?** See GETTING_STARTED.md for details
- **Spotify Setup?** https://developer.spotify.com/documentation

**Ready to stream? Let's go! 🎵🔥**
