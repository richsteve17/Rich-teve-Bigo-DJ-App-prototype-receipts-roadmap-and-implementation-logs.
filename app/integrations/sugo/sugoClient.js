// sugoClient.js
// SUGO WebSocket Client - Connects to room 1250911
// Based on JefeBot's reverse-engineered protocol

/**
 * SUGO WebSocket Client
 * Connects to activity-ws-rpc.voicemaker.media
 * Handles authentication, chat messages, and gift events
 */
export class SUGOClient {
  constructor(config) {
    this.config = {
      roomId: config.roomId || '1250911',
      token: config.token || null,
      uid: config.uid || null
    };

    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;

    // Event callbacks
    this.onGiftReceived = null;
    this.onChatMessage = null;
    this.onPKStart = null;
    this.onPKEnd = null;
    this.onConnected = null;
    this.onDisconnected = null;
  }

  /**
   * Connect to SUGO WebSocket
   */
  connect() {
    if (!this.config.token || !this.config.uid) {
      console.error('[SUGO] Missing credentials. Set token and UID first.');
      return;
    }

    const wsUrl = 'wss://activity-ws-rpc.voicemaker.media/ws/activity';

    console.log(`[SUGO] Connecting to room ${this.config.roomId}...`);

    // Auth is passed via WebSocket subprotocol header (from JefeBot reverse engineering)
    const authData = JSON.stringify({
      token: this.config.token,
      uid: this.config.uid
    });

    try {
      this.ws = new WebSocket(wsUrl, authData);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (err) {
      console.error('[SUGO] Connection failed:', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open
   */
  handleOpen() {
    console.log('[SUGO] ✅ Connected!');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Join room
    this.sendMessage({
      type: 'join_room',
      room_id: this.config.roomId,
      timestamp: Date.now()
    });

    // Start heartbeat (keep connection alive)
    this.startHeartbeat();

    if (this.onConnected) {
      this.onConnected();
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      console.log('[SUGO] 📨 Message:', data);

      // Gift event detection
      if (data.type === 'gift' || data.event === 'gift_received') {
        const giftData = {
          giftId: data.gift_id || data.giftId,
          giftName: data.gift_name || data.giftName,
          count: data.count || 1,
          sender: data.sender || data.from,
          value: data.value || data.diamonds || 0
        };

        if (this.onGiftReceived) {
          this.onGiftReceived(giftData);
        }
      }

      // PK battle detection
      if (data.type === 'pk_start' || data.event === 'battle_start') {
        if (this.onPKStart) {
          this.onPKStart(data);
        }
      }

      if (data.type === 'pk_end' || data.event === 'battle_end') {
        if (this.onPKEnd) {
          this.onPKEnd(data);
        }
      }

      // Chat message
      if (data.type === 'chat' || data.event === 'message') {
        if (this.onChatMessage) {
          this.onChatMessage({
            user: data.user || data.from,
            message: data.message || data.text
          });
        }
      }

    } catch (err) {
      console.error('[SUGO] Failed to parse message:', err);
    }
  }

  /**
   * Handle WebSocket close
   */
  handleClose(event) {
    console.log(`[SUGO] 🔌 Disconnected. Code: ${event.code}`);
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.onDisconnected) {
      this.onDisconnected();
    }

    // Auto-reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error
   */
  handleError(error) {
    console.error('[SUGO] ❌ Error:', error);
  }

  /**
   * Send message to WebSocket
   */
  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[SUGO] Cannot send - not connected');
    }
  }

  /**
   * Send chat message to room
   */
  sendChatMessage(message) {
    this.sendMessage({
      type: 'chat_message',
      room_id: this.config.roomId,
      message: message,
      timestamp: Date.now()
    });
  }

  /**
   * Announce "Now Playing" to chat
   */
  announceNowPlaying(track, artist) {
    const message = `🎧 Now Playing: ${track} - ${artist}`;
    this.sendChatMessage(message);
  }

  /**
   * Send vibe check poll
   */
  sendVibeCheck(songName) {
    this.sendChatMessage(`🔥 VIBE CHECK! 🔥`);
    this.sendChatMessage(`Send a ❤️ if you're feeling "${songName}"!`);
  }

  /**
   * Announce gift shout-out
   */
  announceGift(sender, giftName, value) {
    if (value >= 5000) {
      this.sendChatMessage(`💥💥 ¡QUÉ LOCURA! 💥💥`);
      this.sendChatMessage(`👑 ROYALTY 👑`);
      this.sendChatMessage(`¡Todos saluden a ${sender} por el '${giftName}'!`);
    } else if (value >= 1000) {
      this.sendChatMessage(`🔥 ¡GRANDE ${sender}! 🔥`);
      this.sendChatMessage(`Gracias por el '${giftName}'!`);
    } else if (value >= 100) {
      this.sendChatMessage(`✨ ¡Gracias ${sender}! ✨`);
    }
  }

  /**
   * Start mini-game
   */
  startGame(gameType, duration = 60) {
    switch(gameType) {
      case 'gift_burst':
        this.sendChatMessage(`🔥 ¡REGALO RÁPIDO! (Gift Burst!) 🔥`);
        this.sendChatMessage(`${duration} seconds! Most 'Rose' gifts wins!`);
        this.sendChatMessage(`¡VAMOS!`);
        break;

      case 'family_goal':
        this.sendChatMessage(`🎯 ¡META FAMILIAR! (Family Goal!) 🎯`);
        this.sendChatMessage(`Everybody send gifts! Let's hit the goal together!`);
        this.sendChatMessage(`¡JUNTOS!`);
        break;

      case 'king_of_hill':
        this.sendChatMessage(`👑 ¡REY DE LA COLINA! (King of the Hill!) 👑`);
        this.sendChatMessage(`Last gift sent wins the crown!`);
        this.sendChatMessage(`¡VAMOS!`);
        break;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval

    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({ type: 'ping', timestamp: Date.now() });
    }, 25000); // Every 25 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnect attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[SUGO] Reconnecting in ${delay/1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Update credentials
   */
  setCredentials(token, uid) {
    this.config.token = token;
    this.config.uid = uid;
  }

  /**
   * Disconnect
   */
  disconnect() {
    console.log('[SUGO] Disconnecting...');
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }
}
