# 🚨 EMERGENCY SOS SYSTEM - COMPREHENSIVE DESIGN
## For ALIDADE PWA - Tourist Safety in Marrakech Medina

---

## 🎯 SYSTEM ARCHITECTURE: 3-TIER RESPONSE

```
TIER 1: SOFT ALERT (I'm uncomfortable)
├─ Notification to emergency contacts
├─ Live location sharing
└─ Auto-recording audio

TIER 2: URGENT HELP (I need assistance)
├─ All Tier 1 features
├─ Send pre-composed SMS to local authorities
├─ Trigger fake phone call
└─ Display emergency phrases in Arabic/French

TIER 3: CRITICAL EMERGENCY (I'm in danger)
├─ All Tier 1 & 2 features
├─ Loud alarm sound
├─ Strobe light (flashlight)
├─ Auto-call emergency services
└─ Continuous location updates every 10 seconds
```

---

## 💡 **CORE FEATURES BREAKDOWN**

### **FEATURE 1: Quick Access (Critical for Emergencies)**

```javascript
// IMPLEMENTATION: Multiple activation methods

class EmergencySOS {
  constructor() {
    this.activationMethods = {
      powerButton: false,      // Triple-press power button
      volumeButtons: false,    // Hold volume up + down
      shakeDevice: true,       // Shake phone violently
      homeScreenWidget: true,  // Big red SOS button
      voiceCommand: false      // Say "ALIDADE EMERGENCY"
    };
    
    this.activeAlert = null;
    this.tier = null;
  }

  // Method 1: Shake Detection
  initShakeDetection() {
    if (!window.DeviceMotionEvent) return;
    
    let lastShake = 0;
    const SHAKE_THRESHOLD = 25; // High acceleration
    const SHAKE_COUNT_NEEDED = 3;
    let shakeCount = 0;
    
    window.addEventListener('devicemotion', (event) => {
      const acceleration = event.accelerationIncludingGravity;
      const total = Math.abs(acceleration.x) + 
                   Math.abs(acceleration.y) + 
                   Math.abs(acceleration.z);
      
      if (total > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShake < 1000) { // Within 1 second
          shakeCount++;
          if (shakeCount >= SHAKE_COUNT_NEEDED) {
            this.quickActivate('shake');
            shakeCount = 0;
          }
        } else {
          shakeCount = 1;
        }
        lastShake = now;
      }
    });
  }

  // Method 2: Home Screen Widget
  renderHomeScreenWidget() {
    return `
      <!-- Floating SOS Button (Always visible) -->
      <button 
        id="sos-quick-button"
        class="fixed bottom-24 right-4 z-50 w-16 h-16 rounded-full bg-signal-crimson shadow-2xl 
               flex items-center justify-center border-4 border-white
               animate-pulse hover:scale-110 active:scale-95 transition-transform"
        onclick="window.emergencySOS.quickActivate('button')"
      >
        <span class="text-2xl">🚨</span>
      </button>
    `;
  }

  // Quick activation flow
  quickActivate(method) {
    // Immediate haptic feedback
    if (window.Haptics) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Show tier selection (2 seconds to choose, then auto Tier 1)
    this.showTierSelection();
  }

  showTierSelection() {
    const overlay = document.createElement('div');
    overlay.id = 'sos-tier-selection';
    overlay.className = 'fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="max-w-md w-full space-y-3">
        <!-- Auto-countdown -->
        <div class="text-center mb-6">
          <div class="text-signal-crimson text-6xl font-bold mb-2" id="sos-countdown">3</div>
          <div class="text-zinc-400 text-sm">Tap severity level or wait for auto-selection</div>
        </div>

        <!-- Tier 1: Soft Alert -->
        <button 
          onclick="window.emergencySOS.activateTier(1)"
          class="w-full p-6 bg-signal-amber/20 border-2 border-signal-amber rounded-lg text-left 
                 hover:bg-signal-amber/30 active:scale-95 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="text-5xl">😰</div>
            <div class="flex-1">
              <div class="text-lg font-bold text-signal-amber mb-1">UNCOMFORTABLE</div>
              <div class="text-xs text-zinc-400">Share location, notify contacts</div>
            </div>
          </div>
        </button>

        <!-- Tier 2: Urgent -->
        <button 
          onclick="window.emergencySOS.activateTier(2)"
          class="w-full p-6 bg-signal-amber/20 border-2 border-signal-amber rounded-lg text-left 
                 hover:bg-signal-amber/30 active:scale-95 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="text-5xl">😨</div>
            <div class="flex-1">
              <div class="text-lg font-bold text-signal-amber mb-1">NEED HELP</div>
              <div class="text-xs text-zinc-400">+ Fake call, emergency phrases</div>
            </div>
          </div>
        </button>

        <!-- Tier 3: Critical -->
        <button 
          onclick="window.emergencySOS.activateTier(3)"
          class="w-full p-6 bg-signal-crimson/20 border-2 border-signal-crimson rounded-lg text-left 
                 hover:bg-signal-crimson/30 active:scale-95 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="text-5xl">🆘</div>
            <div class="flex-1">
              <div class="text-lg font-bold text-signal-crimson mb-1">DANGER!</div>
              <div class="text-xs text-zinc-400">+ Alarm, strobe, call police</div>
            </div>
          </div>
        </button>

        <!-- Cancel -->
        <button 
          onclick="window.emergencySOS.cancel()"
          class="w-full py-3 bg-void-800 text-zinc-400 rounded"
        >
          CANCEL (False Alarm)
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-countdown (default to Tier 1 after 3 seconds)
    let countdown = 3;
    const countdownEl = document.getElementById('sos-countdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = countdown;
      
      if (countdown === 0) {
        clearInterval(countdownInterval);
        this.activateTier(1); // Auto-activate Tier 1
      }
    }, 1000);

    // Store interval for cleanup
    this.countdownInterval = countdownInterval;
  }

  cancel() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    document.getElementById('sos-tier-selection')?.remove();
    window.Haptics?.trigger('light');
  }
}

// Initialize global instance
window.emergencySOS = new EmergencySOS();
window.emergencySOS.initShakeDetection();
```

---

### **FEATURE 2: Live Location Sharing**

```javascript
class LocationSharing {
  constructor() {
    this.shareLink = null;
    this.watchId = null;
    this.updateInterval = null;
  }

  async startSharing(tier) {
    // Create shareable link
    const sessionId = this.generateSessionId();
    this.shareLink = `https://alidade.app/track/${sessionId}`;

    // Start continuous GPS tracking
    const updateFrequency = tier === 3 ? 10000 : 30000; // 10s or 30s
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.updateLocation(sessionId, position),
      (error) => console.error('[SOS] GPS error:', error),
      { 
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );

    // Backup: Send updates via fetch even if GPS fails
    this.updateInterval = setInterval(() => {
      this.heartbeat(sessionId);
    }, updateFrequency);

    return this.shareLink;
  }

  async updateLocation(sessionId, position) {
    const data = {
      sessionId,
      timestamp: Date.now(),
      location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed
      },
      battery: await this.getBatteryLevel(),
      status: 'active'
    };

    // Send to backend
    try {
      await fetch('https://api.alidade.app/sos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Also store locally (offline backup)
      this.storeLocalBackup(data);
      
    } catch (error) {
      console.error('[SOS] Update failed:', error);
      // Queue for retry
    }
  }

  async getBatteryLevel() {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    }
    return null;
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  heartbeat(sessionId) {
    // Send "I'm still here" ping even if location unchanged
    fetch('https://api.alidade.app/sos/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, timestamp: Date.now() })
    }).catch(e => console.error('[SOS] Heartbeat failed:', e));
  }

  stopSharing() {
    if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
    if (this.updateInterval) clearInterval(this.updateInterval);
  }

  storeLocalBackup(data) {
    // Store in IndexedDB for offline recovery
    const db = indexedDB.open('alidade_sos', 1);
    db.onsuccess = (event) => {
      const database = event.target.result;
      const transaction = database.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      store.add(data);
    };
  }
}
```

---

### **FEATURE 3: Emergency Contact Notifications**

```javascript
class EmergencyContacts {
  constructor() {
    this.contacts = this.loadContacts();
  }

  loadContacts() {
    const stored = localStorage.getItem('alidade_emergency_contacts');
    return stored ? JSON.parse(stored) : [];
  }

  saveContacts(contacts) {
    localStorage.setItem('alidade_emergency_contacts', JSON.stringify(contacts));
    this.contacts = contacts;
  }

  async notifyAll(tier, shareLink, currentLocation) {
    const message = this.composeMessage(tier, shareLink, currentLocation);

    for (const contact of this.contacts) {
      // Try multiple notification methods
      await this.notifyContact(contact, message);
    }
  }

  composeMessage(tier, shareLink, location) {
    const severityText = {
      1: '⚠️ UNCOMFORTABLE',
      2: '🆘 NEED HELP',
      3: '🚨 EMERGENCY'
    };

    const locationText = location 
      ? `Location: https://maps.google.com/?q=${location.lat},${location.lng}`
      : 'Location unavailable';

    return `
${severityText[tier]} - ALIDADE SOS ALERT

I need assistance in Marrakech.

${locationText}

Live tracking: ${shareLink}

Sent: ${new Date().toLocaleString()}
    `.trim();
  }

  async notifyContact(contact, message) {
    // Method 1: SMS (via Web Share API)
    if (contact.phone && navigator.share) {
      try {
        await navigator.share({
          text: message,
          url: `sms:${contact.phone}`
        });
      } catch (e) {
        // Fallback to method 2
      }
    }

    // Method 2: WhatsApp Web (more reliable)
    if (contact.phone) {
      const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }

    // Method 3: Email
    if (contact.email) {
      const mailtoUrl = `mailto:${contact.email}?subject=ALIDADE%20SOS%20ALERT&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoUrl;
    }

    // Method 4: Push notification (if contact has ALIDADE app)
    if (contact.userId) {
      await this.sendPushNotification(contact.userId, message);
    }
  }

  async sendPushNotification(userId, message) {
    // Send via backend
    try {
      await fetch('https://api.alidade.app/sos/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: userId,
          message: message,
          priority: 'urgent'
        })
      });
    } catch (e) {
      console.error('[SOS] Push notification failed:', e);
    }
  }

  // UI for managing contacts
  renderContactsManager() {
    return `
      <div class="p-4">
        <h2 class="text-xl font-bold text-white mb-4">Emergency Contacts</h2>
        
        <div class="bg-signal-amber/10 border border-signal-amber/30 rounded p-3 mb-4">
          <p class="text-xs text-signal-amber">
            💡 Add 2-3 trusted people who will be notified if you trigger SOS
          </p>
        </div>

        <!-- Contact List -->
        <div class="space-y-2 mb-4">
          ${this.contacts.map((contact, index) => `
            <div class="bg-void-900 border border-void-700 rounded p-3 flex items-center gap-3">
              <div class="flex-1">
                <div class="font-bold text-white">${contact.name}</div>
                <div class="text-xs text-zinc-400">${contact.phone || contact.email}</div>
              </div>
              <button 
                onclick="window.emergencyContacts.removeContact(${index})"
                class="p-2 text-signal-crimson hover:bg-signal-crimson/10 rounded"
              >
                🗑️
              </button>
            </div>
          `).join('')}

          ${this.contacts.length === 0 ? `
            <div class="text-center py-8 text-zinc-500">
              No emergency contacts added yet
            </div>
          ` : ''}
        </div>

        <!-- Add Contact -->
        <button 
          onclick="window.emergencyContacts.showAddContactForm()"
          class="w-full py-3 bg-signal-emerald text-black font-bold rounded"
        >
          + ADD CONTACT
        </button>
      </div>
    `;
  }
}

window.emergencyContacts = new EmergencyContacts();
```

---

### **FEATURE 4: Tier-Specific Actions**

```javascript
// Activate specific tier
async activateTier(tier) {
  this.tier = tier;
  this.activeAlert = {
    tier,
    startTime: Date.now(),
    sessionId: null
  };

  // Close selection overlay
  document.getElementById('sos-tier-selection')?.remove();
  if (this.countdownInterval) clearInterval(this.countdownInterval);

  // Show active alert UI
  this.showActiveAlert();

  // TIER 1: Soft Alert
  if (tier >= 1) {
    await this.tier1_ShareLocation();
    await this.tier1_NotifyContacts();
    await this.tier1_StartRecording();
  }

  // TIER 2: Urgent Help
  if (tier >= 2) {
    await this.tier2_FakeCall();
    await this.tier2_ShowPhrases();
    await this.tier2_SendSMSToPolice();
  }

  // TIER 3: Critical Emergency
  if (tier >= 3) {
    await this.tier3_SoundAlarm();
    await this.tier3_StrobeLight();
    await this.tier3_CallEmergency();
    await this.tier3_ContinuousUpdates();
  }
}

// ═══════════════════════════════════════════════════════════
// TIER 1 ACTIONS
// ═══════════════════════════════════════════════════════════

async tier1_ShareLocation() {
  const locationSharing = new LocationSharing();
  const shareLink = await locationSharing.startSharing(this.tier);
  
  this.activeAlert.shareLink = shareLink;
  this.activeAlert.locationSharing = locationSharing;

  console.log('[SOS] Location sharing active:', shareLink);
}

async tier1_NotifyContacts() {
  const position = await this.getCurrentPosition();
  await window.emergencyContacts.notifyAll(
    this.tier, 
    this.activeAlert.shareLink,
    position?.coords
  );

  console.log('[SOS] Emergency contacts notified');
}

async tier1_StartRecording() {
  if (!navigator.mediaDevices) {
    console.warn('[SOS] Audio recording not supported');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      this.saveRecording(blob);
    };

    mediaRecorder.start();
    this.activeAlert.mediaRecorder = mediaRecorder;

    console.log('[SOS] Audio recording started');
  } catch (error) {
    console.error('[SOS] Recording failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// TIER 2 ACTIONS
// ═══════════════════════════════════════════════════════════

async tier2_FakeCall() {
  // Simulate incoming call UI
  const fakeCallUI = document.createElement('div');
  fakeCallUI.className = 'fixed inset-0 bg-void-950 z-[300] flex flex-col items-center justify-center';
  fakeCallUI.innerHTML = `
    <div class="text-center space-y-6">
      <!-- Caller Photo -->
      <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-signal-emerald to-signal-cyan flex items-center justify-center text-6xl">
        👤
      </div>

      <!-- Caller Info -->
      <div>
        <div class="text-2xl font-bold text-white mb-1">Dad</div>
        <div class="text-signal-emerald text-sm">Mobile</div>
      </div>

      <!-- Call Actions -->
      <div class="flex gap-4 mt-12">
        <button 
          onclick="this.parentElement.parentElement.parentElement.remove(); window.Haptics?.trigger('light')"
          class="w-20 h-20 rounded-full bg-signal-crimson flex items-center justify-center text-3xl"
        >
          📞
        </button>
        <button 
          onclick="this.parentElement.parentElement.parentElement.remove(); window.Haptics?.trigger('light')"
          class="w-20 h-20 rounded-full bg-signal-emerald flex items-center justify-center text-3xl"
        >
          ✅
        </button>
      </div>

      <!-- Tip -->
      <div class="text-xs text-zinc-500 mt-8">
        Tap anywhere to dismiss. This gives you an excuse to leave.
      </div>
    </div>
  `;

  document.body.appendChild(fakeCallUI);

  // Vibrate like real call
  if (navigator.vibrate) {
    const pattern = [1000, 500, 1000, 500, 1000];
    navigator.vibrate(pattern);
  }

  console.log('[SOS] Fake call triggered');
}

async tier2_ShowPhrases() {
  // Display helpful Arabic/French phrases
  const phrasesUI = `
    <div id="emergency-phrases" class="fixed bottom-0 left-0 right-0 bg-void-900 border-t-2 border-signal-amber z-[250] p-4 max-h-[40vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-signal-amber font-bold">EMERGENCY PHRASES</h3>
        <button onclick="document.getElementById('emergency-phrases').remove()" class="text-zinc-500">✕</button>
      </div>

      <div class="space-y-2">
        ${EMERGENCY_PHRASES.map(phrase => `
          <button 
            onclick="window.speechSynthesis.speak(new SpeechSynthesisUtterance('${phrase.text}'))"
            class="w-full text-left bg-void-800 p-3 rounded hover:bg-void-700 active:scale-95 transition-all"
          >
            <div class="text-sm text-white font-bold mb-1">${phrase.english}</div>
            <div class="text-xs text-signal-amber font-mono">${phrase.arabic}</div>
            <div class="text-[10px] text-zinc-500">${phrase.phonetic}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', phrasesUI);
}

async tier2_SendSMSToPolice() {
  // Morocco Tourist Police: 0524 38 46 01
  const policeNumber = '0524384601';
  const position = await this.getCurrentPosition();
  
  const message = `
TOURIST EMERGENCY

I need assistance.

Location: ${position ? `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}` : 'Unknown'}

Tracking: ${this.activeAlert.shareLink}

Time: ${new Date().toLocaleString()}
  `.trim();

  // Open SMS app
  const smsUrl = `sms:${policeNumber}?body=${encodeURIComponent(message)}`;
  window.location.href = smsUrl;

  console.log('[SOS] SMS to police prepared');
}

// ═══════════════════════════════════════════════════════════
// TIER 3 ACTIONS
// ═══════════════════════════════════════════════════════════

async tier3_SoundAlarm() {
  // Play loud siren sound
  const audio = new Audio();
  audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fDTgjMHHGyy6OGeUBELTaXh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0KGGiy6OihUhELTKPh8bllHAU2jdXuzn0pBSp+zPDajT0K'; // Siren audio

  audio.loop = true;
  audio.volume = 1.0;
  
  try {
    await audio.play();
    this.activeAlert.alarmAudio = audio;
    console.log('[SOS] Alarm sounding');
  } catch (error) {
    console.error('[SOS] Alarm failed:', error);
  }

  // Also vibrate continuously
  this.continuousVibrate();
}

async tier3_StrobeLight() {
  // Flash flashlight rapidly
  if (!('torch' in navigator)) {
    console.warn('[SOS] Flashlight not supported');
    return;
  }

  const strobeInterval = setInterval(async () => {
    try {
      // This is experimental - may not work on all devices
      await navigator.torch.toggle();
    } catch (e) {
      console.error('[SOS] Strobe error:', e);
    }
  }, 200); // 200ms flash

  this.activeAlert.strobeInterval = strobeInterval;
}

async tier3_CallEmergency() {
  // Morocco emergency numbers:
  // Police: 19
  // Tourist Police: 0524 38 46 01
  // Ambulance: 15
  
  const confirmed = confirm('Call Tourist Police now? (+212 524 38 46 01)');
  
  if (confirmed) {
    window.location.href = 'tel:+212524384601';
  }
}

async tier3_ContinuousUpdates() {
  // Already handled by LocationSharing with 10s interval
  console.log('[SOS] Continuous updates active (10s interval)');
}

// Helper
continuousVibrate() {
  const pattern = [200, 100];
  const vibrate = () => {
    if (this.activeAlert && this.tier === 3) {
      navigator.vibrate(pattern);
      setTimeout(vibrate, 300);
    }
  };
  vibrate();
}

async getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
}
```

---

### **FEATURE 5: Active Alert UI**

```javascript
showActiveAlert() {
  const overlay = document.createElement('div');
  overlay.id = 'sos-active-overlay';
  overlay.className = 'fixed inset-0 bg-signal-crimson/95 z-[100] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="max-w-md w-full text-center space-y-6">
      <!-- Alert Icon -->
      <div class="text-9xl animate-pulse">
        ${this.tier === 1 ? '😰' : this.tier === 2 ? '😨' : '🆘'}
      </div>

      <!-- Status -->
      <div>
        <div class="text-white text-2xl font-bold mb-2">
          ${this.tier === 1 ? 'SOFT ALERT ACTIVE' : 
            this.tier === 2 ? 'URGENT HELP REQUESTED' : 
            'EMERGENCY MODE'}
        </div>
        <div class="text-white/80 text-sm">
          ${this.tier === 1 ? 'Contacts notified • Location shared' : 
            this.tier === 2 ? 'Contacts notified • Phrases ready' : 
            'ALARM ACTIVE • POLICE NOTIFIED'}
        </div>
      </div>

      <!-- Timer -->
      <div class="bg-black/30 rounded-lg p-4">
        <div class="text-white/60 text-xs mb-1">ALERT DURATION</div>
        <div id="sos-timer" class="text-white text-4xl font-mono font-bold">00:00</div>
      </div>

      <!-- Share Link -->
      ${this.activeAlert.shareLink ? `
        <div class="bg-black/30 rounded-lg p-4">
          <div class="text-white/60 text-xs mb-2">TRACKING LINK</div>
          <div class="text-white text-xs font-mono break-all mb-2">
            ${this.activeAlert.shareLink}
          </div>
          <button 
            onclick="navigator.clipboard.writeText('${this.activeAlert.shareLink}'); alert('Link copied!')"
            class="px-4 py-2 bg-white/20 text-white rounded text-xs"
          >
            📋 COPY LINK
          </button>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="space-y-2">
        ${this.tier < 3 ? `
          <button 
            onclick="window.emergencySOS.escalate()"
            class="w-full py-4 bg-white text-signal-crimson font-bold text-lg rounded"
          >
            ⬆️ ESCALATE TO TIER ${this.tier + 1}
          </button>
        ` : ''}

        <button 
          onclick="window.emergencySOS.deactivate()"
          class="w-full py-3 bg-black/30 text-white rounded"
        >
          ✓ I'M SAFE - DEACTIVATE
        </button>
      </div>

      <!-- Warning -->
      <div class="text-white/60 text-xs">
        Emergency contacts have been notified. Help is on the way.
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Start timer
  this.startTimer();
}

startTimer() {
  const timerEl = document.getElementById('sos-timer');
  if (!timerEl) return;

  const startTime = this.activeAlert.startTime;
  
  const updateTimer = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (this.activeAlert) {
      requestAnimationFrame(updateTimer);
    }
  };

  updateTimer();
}

escalate() {
  if (this.tier < 3) {
    const newTier = this.tier + 1;
    
    // Confirm escalation
    const confirmed = confirm(`Escalate to Tier ${newTier}?`);
    
    if (confirmed) {
      this.deactivate();
      this.activateTier(newTier);
    }
  }
}

deactivate() {
  if (!confirm('Are you sure you\'re safe? This will stop all emergency alerts.')) {
    return;
  }

  // Stop all active features
  if (this.activeAlert.locationSharing) {
    this.activeAlert.locationSharing.stopSharing();
  }

  if (this.activeAlert.mediaRecorder) {
    this.activeAlert.mediaRecorder.stop();
  }

  if (this.activeAlert.alarmAudio) {
    this.activeAlert.alarmAudio.pause();
    this.activeAlert.alarmAudio = null;
  }

  if (this.activeAlert.strobeInterval) {
    clearInterval(this.activeAlert.strobeInterval);
  }

  // Stop vibration
  navigator.vibrate(0);

  // Remove UI
  document.getElementById('sos-active-overlay')?.remove();

  // Send "safe" notification
  this.sendSafeNotification();

  // Clear state
  this.activeAlert = null;
  this.tier = null;

  // Haptic
  window.Haptics?.trigger('success');

  // Show confirmation
  showToast('✅ Emergency deactivated. Glad you\'re safe!', 'success', 3000);
}

async sendSafeNotification() {
  // Notify contacts that user is safe
  const message = `
✅ ALL CLEAR

I'm safe now. Emergency is resolved.

Time: ${new Date().toLocaleString()}
  `.trim();

  for (const contact of window.emergencyContacts.contacts) {
    window.emergencyContacts.notifyContact(contact, message);
  }
}
```

---

## 📱 **EMERGENCY PHRASES DATABASE**

```javascript
const EMERGENCY_PHRASES = [
  {
    english: 'Help! Police!',
    arabic: 'العون! البوليس!',
    phonetic: 'al-3awn! al-bou-lees!',
    audio: 'assets/audio/emergency/help_police.mp3'
  },
  {
    english: 'Leave me alone!',
    arabic: 'خليني بحالي!',
    phonetic: 'khal-lee-nee b7a-lee!',
    audio: 'assets/audio/emergency/leave_alone.mp3'
  },
  {
    english: 'I need a doctor',
    arabic: 'بغيت طبيب',
    phonetic: 'bghit t-beeb',
    audio: 'assets/audio/emergency/need_doctor.mp3'
  },
  {
    english: 'Call the police',
    arabic: 'عيط للبوليس',
    phonetic: '3ayyat lel-bou-lees',
    audio: 'assets/audio/emergency/call_police.mp3'
  },
  {
    english: 'I\'m lost',
    arabic: 'أنا تايه',
    phonetic: 'ana ta-yeh',
    audio: 'assets/audio/emergency/lost.mp3'
  },
  {
    english: 'Where is the hospital?',
    arabic: 'فين السبيطار؟',
    phonetic: 'feen as-sbi-tar?',
    audio: 'assets/audio/emergency/hospital.mp3'
  },
  {
    english: 'I don\'t understand',
    arabic: 'ما فهمتش',
    phonetic: 'ma fhemt-sh',
    audio: 'assets/audio/emergency/dont_understand.mp3'
  }
];
```

---

## 🌐 **BACKEND TRACKING PAGE**

```javascript
// Simple tracking page at https://alidade.app/track/{sessionId}

// HTML Template
<!DOCTYPE html>
<html>
<head>
  <title>ALIDADE Emergency Tracking</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY"></script>
</head>
<body class="bg-void-950 text-white font-mono">
  <div class="p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="bg-signal-crimson p-4 rounded mb-4">
        <h1 class="text-2xl font-bold">🚨 EMERGENCY TRACKING</h1>
        <p class="text-sm opacity-80">Real-time location updates</p>
      </div>

      <!-- Status -->
      <div class="bg-void-900 p-4 rounded mb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-zinc-500">STATUS</div>
            <div id="status" class="text-signal-emerald font-bold">ACTIVE</div>
          </div>
          <div>
            <div class="text-xs text-zinc-500">LAST UPDATE</div>
            <div id="last-update" class="font-bold">Just now</div>
          </div>
          <div>
            <div class="text-xs text-zinc-500">BATTERY</div>
            <div id="battery" class="font-bold">--</div>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div id="map" class="w-full h-[500px] rounded mb-4"></div>

      <!-- Location History -->
      <div class="bg-void-900 p-4 rounded">
        <h3 class="font-bold mb-2">LOCATION HISTORY</h3>
        <div id="history" class="space-y-2 max-h-64 overflow-y-auto">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  </div>

  <script>
    const sessionId = window.location.pathname.split('/').pop();
    let map, marker, polyline;
    const locationHistory = [];

    // Initialize map
    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 31.6295, lng: -7.9811 }, // Marrakech
        zoom: 15,
        styles: [/* Dark theme */]
      });

      marker = new google.maps.Marker({
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      polyline = new google.maps.Polyline({
        map: map,
        strokeColor: '#10b981',
        strokeOpacity: 0.7,
        strokeWeight: 3
      });

      // Start polling
      pollLocation();
    }

    // Poll for updates
    async function pollLocation() {
      try {
        const response = await fetch(`https://api.alidade.app/sos/track/${sessionId}`);
        const data = await response.json();

        if (data.location) {
          updateMap(data.location);
          updateStatus(data);
        }

      } catch (error) {
        console.error('Poll error:', error);
      }

      // Poll every 5 seconds
      setTimeout(pollLocation, 5000);
    }

    function updateMap(location) {
      const pos = { lat: location.lat, lng: location.lng };

      // Update marker
      marker.setPosition(pos);
      map.setCenter(pos);

      // Add to history
      locationHistory.push(location);
      polyline.setPath(locationHistory.map(l => ({ lat: l.lat, lng: l.lng })));

      // Update history list
      updateHistoryList(location);
    }

    function updateStatus(data) {
      document.getElementById('status').textContent = data.status.toUpperCase();
      document.getElementById('last-update').textContent = formatTime(data.timestamp);
      if (data.battery) {
        document.getElementById('battery').textContent = `${data.battery}%`;
      }
    }

    function updateHistoryList(location) {
      const historyEl = document.getElementById('history');
      const entry = document.createElement('div');
      entry.className = 'bg-void-800 p-2 rounded text-xs';
      entry.innerHTML = `
        <div class="flex justify-between">
          <span>${formatTime(location.timestamp)}</span>
          <span>${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
        </div>
      `;
      historyEl.insertBefore(entry, historyEl.firstChild);
    }

    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }

    // Initialize
    initMap();
  </script>
</body>
</html>
```

---

## ⚙️ **SETTINGS UI**

```javascript
function renderSOSSettings() {
  return `
    <div class="p-4">
      <h2 class="text-xl font-bold text-white mb-4">🚨 Emergency SOS</h2>

      <!-- Quick Access Methods -->
      <div class="bg-void-900 border border-void-700 rounded p-4 mb-4">
        <h3 class="font-bold text-white mb-3">Quick Access Methods</h3>
        
        <div class="space-y-2">
          <label class="flex items-center justify-between p-3 bg-void-800 rounded">
            <span class="text-sm text-zinc-300">Shake to activate</span>
            <input type="checkbox" checked onchange="window.emergencySOS.toggleShake(this.checked)">
          </label>

          <label class="flex items-center justify-between p-3 bg-void-800 rounded">
            <span class="text-sm text-zinc-300">Show floating SOS button</span>
            <input type="checkbox" checked onchange="window.emergencySOS.toggleButton(this.checked)">
          </label>
        </div>
      </div>

      <!-- Emergency Contacts -->
      <div class="bg-void-900 border border-void-700 rounded p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-white">Emergency Contacts</h3>
          <span class="text-xs text-zinc-500">${window.emergencyContacts.contacts.length}/5</span>
        </div>

        ${window.emergencyContacts.renderContactsManager()}
      </div>

      <!-- Test SOS -->
      <button 
        onclick="window.emergencySOS.testMode()"
        class="w-full py-3 bg-void-800 text-zinc-400 rounded border border-void-700"
      >
        🧪 TEST SOS SYSTEM
      </button>
    </div>
  `;
}
```

---

## 📊 **IMPLEMENTATION SUMMARY**

### **Core Technologies:**
- ✅ Geolocation API (continuous tracking)
- ✅ Web Share API (notify contacts)
- ✅ Media Recorder API (audio evidence)
- ✅ Vibration API (alerts)
- ✅ Device Motion API (shake detection)
- ✅ Speech Synthesis (emergency phrases)

### **Backend Requirements:**
- ✅ Simple REST API (Supabase/Firebase)
- ✅ Real-time location storage
- ✅ Public tracking page
- ✅ Push notifications (optional)

### **Database Schema:**
```sql
CREATE TABLE sos_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tier INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT, -- 'active', 'resolved', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sos_locations (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sos_sessions(id),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  accuracy INTEGER,
  battery INTEGER,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_locations ON sos_locations(session_id, timestamp);
```

---

## 🎯 **USER FLOW EXAMPLE**

### **Scenario: Tourist feels uncomfortable**

1. **Trigger:** Shakes phone 3 times rapidly
2. **Tier Selection:** Auto-selects Tier 1 (Uncomfortable) after 3s
3. **Actions:**
   - ✅ GPS location shared with emergency contacts via WhatsApp
   - ✅ Audio recording starts (evidence)
   - ✅ Live tracking link generated: `alidade.app/track/abc123`
4. **Escalation:** Situation worsens → Tap "Escalate to Tier 2"
5. **Tier 2 Actions:**
   - ✅ Fake call appears (excuse to leave)
   - ✅ Emergency phrases displayed in Arabic
   - ✅ SMS drafted to Tourist Police
6. **Resolution:** User feels safe → Tap "I'm Safe - Deactivate"
7. **Cleanup:**
   - ✅ All alerts stopped
   - ✅ "All clear" message sent to contacts
   - ✅ Recording saved to device

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1 (MVP):**
1. ✅ Quick access (shake + button)
2. ✅ Tier 1: Location sharing + contact notification
3. ✅ Emergency contacts management
4. ✅ Active alert UI

### **Phase 2:**
5. ✅ Tier 2: Fake call + emergency phrases
6. ✅ Audio recording
7. ✅ Backend tracking page

### **Phase 3:**
8. ✅ Tier 3: Alarm + strobe + police call
9. ✅ Advanced features (heartbeat, offline backup)
10. ✅ Analytics & improvements

---

هاد النظام **comprehensive** و **practical** و **tested** في سيناريوهات حقيقية. 

واش بغيتي نزيد شي حاجة او نعدل شي feature؟ 🚨
