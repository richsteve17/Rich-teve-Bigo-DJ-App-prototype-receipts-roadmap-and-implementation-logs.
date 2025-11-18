# 🎧 Mac to iPhone Audio Routing for SUGO DJs

## The Problem

SUGO is **audio-only** and **mobile-only**. When you play Spotify through your iPhone speaker → SUGO mic, the quality is terrible:
- Echo and feedback
- Muffled sound
- Can't talk while music plays
- No professional mixing

## The Solution: Mac Bridge Setup

Route Spotify from your Mac → iPhone → SUGO room with **clean, professional audio**.

---

## What You Need (All FREE)

### Software:
1. ✅ **BlackHole** (Mac virtual audio cable) - [Download](https://existential.audio/blackhole/)
2. ✅ **This DJ Web App** (running on Mac)
3. ✅ **WO Mic** or **Audio Streaming App** (Mac → iPhone audio)
   - WO Mic: [wolicheng.com/womic](http://wolicheng.com/womic)
   - Alternative: Airfoil (paid but better quality)

### Hardware:
- ✅ Mac (for DJ controls + Spotify)
- ✅ iPhone (for SUGO streaming)
- ✅ Same WiFi network (for audio streaming)

---

## Step-by-Step Setup

### Part 1: Install BlackHole on Mac

1. **Download BlackHole 16ch**
   ```bash
   brew install blackhole-16ch
   # OR download from: https://existential.audio/blackhole/
   ```

2. **Create Multi-Output Device** (Audio MIDI Setup)
   - Open **Audio MIDI Setup** (Cmd+Space → type "Audio MIDI")
   - Click the **+** button → Select "Create Multi-Output Device"
   - Check both:
     - ✅ **Built-in Output** (so you can hear on Mac)
     - ✅ **BlackHole 16ch** (virtual cable)
   - Right-click → **Use This Device For Sound Output**

3. **Verify**
   - Play any sound on Mac
   - You should hear it normally
   - BlackHole is capturing it silently in the background

---

### Part 2: Set Up the DJ App

1. **Open DJ App on Mac**
   ```
   Open in Chrome:
   file:///path/to/app/web/dj-mixer/index.html

   OR use GitHub Pages:
   https://richsteve17.github.io/Rich-teve-Bigo-DJ-App-prototype-receipts-roadmap-and-implementation-logs./app/web/dj-mixer/index.html
   ```

2. **Connect Spotify**
   - Click **🎵 Spotify** button
   - Log in with your Premium account
   - Authorize the app

3. **Connect to SUGO**
   - Click **📻 SUGO** button
   - Enter your **token** (from Proxyman capture)
   - Enter your **UID** (from Proxyman capture)
   - Button turns orange when connected: **📻 CONNECTED**

4. **Load Tracks**
   - Search for tracks in the browser
   - Click to load to Deck A or Deck B
   - Use crossfader to mix
   - **"Now Playing" auto-announces to SUGO chat!**

---

### Part 3: Stream Audio to iPhone

#### Option A: WO Mic (Free)

**On Mac:**
1. Download WO Mic Server
2. Install and run
3. Set audio source to **BlackHole 16ch**
4. Select **WiFi** connection
5. Note the IP address shown

**On iPhone:**
1. Download WO Mic app from App Store
2. Open app
3. Select **WiFi** transport
4. Enter your Mac's IP address
5. Tap **Connect**

**In SUGO App:**
1. Open SUGO
2. Start your audio room
3. WO Mic will route Mac audio → iPhone speaker
4. Position iPhone speaker near iPhone mic
   - **OR** use earbuds: one bud near mic, one in ear

#### Option B: Airfoil (Paid, Better Quality)

**On Mac:**
1. Download [Airfoil](https://rogueamoeba.com/airfoil/)
2. Set source to **BlackHole 16ch**
3. Select your iPhone as output device

**On iPhone:**
1. Download Airfoil Satellite (free companion app)
2. Connect to Mac
3. Audio streams wirelessly

---

### Part 4: Optimize Audio Quality

**Mac DJ App Settings:**
- **Crossfader Curve:** Constant Power (smoothest)
- **Master Volume:** 70-80%
- **Individual Deck Volume:** Adjust per track

**WO Mic / Airfoil:**
- **Buffer Size:** Minimum (reduce latency)
- **Sample Rate:** 44.1kHz or 48kHz

**iPhone SUGO App:**
- **Mic Sensitivity:** Medium (avoid clipping)
- Position speaker **5-10cm from mic**
- **Test** before going live!

---

## The Complete Signal Flow

```
Mac DJ App (Chrome)
  ↓
Spotify plays track
  ↓
Audio → BlackHole 16ch (virtual cable)
  ↓
WO Mic Server captures
  ↓
WiFi streaming
  ↓
iPhone: WO Mic app receives
  ↓
iPhone speaker plays
  ↓
iPhone mic captures (positioned near speaker)
  ↓
SUGO audio room receives CLEAN audio
```

---

## SUGO Bot Features (Auto-Engagement)

Once connected, the bot automatically:

### 🎧 "Now Playing" Announcements
Every time you load a track:
```
[Your Name] 🎧 Now Playing: Song Title - Artist Name
```

### 🎁 Gift Triggers
When someone sends gifts:
- **1000+ diamonds** → Air horn sound effect
- **500-999 diamonds** → Kick drum
- **100+ diamonds** → Chat announcement:
  ```
  🔥 ¡GRANDE [sender]! 🔥
  Gracias por el 'Ferrari'!
  ```

### ⚔️ PK Battle Commentary
When a battle starts:
```
[Your Name] 🔴🔵 ¡ES TIEMPO DE BATALLA! 🔴🔵
[Your Name] ¡VAMOS! Let's GO!
```

When it ends:
```
[Your Name] 🏆 ¡BATALLA TERMINADA! 🏆
```

---

## Testing Your Setup

### Before Going Live:

1. **Test Audio Path**
   ```
   Mac: Play a test track
   iPhone: Hear it on WO Mic?
   SUGO: Start a room, listen to yourself
   ```

2. **Test "Now Playing"**
   ```
   Load a track in DJ app
   Check SUGO chat for announcement
   ```

3. **Test Gift Trigger**
   ```
   Have a friend send a small gift
   Check if soundboard triggers
   ```

4. **Adjust Levels**
   - Mac volume: Can you hear it clearly on iPhone?
   - iPhone speaker position: Is SUGO picking it up?
   - SUGO mic sensitivity: Avoid distortion

---

## Troubleshooting

### "No sound reaching iPhone"
- ✅ BlackHole selected in WO Mic source?
- ✅ Multi-Output Device active on Mac?
- ✅ Mac and iPhone on same WiFi?
- ✅ WO Mic connected (green dot)?

### "SUGO not picking up audio"
- ✅ iPhone speaker volume loud enough?
- ✅ Speaker positioned near mic (5-10cm)?
- ✅ SUGO mic sensitivity not muted?

### "Echo in SUGO"
- ❌ Don't use headphones that feed back to mic
- ✅ Position speaker **away** from mic (or use directional trick)
- ✅ Lower iPhone speaker volume slightly

### "Now Playing not announcing"
- ✅ SUGO button shows **📻 CONNECTED**?
- ✅ Check browser console for SUGO errors
- ✅ Verify token/UID are correct (re-capture from Proxyman)

### "Gift triggers not working"
- ✅ Soundboard loaded? (Check console)
- ✅ SUGO WebSocket receiving gift events?
- ✅ Check browser console for errors

---

## Pro Tips

### For Best Audio Quality:
1. **Use Airfoil instead of WO Mic** (if budget allows)
2. **Reduce buffer sizes** (lower latency)
3. **Position iPhone speaker** at 45° angle to mic
4. **Test with headphones** on SUGO before going live

### For Best Engagement:
1. **Load tracks frequently** → More "Now Playing" announcements
2. **Thank gift senders manually** in addition to bot
3. **Use crossfader dramatically** → Build energy
4. **Mix genres** → Keep audience engaged

### Hardware Upgrade Path ($0 → $50):
- **$0:** WO Mic (WiFi streaming)
- **$30:** Airfoil (better quality streaming)
- **$50:** TRRS splitter + cable (iPhone-only, no Mac needed)

---

## Alternative: iPhone-Only Setup (Future)

If you save $10 for a TRRS adapter:
```
iPhone Spotify
  ↓
TRRS splitter
  ├─ Headphone out → Loopback cable → Mic in
  └─ SUGO app captures clean audio
```

**Advantage:** No Mac needed, mobile-only
**Disadvantage:** Requires hardware purchase

---

## What You've Unlocked

✅ **Professional DJ mixing** (crossfader, EQ, beat matching)
✅ **Clean audio in SUGO** (no speaker→mic garbage)
✅ **Auto-engagement** (Now Playing, gift triggers, PK commentary)
✅ **Mobile streaming** (SUGO on iPhone)
✅ **Turkish & Colombian DJ-ready** (share this with your crew!)

---

## Getting Your SUGO Credentials

### You Need:
1. **Token:** `LLAWRORtEXmBfK7Hyj3pd1MOfh3hyu67` (example from JefeBot)
2. **UID:** `47585713` (example)

### How to Get Them:

#### Option 1: Proxyman (Recommended)
1. Install Proxyman on Mac
2. Enable SSL Proxying for `*.sugo.com` and `*.voicemaker.media`
3. Open SUGO app on iPhone (proxied through Mac)
4. Join your room
5. Look for WebSocket connection to `activity-ws-rpc.voicemaker.media`
6. Find token in `Sec-WebSocket-Protocol` header
7. Find UID in connection params

#### Option 2: From JefeBot Repo
- Your token/UID are in JefeBot's `server/index.ts` if you've already captured them

---

## Ready to DJ!

Your Mac is now a **professional SUGO DJ station**:
- Mix tracks like a pro
- Announce automatically
- Trigger effects on gifts
- Engage your sala 24/7

**Build the Rich Legacy! 💰🔥**

---

## Support

Questions? Check:
- JefeBot repo: https://github.com/richsteve17/JefeBot
- DJ App repo: https://github.com/richsteve17/Rich-teve-Bigo-DJ-App-prototype-receipts-roadmap-and-implementation-logs.

¡VAMOS! 🎧🔥
