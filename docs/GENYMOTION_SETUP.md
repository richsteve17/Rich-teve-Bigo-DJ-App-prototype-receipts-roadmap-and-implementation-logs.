# Genymotion Emulator Setup Guide for BIGO DJ App

Complete guide for running the BIGO DJ app on Genymotion Android emulator on macOS.

## Prerequisites

✅ **Already completed:**
- Genymotion installed on Mac
- Google Pixel 7 virtual device created
- Google Play Store installed on emulator
- SUGO app installed (if needed for streaming)

## Overview

This guide helps you:
1. Find your Mac's local IP address
2. Start the DJ app server accessible from Genymotion
3. Connect from the Android emulator
4. Configure Spotify (optional)
5. Troubleshoot common issues

---

## Step 1: Find Your Mac's Local IP Address

Genymotion emulators run on a separate network, so you need your Mac's local IP to connect.

### Method 1: System Preferences (GUI)
1. Open **System Preferences**
2. Click **Network**
3. Select your active connection (Wi-Fi or Ethernet)
4. Look for **IP Address** - it will be something like:
   - `192.168.1.xxx` (most common for home networks)
   - `10.0.0.xxx` (some routers)
   - `172.16.x.xxx` (less common)

### Method 2: Terminal (Quick)
```bash
# Get your local IP address
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

**Example output:** `192.168.1.100`

📝 **Write down your IP address** - you'll need it multiple times!

---

## Step 2: Start the Local Server

The DJ app needs a local web server. We'll bind it to all network interfaces so Genymotion can access it.

### Option A: Python 3 (Recommended)
```bash
# Navigate to project root
cd /path/to/Rich-teve-Bigo-DJ-App-prototype-receipts-roadmap-and-implementation-logs.

# Start server on port 8080, accessible from network
python3 -m http.server 8080 --bind 0.0.0.0
```

### Option B: Node.js http-server
```bash
# Install if needed
npm install -g http-server

# Start server accessible from network
http-server -p 8080 -a 0.0.0.0
```

### Option C: PHP
```bash
php -S 0.0.0.0:8080
```

**Important:** The `0.0.0.0` binding makes the server accessible from other devices on your network, including Genymotion.

✅ **Verify server is running:**
```bash
# Test from Mac browser
open http://127.0.0.1:8080/app/web/dj-mixer/index.html
```

---

## Step 3: Access from Genymotion Emulator

Now we'll open the app in the Android emulator.

### 3.1: Start Your Genymotion Emulator
1. Open **Genymotion**
2. Start your **Google Pixel 7** virtual device
3. Wait for it to fully boot to home screen

### 3.2: Open Chrome Browser in Emulator
The app runs in a web browser, so:
1. Open **Chrome** (or install it from Play Store if needed)
2. In the address bar, type:
   ```
   http://YOUR_MAC_IP:8080/app/web/dj-mixer/index.html
   ```
   Replace `YOUR_MAC_IP` with the IP you found in Step 1.

   **Example:**
   ```
   http://192.168.1.100:8080/app/web/dj-mixer/index.html
   ```

### 3.3: Choose Your Mode
When the app loads, you'll see three options:
- **Demo Mode** - No setup needed, preloaded tracks (best for testing)
- **Simple Mode** - Single deck, upload local files
- **Full Mode** - Requires Spotify configuration

**For testing:** Start with **Demo Mode**!

---

## Step 4: Configure Spotify (Optional - for Full Mode)

If you want to use Full Mode with Spotify integration:

### 4.1: Create Spotify App
1. Go to https://developer.spotify.com/dashboard
2. Click **"Create app"**
3. Fill in:
   - **App name:** BIGO DJ Mobile
   - **App description:** DJ app for Android
   - **Redirect URIs:** Add BOTH:
     ```
     http://YOUR_MAC_IP:8080/app/web/dj-mixer/callback.html
     http://127.0.0.1:8080/app/web/dj-mixer/callback.html
     ```
     (Replace `YOUR_MAC_IP` with your actual IP)
   - **Which API/SDKs:** Check "Web API"
4. Click **"Save"**
5. Copy your **Client ID**

### 4.2: Configure the App
1. On your Mac, copy the template:
   ```bash
   cd /path/to/Rich-teve-Bigo-DJ-App-prototype-receipts-roadmap-and-implementation-logs.
   cp env.template.js env.js
   ```

2. Edit `env.js`:
   ```bash
   nano env.js
   # or use any text editor
   ```

3. Replace `'your-spotify-client-id-goes-here'` with your actual Client ID:
   ```javascript
   globalThis.__DJ_APP_ENV__ = {
     SPOTIFY_CLIENT_ID: 'abc123your-actual-client-id-here',
   };
   ```

4. Save and reload the app in the emulator

---

## Step 5: Using the DJ App on Android

### Touch Controls
- **Single tap** on track = Stage it in "Next Up" area
- **Double tap** on track = Load and play immediately
- **Swipe** crossfader left/right to blend tracks
- **Pinch/zoom** on waveforms for detail

### Key Features for Mobile Streaming

#### 🎧 CUE System
- Tap **CUE A** or **CUE B** to preview tracks quietly
- Perfect when you don't have headphones
- Button glows cyan when active

#### 📋 Track Staging
- Single-tap tracks to stage them
- Review in "Next Up" area
- Tap **"LOAD TO DECK"** when ready

#### ⏺️ Recording
1. Tap **⏺ RECORD** to start
2. DJ your mix
3. Tap **⏹ STOP REC** to finish
4. Mix downloads to device

#### 🎚️ Beat Matching
1. Load tracks on both decks
2. Tap **SYNC** to auto-match BPMs
3. Use crossfader to blend
4. Adjust EQ per deck

---

## Step 6: BIGO/SUGO Streaming Setup

### For BIGO (Screen Share Streaming)
1. Open DJ app in Chrome on Genymotion
2. Select **Demo Mode** or **Full Mode**
3. Start BIGO app
4. Enable screen share
5. Mix live while streaming your screen
6. Use **CUE** to preview tracks before mixing

### For SUGO (Audio Rooms)
1. Open DJ app in Chrome
2. Play tracks through device speaker
3. SUGO app picks up audio via microphone
4. Use **staging area** for smooth transitions
5. **CUE** lets you preview quietly

---

## Troubleshooting

### ❌ "Can't reach server" in Genymotion
**Cause:** Network connectivity issue

**Solutions:**
1. **Check server is running on Mac:**
   ```bash
   # Should show your server running on port 8080
   lsof -i :8080
   ```

2. **Verify IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Check firewall settings:**
   - Open **System Preferences** > **Security & Privacy** > **Firewall**
   - Click **Firewall Options**
   - Make sure Python/Node/PHP is allowed

4. **Try pinging Mac from emulator:**
   - Open Terminal app in Android emulator (install if needed)
   - Run: `ping YOUR_MAC_IP`
   - Should get responses

5. **Restart Genymotion's virtual router:**
   - Stop emulator
   - Genymotion > Settings > Network
   - Reset network settings
   - Restart emulator

### ❌ "Page loads but no audio"
**Cause:** Browser audio policy

**Solution:**
- Tap anywhere on the page first (browsers require user interaction before playing audio)
- Check Chrome permissions for audio
- Reload the page

### ❌ "Spotify authentication failed"
**Cause:** Redirect URI mismatch

**Solution:**
1. Check your Spotify app settings include:
   ```
   http://YOUR_MAC_IP:8080/app/web/dj-mixer/callback.html
   ```
2. Use the **exact same IP** in the browser URL
3. Make sure Client ID is correct in `env.js`

### ❌ "Can't load tracks in Full Mode"
**Cause:** Spotify not configured or logged out

**Solution:**
1. Make sure `env.js` exists with your Client ID
2. Tap **"Connect Spotify"** button
3. Login and approve permissions
4. If still failing, use **Demo Mode** instead

### ❌ "Server accessible from Mac but not emulator"
**Cause:** Network isolation

**Solution:**
1. **Check Genymotion network mode:**
   - Stop emulator
   - Genymotion > Settings > Network
   - Try switching between **NAT** and **Bridge** mode
   - Bridge mode gives emulator direct network access

2. **Restart with network reset:**
   ```bash
   # Stop server, restart with explicit binding
   python3 -m http.server 8080 --bind 0.0.0.0
   ```

### ❌ "Slow performance on emulator"
**Cause:** Emulator resource constraints

**Solutions:**
1. Allocate more RAM to Genymotion virtual device:
   - Stop emulator
   - Genymotion > Select device > Settings
   - Increase RAM to 4GB+

2. Use **Demo Mode** instead of **Full Mode** (lighter weight)

3. Close other apps on Mac to free resources

---

## Network Architecture

Understanding how it works:

```
┌─────────────────────────────────────┐
│  Your Mac (192.168.1.100)          │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Python Server (port 8080)     │ │
│  │ Bound to 0.0.0.0              │ │
│  │                               │ │
│  │ DJ App Files                  │ │
│  └───────────────────────────────┘ │
│              ▲                      │
│              │                      │
│              │ HTTP Request         │
│              │                      │
└──────────────┼──────────────────────┘
               │
               │ Network (Wi-Fi/Ethernet)
               │
┌──────────────▼──────────────────────┐
│  Genymotion Emulator                │
│  (Pixel 7 Android)                  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Chrome Browser                │ │
│  │                               │ │
│  │ http://192.168.1.100:8080/... │ │
│  │                               │ │
│  │ ┌───────────────────────────┐ │ │
│  │ │  BIGO DJ App (Running)    │ │ │
│  │ └───────────────────────────┘ │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Quick Reference Commands

### Start Server (Mac)
```bash
# Navigate to project
cd /path/to/Rich-teve-Bigo-DJ-App-prototype-receipts-roadmap-and-implementation-logs.

# Start server
python3 -m http.server 8080 --bind 0.0.0.0
```

### Find Your IP (Mac)
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

### Check Server Running (Mac)
```bash
lsof -i :8080
```

### Test from Emulator
```
http://YOUR_MAC_IP:8080/app/web/dj-mixer/index.html
```

### Spotify Redirect URIs
```
http://YOUR_MAC_IP:8080/app/web/dj-mixer/callback.html
http://127.0.0.1:8080/app/web/dj-mixer/callback.html
```

---

## Performance Tips

### On Mac (Server Side)
- Close unnecessary applications
- Use **Demo Mode** for lighter load
- Monitor Activity Monitor for resource usage
- Restart server if it becomes unresponsive

### On Genymotion (Emulator Side)
- Close other Android apps
- Disable animations: Settings > Developer Options > Window/Transition animation scale > Off
- Use hardware acceleration (should be enabled by default)
- Don't record while testing (use CUE instead)

---

## Security Notes

⚠️ **Important:**
- The server bound to `0.0.0.0` is accessible to ANY device on your network
- Anyone on your Wi-Fi can access the DJ app
- For private testing, use a firewall or trusted network
- Never expose this setup to the public internet
- The `env.js` file (with Spotify credentials) is gitignored for security

---

## Next Steps

✅ Server running on Mac
✅ Emulator accessing app via network
✅ DJ app loaded in Chrome on Android

**Now you can:**
1. Practice DJ mixing on mobile interface
2. Test BIGO screen share streaming
3. Test SUGO audio room streaming
4. Record your mixes for review
5. Configure Spotify for full music library

---

## Additional Resources

- **Main docs:** See `GETTING_STARTED.md` for app features
- **Quick setup:** See `QUICKSTART.md` for basic usage
- **Spotify API:** https://developer.spotify.com/documentation
- **Genymotion docs:** https://docs.genymotion.com/

---

**Ready to DJ on Android? Let's mix! 🎵🔥**
