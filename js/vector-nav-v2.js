// ═══════════════════════════════════════════════════════════════
// MODULE: MEDINA NAVIGATOR V2 (STANDALONE OVERLAY)
// AR Waypoint Navigation, Landmark Beacons, Danger Zone Alerts
// Independent Canvas Overlay for Vector HUD Integration
// ═══════════════════════════════════════════════════════════════

// ---------------------------------------------------------------
// MARRAKECH LANDMARK DATABASE
// ---------------------------------------------------------------
const MEDINA_LANDMARKS = [
    { id: 'koutoubia', name: 'Koutoubia', icon: '🕌', lat: 31.6237, lng: -7.9933, type: 'monument', color: '#10b981' },
    { id: 'jemaa', name: 'Jemaa el-Fna', icon: '🏛️', lat: 31.6259, lng: -7.9893, type: 'square', color: '#f59e0b' },
    { id: 'bahia', name: 'Bahia Palace', icon: '🏰', lat: 31.6216, lng: -7.9819, type: 'monument', color: '#06b6d4' },
    { id: 'bab_agnaou', name: 'Bab Agnaou', icon: '🚪', lat: 31.6224, lng: -7.9897, type: 'gate', color: '#a78bfa' },
    { id: 'ben_youssef', name: 'Ben Youssef', icon: '📚', lat: 31.6315, lng: -7.9862, type: 'monument', color: '#fb923c' },
    { id: 'dar_bacha', name: 'Dar el Bacha', icon: '☕', lat: 31.6308, lng: -7.9904, type: 'monument', color: '#e879f9' },
    { id: 'bab_debbagh', name: 'Tanneries', icon: '🧶', lat: 31.6319, lng: -7.9794, type: 'craft', color: '#f87171' },
    { id: 'maison_photo', name: 'Maison Photo', icon: '📷', lat: 31.6310, lng: -7.9842, type: 'museum', color: '#38bdf8' },
    { id: 'souks_main', name: 'Main Souks', icon: '🛍️', lat: 31.6295, lng: -7.9870, type: 'market', color: '#fbbf24' },
    { id: 'el_badi', name: 'El Badi Palace', icon: '🏚️', lat: 31.6199, lng: -7.9862, type: 'monument', color: '#d97706' }
];

// ---------------------------------------------------------------
// DANGER ZONE DATABASE
// ---------------------------------------------------------------
const DANGER_ZONES = [
    {
        id: 'fake_guides_jemaa_n', name: "Fake Guide Ambush",
        lat: 31.6269, lng: -7.9876, radius: 60,
        threat: "Aggressive fake guides — will follow you",
        advice: "Walk confidently, say 'La shukran' firmly, don't stop",
        severity: 'high'
    },
    {
        id: 'henna_cluster', name: "Henna Trap",
        lat: 31.6262, lng: -7.9891, radius: 35,
        threat: "Forced henna application — they grab your hand",
        advice: "Keep hands in pockets, ignore completely, don't slow down",
        severity: 'high'
    },
    {
        id: 'tourist_restaurants', name: "Tourist Price Restaurants",
        lat: 31.6255, lng: -7.9885, radius: 80,
        threat: "Restaurants with 2-3x normal prices, fake menus",
        advice: "Check prices BEFORE sitting — compare with side-street restaurants",
        severity: 'medium'
    },
    {
        id: 'carpet_touts', name: "Carpet Shop Touts",
        lat: 31.6300, lng: -7.9860, radius: 50,
        threat: "Will lead you to carpet shops for commission",
        advice: "Decline all 'shortcut' offers, navigate yourself",
        severity: 'medium'
    },
    {
        id: 'moto_hazard_derb', name: "Motorbike Danger Zone",
        lat: 31.6280, lng: -7.9840, radius: 100,
        threat: "Fast motorbikes in narrow alleys — risk of collision",
        advice: "Walk close to walls, listen for horns, check behind you",
        severity: 'low'
    }
];

// Expose static POI/threat datasets for cross-module context sharing
window.MEDINA_LANDMARKS = MEDINA_LANDMARKS;
window.MEDINA_DANGER_ZONES = DANGER_ZONES;


// ---------------------------------------------------------------
// MEDINA NAVIGATOR CLASS (Standalone Overlay)
// ---------------------------------------------------------------

class MedinaNavigator {
    constructor() {
        this.active = false;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;

        // Sensors
        this.userPosition = null;
        this.gpsAccuracy = null;
        this.heading = 0;
        this.watchId = null;

        // Navigation State
        this.activeWaypoint = null;
        this.arrivedThreshold = 15;
        this.alertedZones = new Set();
        this.activeDangerZones = [];
        this.breadcrumbs = [];
        this.maxBreadcrumbs = 200;
        this.lastBreadcrumbTime = 0;

        // Animation
        this._pulsePhase = 0;
        this._arrowBob = 0;
        this._dangerFlash = 0;
        this._frameCount = 0;
        this._lastDiagnosticsUpdate = 0;

        console.log('[NAVIGATOR] 🧭 Standalone V2 Initialized');

        // Auto-start loop
        this._initAutoDetect();
    }

    _initAutoDetect() {
        setInterval(() => {
            const hasNeedle = !!document.getElementById('hud-needle');
            if (hasNeedle && !this.active) {
                console.log('[NAVIGATOR] HUD detected -> Starting Overlay');
                this.start();
            } else if (!hasNeedle && this.active) {
                console.log('[NAVIGATOR] HUD left -> Stopping Overlay');
                this.stop();
            }
        }, 500);
    }

    // === LIFECYCLE ===

    start() {
        if (this.active) return;
        this.active = true;
        this._initOverlay();
        this._bindSensors();
        this._loop();
    }

    stop() {
        this.active = false;
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        window.removeEventListener('deviceorientation', this._handleOrientation);
        cancelAnimationFrame(this.animationId);

        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }

        const diag = document.getElementById('medina-diagnostics');
        if (diag) diag.remove();

        if (window.contextEngine?.setActiveThreats) {
            window.contextEngine.setActiveThreats([], 'medina_navigator_stop');
        }
    }

    _initOverlay() {
        if (document.getElementById('vector-nav-overlay')) return;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'vector-nav-overlay';
        this.canvas.className = 'fixed inset-0 pointer-events-none z-30'; // Above DOM HUD, below modals
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // === SENSORS ===

    _bindSensors() {
        // GPS
        if (navigator.geolocation) {
            this.watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    this.userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    // Debug Override if needed: 
                    // this.userPosition = { lat: 31.6260, lng: -7.9890 }; 
                    this.gpsAccuracy = pos.coords.accuracy;
                    this._onPositionUpdate();
                },
                (err) => console.warn('[NAV] GPS Error:', err),
                { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
            );
        }

        // Compass
        this._handleOrientation = (e) => {
            let heading = e.webkitCompassHeading || e.alpha;
            if (e.webkitCompassHeading) {
                // iOS
                this.heading = heading;
            } else {
                // Android (approximate, might need compensation)
                this.heading = 360 - heading;
            }
        };
        window.addEventListener('deviceorientation', this._handleOrientation, true);
    }

    _onPositionUpdate() {
        // Breadcrumbs & Logic
        const now = Date.now();
        if (now - this.lastBreadcrumbTime > 5000 && this.userPosition) {
            this.breadcrumbs.push({ ...this.userPosition, t: now });
            if (this.breadcrumbs.length > this.maxBreadcrumbs) this.breadcrumbs.shift();
            this.lastBreadcrumbTime = now;
        }

        if (this.userPosition && window.contextEngine?.updateLocation) {
            window.contextEngine.updateLocation(this.userPosition.lat, this.userPosition.lng, {
                source: 'medina_navigator',
                accuracy: this.gpsAccuracy
            }).catch((e) => console.warn('[CONTEXT] Navigator location sync failed:', e.message));
        }

        this._checkDangerZones();
        this._checkWaypointArrival();
    }

    // === RENDER LOOP ===

    _loop() {
        if (!this.active || !this.ctx) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        // Update Animation State
        this._frameCount++;
        this._pulsePhase += 0.04;
        this._arrowBob = Math.sin(this._pulsePhase * 2) * 3;
        this._dangerFlash = (Math.sin(this._pulsePhase * 4) + 1) / 2;

        // Draw Layers
        this._drawLandmarkBeacons(w, this.heading);

        if (this.activeWaypoint && this.userPosition) {
            this._drawWaypointArrow(w, h, this.heading);
        }

        if (this.activeDangerZones.length > 0) {
            this._drawDangerEdge(w, h);
        }

        this._drawGPSStatus(w, h);

        // DOM Updates (throttled)
        if (this._frameCount % 10 === 0) {
            this.updateDOMOverlay();
        }

        this.animationId = requestAnimationFrame(() => this._loop());
    }

    // === DRAWING HELPERS (BEAST MODE 🦁) ===

    _drawLandmarkBeacons(w, heading) {
        if (!this.userPosition) return;
        const fov = 80;
        const ppd = w / fov;
        const topY = 60; // Below compass DOM

        MEDINA_LANDMARKS.forEach(lm => {
            const dist = this._distance(this.userPosition.lat, this.userPosition.lng, lm.lat, lm.lng);
            if (dist > 3000) return;

            const bearing = this._bearing(this.userPosition.lat, this.userPosition.lng, lm.lat, lm.lng);
            let diff = bearing - heading;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            if (Math.abs(diff) > fov / 2 + 5) return;

            const x = w / 2 + diff * ppd;
            const opacity = Math.max(0.15, 1 - Math.abs(diff) / (fov / 2));

            this.ctx.save();
            this.ctx.globalAlpha = opacity;

            // NEON GLOW
            this.ctx.shadowColor = lm.color;
            this.ctx.shadowBlur = 15;

            // PULSING DOT
            const pulse = 1 + Math.sin(this._pulsePhase + lm.lat * 100) * 0.2;
            const dotR = dist < 200 ? 6 * pulse : 4 * pulse;

            this.ctx.fillStyle = lm.color;
            this.ctx.beginPath();
            this.ctx.arc(x, topY, dotR, 0, Math.PI * 2);
            this.ctx.fill();

            // HOT CORE
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(x, topY, dotR * 0.4, 0, Math.PI * 2);
            this.ctx.fill();

            // ICON
            this.ctx.font = 'bold 10px monospace';
            this.ctx.fillStyle = lm.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(lm.icon, x, topY + 16);

            this.ctx.restore();
        });
    }

    _drawWaypointArrow(w, h, heading) {
        const wp = this.activeWaypoint;
        const bearing = this._bearing(this.userPosition.lat, this.userPosition.lng, wp.lat, wp.lng);
        let angle = bearing - heading;
        if (angle > 180) angle -= 360;
        if (angle < -180) angle += 360;

        const cx = w / 2;
        const cy = h * 0.42;

        this.ctx.save();

        if (Math.abs(angle) <= 40) {
            // FORWARD ARROW
            const offsetX = (angle / 40) * (w * 0.3);
            const px = cx + offsetX;
            const py = cy + this._arrowBob;

            this.ctx.translate(px, py);
            this.ctx.rotate(angle * Math.PI / 180 * 0.5); // Dampened rotation

            // NEON GLOW
            this.ctx.shadowColor = '#10b981';
            this.ctx.shadowBlur = 25;
            this.ctx.strokeStyle = '#10b981';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // DRAW CHEVRONS
            const s = 24;
            for (let i = 0; i < 2; i++) {
                const oy = i * 14;
                this.ctx.globalAlpha = i === 0 ? 1 : 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(-s, s * 0.6 + oy);
                this.ctx.lineTo(0, oy);
                this.ctx.lineTo(s, s * 0.6 + oy);
                this.ctx.stroke();
            }
        } else {
            // OFF-SCREEN INDICATOR
            const isRight = angle > 0;
            const edgeX = isRight ? w - 25 : 25;
            const edgeY = cy;

            // Pulsing Edge
            const pulse = 0.6 + Math.sin(this._pulsePhase * 3) * 0.4;
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = '#10b981';
            this.ctx.shadowColor = '#10b981';
            this.ctx.shadowBlur = 20;

            this.ctx.beginPath();
            if (isRight) {
                this.ctx.moveTo(edgeX + 15, edgeY);
                this.ctx.lineTo(edgeX - 5, edgeY - 12);
                this.ctx.lineTo(edgeX - 5, edgeY + 12);
            } else {
                this.ctx.moveTo(edgeX - 15, edgeY);
                this.ctx.lineTo(edgeX + 5, edgeY - 12);
                this.ctx.lineTo(edgeX + 5, edgeY + 12);
            }
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    _drawGPSStatus(w, h) {
        const x = w - 16;
        const y = h - 20;
        this.ctx.save();
        this.ctx.textAlign = 'right';

        if (!this.userPosition) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 10px monospace';
            this.ctx.fillText('NO SIGNAL', x, y);
        } else {
            const acc = this.gpsAccuracy || 999;
            const strength = acc < 15 ? 3 : (acc < 35 ? 2 : 1);

            // DOTS
            for (let i = 0; i < 3; i++) {
                const isActive = (2 - i) < strength;
                const dotX = x - (i * 7);

                this.ctx.beginPath();
                this.ctx.arc(dotX - 60, y - 3, 3, 0, Math.PI * 2);
                if (isActive) {
                    this.ctx.fillStyle = strength === 3 ? '#10b981' : (strength === 2 ? '#f59e0b' : '#ef4444');
                    this.ctx.shadowColor = this.ctx.fillStyle;
                    this.ctx.shadowBlur = 10;
                } else {
                    this.ctx.fillStyle = '#3f3f46';
                    this.ctx.shadowBlur = 0;
                }
                this.ctx.fill();
            }

            // TEXT
            this.ctx.fillStyle = strength === 3 ? '#10b981' : '#f59e0b';
            this.ctx.shadowBlur = 0;
            this.ctx.font = 'bold 10px monospace';
            this.ctx.fillText(`GPS: ±${Math.round(acc)}m`, x, y);
        }
        this.ctx.restore();
    }

    _drawDangerEdge(w, h) {
        // Red glow on edges if inside danger zone
        const inside = this.activeDangerZones.some(z => z.status === 'inside');
        if (!inside) return;

        const intensity = 0.2 + this._dangerFlash * 0.2;
        const grad = this.ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `rgba(239,68,68,${intensity})`);
        grad.addColorStop(0.15, 'transparent');
        grad.addColorStop(0.85, 'transparent');
        grad.addColorStop(1, `rgba(239,68,68,${intensity})`);

        this.ctx.save();
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.restore();
    }

    // === DOM SYNC ===

    updateDOMOverlay() {
        // Targeted DOM updates for app.js elements
        const targetEl = document.getElementById('hud-target-name');
        const distEl = document.getElementById('hud-distance');
        const bearingEl = document.getElementById('hud-bearing');

        if (targetEl) {
            if (this.activeWaypoint) {
                targetEl.textContent = this.activeWaypoint.name.toUpperCase();
                targetEl.className = "text-xs text-emerald-400 font-mono font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]";
            } else {
                targetEl.textContent = "NO TARGET";
                targetEl.className = "text-xs text-zinc-600 font-mono font-bold";
            }
        }

        if (distEl && this.activeWaypoint && this.userPosition) {
            const dist = this._distance(this.userPosition.lat, this.userPosition.lng, this.activeWaypoint.lat, this.activeWaypoint.lng);
            distEl.textContent = dist >= 1000 ? `${(dist / 1000).toFixed(1)} KM` : `${Math.round(dist)} M`;
            distEl.className = "text-xl text-emerald-400 font-mono font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        }

        // Diagnostics panel: AR status, danger-zone state, and GPS quality.
        // Keep updates throttled so we do not churn DOM every frame.
        const now = Date.now();
        if (now - this._lastDiagnosticsUpdate > 350) {
            this._ensureDiagnosticsRows();
            this._updateDiagnosticsRows();
            this._lastDiagnosticsUpdate = now;
        }
    }

    _ensureDiagnosticsRows() {
        const statusEl = document.getElementById('hud-status');
        if (!statusEl) return;
        const statusCard = statusEl.parentElement?.parentElement;
        if (!statusCard) return;
        if (document.getElementById('medina-diagnostics')) return;

        const block = document.createElement('div');
        block.id = 'medina-diagnostics';
        block.className = 'mt-3 pt-3 border-t border-zinc-700/40 space-y-1';
        block.innerHTML = `
            <p id="diag-ar" class="text-[11px] text-zinc-400 font-mono">AR: STANDBY</p>
            <p id="diag-danger" class="text-[11px] text-zinc-400 font-mono">DANGER: MONITORING</p>
            <p id="diag-gps" class="text-[11px] text-zinc-400 font-mono">GPS QUALITY: ...</p>
        `;
        statusCard.appendChild(block);
    }

    _setDiag(id, text, colorClass = 'text-zinc-400') {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = `text-[11px] font-mono ${colorClass}`;
    }

    _updateDiagnosticsRows() {
        const hasWaypoint = !!this.activeWaypoint;
        const hasPosition = !!this.userPosition;

        // 1) AR Arrow visibility state
        if (!hasWaypoint) {
            this._setDiag('diag-ar', 'AR: SELECT A WAYPOINT TO ACTIVATE AR ARROW', 'text-zinc-500');
        } else if (!hasPosition) {
            this._setDiag('diag-ar', 'AR: WAITING FOR GPS POSITION...', 'text-amber-400');
        } else {
            const bearing = this._bearing(
                this.userPosition.lat,
                this.userPosition.lng,
                this.activeWaypoint.lat,
                this.activeWaypoint.lng
            );
            let diff = bearing - this.heading;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            if (Math.abs(diff) <= 40) {
                this._setDiag('diag-ar', `AR: ARROW ON-SCREEN -> ${Math.round(Math.abs(diff))} deg OFFSET`, 'text-emerald-400');
            } else if (diff > 0) {
                this._setDiag('diag-ar', `AR: TURN RIGHT ${Math.round(diff)} deg TO CENTER ARROW`, 'text-amber-400');
            } else {
                this._setDiag('diag-ar', `AR: TURN LEFT ${Math.round(Math.abs(diff))} deg TO CENTER ARROW`, 'text-amber-400');
            }
        }

        // 2) Danger-zone state
        if (!hasPosition) {
            this._setDiag('diag-danger', 'DANGER: WAITING FOR GPS...', 'text-zinc-500');
        } else {
            const jemaa = MEDINA_LANDMARKS.find((l) => l.id === 'jemaa') || { lat: 31.6259, lng: -7.9893 };
            const distToMedina = this._distance(this.userPosition.lat, this.userPosition.lng, jemaa.lat, jemaa.lng);

            const inside = this.activeDangerZones.find((z) => z.status === 'inside');
            const approaching = this.activeDangerZones.find((z) => z.status === 'approaching');

            if (inside) {
                this._setDiag('diag-danger', `DANGER: INSIDE ${inside.name.toUpperCase()} (${inside.distance}m)`, 'text-red-400');
            } else if (approaching) {
                this._setDiag('diag-danger', `DANGER: APPROACHING ${approaching.name} (${approaching.distance}m)`, 'text-amber-400');
            } else if (distToMedina > 10000) {
                this._setDiag('diag-danger', `DANGER: OUTSIDE MEDINA RANGE (${(distToMedina / 1000).toFixed(0)}km)`, 'text-zinc-500');
            } else {
                this._setDiag('diag-danger', 'DANGER: NO SCAM HOTSPOTS NEARBY', 'text-emerald-400');
            }
        }

        // 3) GPS quality (signal-strength style)
        const acc = this.gpsAccuracy || null;
        if (!acc) {
            this._setDiag('diag-gps', 'GPS QUALITY: NO SIGNAL', 'text-red-400');
            return;
        }

        let quality;
        let bars;
        let color;
        if (acc < 15) {
            quality = 'HIGH';
            bars = '[***]';
            color = 'text-emerald-400';
        } else if (acc < 35) {
            quality = 'MEDIUM';
            bars = '[**-]';
            color = 'text-amber-400';
        } else {
            quality = 'LOW';
            bars = '[*--]';
            color = 'text-red-400';
        }
        this._setDiag('diag-gps', `GPS QUALITY: ${quality} ${bars} (+/-${Math.round(acc)}m)`, color);
    }

    // === LOGIC ===

    setWaypoint(lat, lng, name, icon) {
        this.activeWaypoint = { lat, lng, name, icon };
        if (window.Haptics) window.Haptics.trigger('success');
    }

    clearWaypoint() {
        this.activeWaypoint = null;
    }

    setLandmarkWaypoint(id) {
        const lm = MEDINA_LANDMARKS.find(l => l.id === id);
        if (lm) this.setWaypoint(lm.lat, lm.lng, lm.name, lm.icon);
    }

    _checkWaypointArrival() {
        if (!this.activeWaypoint || !this.userPosition) return;
        const dist = this._distance(this.userPosition.lat, this.userPosition.lng, this.activeWaypoint.lat, this.activeWaypoint.lng);
        if (dist < this.arrivedThreshold) {
            this.clearWaypoint();
            if (window.Haptics) window.Haptics.trigger('success');
            // Toast logic if needed
        }
    }

    _checkDangerZones() {
        if (!this.userPosition) return;
        this.activeDangerZones = [];
        DANGER_ZONES.forEach(z => {
            const dist = this._distance(this.userPosition.lat, this.userPosition.lng, z.lat, z.lng);
            if (dist < z.radius) {
                this.activeDangerZones.push({ ...z, status: 'inside', distance: Math.round(dist) });
                if (!this.alertedZones.has(z.id)) {
                    this._triggerAlert(z);
                    this.alertedZones.add(z.id);
                }
            } else if (dist < z.radius * 1.5) {
                this.activeDangerZones.push({ ...z, status: 'approaching', distance: Math.round(dist) });
            } else {
                this.alertedZones.delete(z.id);
            }
        });

        if (window.contextEngine?.setActiveThreats) {
            window.contextEngine.setActiveThreats(this.activeDangerZones, 'medina_navigator');
        }
    }

    _triggerAlert(zone) {
        // Create Alert DOM
        const div = document.createElement('div');
        div.className = 'fixed top-20 left-4 right-4 bg-red-950/90 border-2 border-red-500 text-white p-4 rounded-lg z-50 animate-bounce';
        div.innerHTML = `⚠️ <b>${zone.name}</b><br><span class="text-xs">${zone.threat}</span>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
        if (window.Haptics) window.Haptics.trigger('warning');

        if (window.sessionIntel?.logActivity) {
            window.sessionIntel.logActivity('threat_avoided', {
                threatId: zone.id,
                threatName: zone.name,
                severity: zone.severity
            });
        }
    }

    // === UTILS ===

    _distance(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    _bearing(lat1, lng1, lat2, lng2) {
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }
}

// ---------------------------------------------------------------
// WAYPOINT PANEL UI
// ---------------------------------------------------------------

function hideWaypointPanel() {
    const panel = document.getElementById('waypoint-panel');
    if (panel) panel.remove();
}

function showWaypointToast(message, isError = false) {
    const existing = document.getElementById('waypoint-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'waypoint-toast';
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-md border text-xs font-mono ${isError
        ? 'bg-red-950/95 border-red-500 text-red-200'
        : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
        }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2200);
}

function selectMedinaWaypoint(id) {
    const lm = MEDINA_LANDMARKS.find((item) => item.id === id);
    if (!lm) {
        showWaypointToast('Waypoint not found.', true);
        return;
    }
    if (!window.medinaNav) {
        showWaypointToast('Navigator is not ready yet.', true);
        return;
    }

    window.medinaNav.setLandmarkWaypoint(id);
    hideWaypointPanel();
    showWaypointToast(`Target locked: ${lm.name}`);
}

function clearMedinaWaypoint() {
    if (window.medinaNav) {
        window.medinaNav.clearWaypoint();
    }
    hideWaypointPanel();
    showWaypointToast('Waypoint cleared.');
}

function showWaypointPanel() {
    hideWaypointPanel();

    const panel = document.createElement('div');
    panel.id = 'waypoint-panel';
    panel.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-end sm:items-center sm:justify-center';

    const options = MEDINA_LANDMARKS.map((lm) => `
        <button
            onclick="window.selectMedinaWaypoint('${lm.id}')"
            class="w-full flex items-center justify-between px-3 py-3 rounded-md border border-zinc-700 bg-zinc-900/80 hover:border-emerald-500/60 hover:bg-zinc-800/90 transition-colors"
        >
            <span class="text-sm text-zinc-200">${lm.name}</span>
            <span class="text-xs text-zinc-500">${lm.type.toUpperCase()}</span>
        </button>
    `).join('');

    panel.innerHTML = `
        <div class="w-full sm:max-w-md bg-zinc-950 border border-zinc-700 rounded-lg p-4 space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-mono font-bold text-emerald-400">WAYPOINT NAVIGATION</h3>
                <button onclick="window.hideWaypointPanel()" class="text-zinc-400 hover:text-white text-sm">Close</button>
            </div>

            <div class="text-xs text-zinc-400 space-y-1">
                <p>How To Use:</p>
                <p>1. Pick a landmark below.</p>
                <p>2. Keep VECTOR HUD open and walk.</p>
                <p>3. Follow the arrow until arrival.</p>
                <p>4. Danger alerts trigger automatically near hotspots.</p>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                ${options}
            </div>

            <div class="grid grid-cols-2 gap-2">
                <button onclick="window.clearMedinaWaypoint()" class="py-2 text-xs font-mono rounded-md border border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800">
                    CLEAR TARGET
                </button>
                <button onclick="window.hideWaypointPanel()" class="py-2 text-xs font-mono rounded-md border border-emerald-700 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50">
                    DONE
                </button>
            </div>
        </div>
    `;

    panel.addEventListener('click', (e) => {
        if (e.target === panel) hideWaypointPanel();
    });

    document.body.appendChild(panel);
}

// ---------------------------------------------------------------
// EXPORT & INIT
// ---------------------------------------------------------------
window.MedinaNavigator = MedinaNavigator;
window.medinaNav = new MedinaNavigator();
window.showWaypointPanel = showWaypointPanel;
window.hideWaypointPanel = hideWaypointPanel;
window.selectMedinaWaypoint = selectMedinaWaypoint;
window.clearMedinaWaypoint = clearMedinaWaypoint;
// alert('VECTOR NAV V2 STANDALONE LOADED! 🦁'); // Uncomment for debug
