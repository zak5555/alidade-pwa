(function initAlidadeVectorHudUtils(windowObj) {
    if (!windowObj) return;

    const vectorHudUtils = windowObj.ALIDADE_VECTOR_HUD_UTILS || {};

    if (typeof vectorHudUtils.resolveVectorHudInit !== 'function') {
        vectorHudUtils.resolveVectorHudInit = function resolveVectorHudInit(
            hud,
            documentObj,
            windowObjParam,
            consoleObj
        ) {
            try {
                let container = documentObj.getElementById('vector-hud-layer');
                if (!container) {
                    if (consoleObj && typeof consoleObj.log === 'function') {
                        consoleObj.log('[HUD] 🛠️ Injecting HUD layer...');
                    }
                    container = documentObj.createElement('div');
                    container.id = 'vector-hud-layer';
                    container.className = 'fixed inset-0 z-50 pointer-events-none overflow-hidden';
                    container.innerHTML = `
                    <canvas id="vector-hud-canvas" class="w-full h-full opacity-0 transition-opacity duration-1000"></canvas>
                    <div id="hud-status" class="absolute top-4 right-4 text-[10px] font-mono text-signal-emerald tracking-widest hidden">
                        HUD ONLINE <span class="animate-pulse">●</span>
                    </div>
                    <div id="hud-error" class="hidden absolute inset-0 flex items-center justify-center bg-void-950/80 backdrop-blur-sm pointer-events-auto">
                        <div class="text-center p-6 border border-signal-crimson/30 bg-void-900/90 rounded-machined max-w-xs shadow-lg shadow-red-900/20">
                            <h3 class="text-signal-crimson font-mono font-bold text-lg mb-2 flex items-center justify-center gap-2">
                                <span class="text-xl">⚠️</span> SENSOR ERROR
                            </h3>
                            <p class="text-zinc-400 text-xs font-mono mb-4">MAGNETOMETER DATA UNAVAILABLE</p>
                            <button onclick="document.getElementById('hud-error').classList.add('hidden')" class="px-4 py-2 bg-void-800 text-zinc-300 text-xs font-mono border border-void-700 rounded hover:bg-void-700">DISMISS</button>
                        </div>
                    </div>
                `;
                    documentObj.body.appendChild(container);
                }

                hud.canvas = documentObj.getElementById('vector-hud-canvas');
                hud.ctx = hud.canvas.getContext('2d');
                if (typeof hud.resize === 'function') {
                    hud.resize();
                }

                windowObjParam.addEventListener('resize', () => {
                    clearTimeout(hud.resizeTimer);
                    hud.resizeTimer = setTimeout(() => hud.resize(), 100);
                });

                if (consoleObj && typeof consoleObj.log === 'function') {
                    consoleObj.log('[HUD] ✅ System Initialized');
                }
                return true;
            } catch (e) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[HUD] 💥 Init Failed:', e);
                }
                return false;
            }
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudStart !== 'function') {
        vectorHudUtils.resolveVectorHudStart = async function resolveVectorHudStart(
            hud,
            windowObjParam,
            consoleObj
        ) {
            if (!windowObjParam.DeviceOrientationEvent) {
                if (typeof hud.showError === 'function') {
                    hud.showError('SENSORS NOT SUPPORTED');
                }
                return false;
            }

            try {
                if (typeof windowObjParam.DeviceOrientationEvent.requestPermission === 'function') {
                    const permissionState = await windowObjParam.DeviceOrientationEvent.requestPermission();
                    if (permissionState === 'granted') {
                        if (typeof hud._bindSensors === 'function') {
                            hud._bindSensors();
                        }
                    } else if (typeof hud.showError === 'function') {
                        hud.showError('PERMISSION DENIED');
                    }
                } else if (typeof hud._bindSensors === 'function') {
                    hud._bindSensors();
                }
                return true;
            } catch (e) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[HUD] 🚨 Sensor Start Error:', e);
                }
                if (typeof hud.showError === 'function') {
                    hud.showError('SENSOR INIT FAILURE');
                }
                return false;
            }
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudBindSensors !== 'function') {
        vectorHudUtils.resolveVectorHudBindSensors = function resolveVectorHudBindSensors(
            hud,
            windowObjParam,
            documentObj,
            consoleObj
        ) {
            try {
                windowObjParam.addEventListener('deviceorientation', (e) => hud._handleOrientation(e));

                hud.active = true;
                if (hud.canvas) hud.canvas.classList.remove('opacity-0');
                const status = documentObj.getElementById('hud-status');
                if (status) status.classList.remove('hidden');

                if (typeof hud._loop === 'function') {
                    hud._loop();
                }
                if (consoleObj && typeof consoleObj.log === 'function') {
                    consoleObj.log('[HUD] 🟢 Sensors Active');
                }
                return true;
            } catch (e) {
                if (typeof hud.showError === 'function') {
                    hud.showError('BINDING FAILED');
                }
                return false;
            }
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudHandleOrientation !== 'function') {
        vectorHudUtils.resolveVectorHudHandleOrientation = function resolveVectorHudHandleOrientation(hud, eventObj) {
            hud.orientation.alpha = eventObj.alpha !== null ? eventObj.alpha : 0;
            hud.orientation.beta = eventObj.beta !== null ? eventObj.beta : 0;
            hud.orientation.gamma = eventObj.gamma !== null ? eventObj.gamma : 0;

            if (eventObj.webkitCompassHeading) {
                hud.orientation.alpha = eventObj.webkitCompassHeading;
            }
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudShowError !== 'function') {
        vectorHudUtils.resolveVectorHudShowError = function resolveVectorHudShowError(
            documentObj,
            msg,
            consoleObj
        ) {
            const errEl = documentObj.getElementById('hud-error');
            if (errEl) {
                const p = errEl.querySelector('p');
                if (p) p.textContent = msg;
                errEl.classList.remove('hidden');
            }
            if (consoleObj && typeof consoleObj.warn === 'function') {
                consoleObj.warn(`[HUD] Displaying Error: ${msg}`);
            }
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudResize !== 'function') {
        vectorHudUtils.resolveVectorHudResize = function resolveVectorHudResize(hud, windowObjParam) {
            if (hud.canvas) {
                const dpr = windowObjParam.devicePixelRatio || 1;
                hud.canvas.width = windowObjParam.innerWidth * dpr;
                hud.canvas.height = windowObjParam.innerHeight * dpr;

                hud.ctx.scale(dpr, dpr);

                hud.canvas.style.width = `${windowObjParam.innerWidth}px`;
                hud.canvas.style.height = `${windowObjParam.innerHeight}px`;
            }
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudLoop !== 'function') {
        vectorHudUtils.resolveVectorHudLoop = function resolveVectorHudLoop(hud, windowObjParam) {
            if (!hud.active) return false;

            hud.ctx.clearRect(0, 0, windowObjParam.innerWidth, windowObjParam.innerHeight);
            if (typeof hud._drawCompass === 'function') {
                hud._drawCompass(hud.orientation.alpha);
            }
            if (typeof hud._drawHorizon === 'function') {
                hud._drawHorizon(hud.orientation.beta, hud.orientation.gamma);
            }

            hud.animationId = windowObjParam.requestAnimationFrame(() => hud._loop());
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudDrawCompass !== 'function') {
        vectorHudUtils.resolveVectorHudDrawCompass = function resolveVectorHudDrawCompass(hud, heading, windowObjParam) {
            const w = windowObjParam.innerWidth;
            const ctx = hud.ctx;

            ctx.save();
            ctx.strokeStyle = '#10b981';
            ctx.fillStyle = '#10b981';
            ctx.lineWidth = 1;
            ctx.font = '10px monospace';

            const centerX = w / 2;
            const topY = 40;
            const fov = 80;
            const pixelsPerDegree = w / fov;

            const startDeg = Math.floor(heading - (fov / 2));
            const endDeg = Math.ceil(heading + (fov / 2));

            for (let i = startDeg; i <= endDeg; i++) {
                const diff = i - heading;
                const x = centerX + (diff * pixelsPerDegree);

                let normDeg = i % 360;
                if (normDeg < 0) normDeg += 360;

                const isMajor = normDeg % 90 === 0;
                const isMedium = normDeg % 45 === 0;
                const isMinor = normDeg % 5 === 0;

                if (!isMinor) continue;

                const height = isMajor ? 12 : (isMedium ? 8 : 4);
                const opacity = Math.max(0.1, 1 - (Math.abs(diff) / (fov / 2.5)));

                ctx.globalAlpha = opacity;

                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, topY + height);
                ctx.stroke();

                if (isMajor || isMedium) {
                    let label = '';
                    if (normDeg === 0 || normDeg === 360) label = 'N';
                    else if (normDeg === 90) label = 'E';
                    else if (normDeg === 180) label = 'S';
                    else if (normDeg === 270) label = 'W';
                    else if (isMajor) label = `${normDeg}`;

                    if (label) {
                        ctx.font = 'bold 12px monospace';
                        const textWidth = ctx.measureText(label).width;
                        ctx.fillText(label, x - (textWidth / 2), topY + 28);
                    } else if (!isMedium) {
                        // Number for 15? No, too crowded
                    }
                }
            }

            ctx.globalAlpha = 1;
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(centerX, topY + 15);
            ctx.lineTo(centerX - 6, topY + 24);
            ctx.lineTo(centerX + 6, topY + 24);
            ctx.fill();

            ctx.restore();
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudDrawHorizon !== 'function') {
        vectorHudUtils.resolveVectorHudDrawHorizon = function resolveVectorHudDrawHorizon(
            hud,
            beta,
            gamma,
            windowObjParam
        ) {
            const w = windowObjParam.innerWidth;
            const h = windowObjParam.innerHeight;
            const ctx = hud.ctx;

            const cy = h / 2;
            void cy;

            ctx.save();
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.lineWidth = 1;

            ctx.translate(w / 2, h / 2);
            ctx.rotate((gamma * Math.PI) / 180);

            const pitchOffset = -beta * 3;

            ctx.beginPath();
            ctx.moveTo(-w, 0 + pitchOffset);
            ctx.lineTo(w, 0 + pitchOffset);
            ctx.stroke();

            ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
            for (let i = -1; i <= 1; i += 2) {
                const offset = pitchOffset + (i * 30);
                if (offset > h / 2 || offset < -h / 2) continue;

                ctx.beginPath();
                ctx.moveTo(-20, offset);
                ctx.lineTo(20, offset);
                ctx.stroke();
            }

            ctx.restore();
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveVectorHudStop !== 'function') {
        vectorHudUtils.resolveVectorHudStop = function resolveVectorHudStop(hud, windowObjParam) {
            hud.active = false;
            if (hud.animationId) {
                windowObjParam.cancelAnimationFrame(hud.animationId);
            }
            windowObjParam.removeEventListener('deviceorientation', hud._handleOrientation);
            if (hud.canvas) {
                hud.canvas.classList.add('opacity-0');
            }
            return true;
        };
    }

    if (typeof vectorHudUtils.resolveRenderVectorHudHtml !== 'function') {
        vectorHudUtils.resolveRenderVectorHudHtml = function resolveRenderVectorHudHtml(solarMode, iconsObj, recentLocationsHtml) {
            return `
        <div class="min-h-screen ${solarMode ? 'bg-amber-950' : 'bg-void-950'} relative overflow-hidden">
            <div class="absolute inset-0 pointer-events-none opacity-[0.03]" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, ${solarMode ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'} 2px, ${solarMode ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'} 4px);"></div>
            <header class="sticky top-0 z-20 ${solarMode ? 'bg-amber-950/95' : 'bg-void-950/95'} backdrop-blur-sm border-b ${solarMode ? 'border-signal-amber/20' : 'border-signal-emerald/20'} p-4">
                <div class="flex items-center gap-3">
                    <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 rounded-[2px] bg-void-900/60 border border-void-800 ${solarMode ? 'hover:bg-signal-amber/10 hover:border-signal-amber/30' : 'hover:bg-signal-emerald/10 hover:border-signal-emerald/30'} transition-all active:scale-95">
                        ${iconsObj.arrowLeft}
                    </button>
                    <div>
                        <p class="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">Navigation Module</p>
                        <h1 class="font-heading text-2xl font-bold ${solarMode ? 'text-amber-400' : 'text-emerald-400'}">VECTOR HUD</h1>
                    </div>
                </div>
            </header>
            <div class="p-4 space-y-6">
                <div class="flex justify-between items-start">
                    <div class="${solarMode ? 'bg-amber-900/80 border-signal-amber/20' : 'bg-void-900/80 border-signal-emerald/20'} backdrop-blur-sm border rounded-[2px] px-3 py-2">
                        <p class="text-[10px] text-zinc-500 font-mono uppercase">TARGET</p>
                        <p class="text-xs ${solarMode ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold" id="hud-target-name">JEMAA EL-FNA</p>
                    </div>
                    <div class="${solarMode ? 'bg-amber-900/80 border-signal-amber/20' : 'bg-void-900/80 border-signal-emerald/20'} backdrop-blur-sm border rounded-[2px] px-3 py-2 text-right">
                        <p class="text-[10px] text-zinc-500 font-mono uppercase">DIST</p>
                        <p class="text-xl ${solarMode ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold" id="hud-distance">---- M</p>
                    </div>
                </div>
                <div class="${solarMode ? 'bg-amber-900/60 border-signal-amber/20' : 'bg-void-900/60 border-void-800'} border rounded-[2px] p-3">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <p class="text-[10px] text-zinc-500 font-mono uppercase">RISK ZONES</p>
                                <p class="text-sm ${solarMode ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold" id="hud-risk-zone-count">0</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 font-mono uppercase">NEAREST SUPPORT</p>
                                <p class="text-xs text-zinc-300 font-mono font-bold" id="hud-nearest-support">SCANNING...</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 font-mono uppercase">INTEL FEED</p>
                                <p class="text-xs text-zinc-300 font-mono font-bold" id="hud-intel-integrity">VERIFYING...</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <p class="text-[10px] text-zinc-500 font-mono uppercase">CONTEXT SOURCE</p>
                                <p class="text-xs ${solarMode ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold" id="hud-context-source">LIVE GPS</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-zinc-500 font-mono uppercase">RISK SIGNAL</p>
                                <p class="text-xs text-zinc-300 font-mono font-bold" id="hud-risk-mode">CLEAR</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-center items-center py-8">
                    <div class="relative w-64 h-64">
                        <div class="absolute inset-0 rounded-full border-2 ${solarMode ? 'border-signal-amber/50' : 'border-signal-emerald/50'} animate-pulse"></div>
                        <div class="absolute inset-4 rounded-full border ${solarMode ? 'border-signal-amber/30' : 'border-signal-emerald/30'}"></div>
                        <div class="absolute inset-8 rounded-full border ${solarMode ? 'border-signal-amber/20' : 'border-signal-emerald/20'}"></div>
                        <div class="absolute top-1/2 left-0 right-0 h-px ${solarMode ? 'bg-signal-amber/20' : 'bg-signal-emerald/20'} -translate-y-1/2"></div>
                        <div class="absolute left-1/2 top-0 bottom-0 w-px ${solarMode ? 'bg-signal-amber/20' : 'bg-signal-emerald/20'} -translate-x-1/2"></div>
                        <div id="hud-needle" class="absolute inset-0 flex justify-center transition-transform duration-150 ease-out" style="transform: rotate(0deg);">
                            <div class="relative w-0 h-0">
                                <div class="absolute left-1/2 -translate-x-1/2 -top-24 w-0 h-0" style="border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 28px solid ${solarMode ? '#f59e0b' : '#10b981'};"></div>
                                <div class="absolute left-1/2 -translate-x-1/2 -top-24 translate-y-7 w-1.5 h-16 ${solarMode ? 'bg-signal-amber' : 'bg-signal-emerald'} rounded-b-sm"></div>
                                <div class="absolute left-1/2 -translate-x-1/2 -top-24 w-6 h-6 ${solarMode ? 'bg-signal-amber/30' : 'bg-signal-emerald/30'} rounded-full blur-md"></div>
                            </div>
                        </div>
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div class="w-4 h-4 ${solarMode ? 'bg-amber-400' : 'bg-emerald-400'} rounded-full animate-ping opacity-75"></div>
                            <div class="absolute top-0 left-0 w-4 h-4 ${solarMode ? 'bg-amber-400' : 'bg-emerald-400'} rounded-full"></div>
                        </div>
                        <div class="absolute top-2 left-1/2 -translate-x-1/2 ${solarMode ? 'text-signal-amber/70' : 'text-signal-emerald/70'} font-mono text-xs font-bold">N</div>
                        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 ${solarMode ? 'text-signal-amber/50' : 'text-signal-emerald/50'} font-mono text-xs">S</div>
                        <div class="absolute left-2 top-1/2 -translate-y-1/2 ${solarMode ? 'text-signal-amber/50' : 'text-signal-emerald/50'} font-mono text-xs">W</div>
                        <div class="absolute right-2 top-1/2 -translate-y-1/2 ${solarMode ? 'text-signal-amber/50' : 'text-signal-emerald/50'} font-mono text-xs">E</div>
                    </div>
                </div>
                <div class="flex justify-center">
                    <div class="${solarMode ? 'bg-amber-900/80 border-signal-amber/20' : 'bg-void-900/80 border-signal-emerald/20'} backdrop-blur-sm border rounded-[2px] px-6 py-3 text-center">
                        <p class="text-[10px] text-zinc-500 font-mono uppercase mb-1">BEARING TO TARGET</p>
                        <p class="text-3xl ${solarMode ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold" id="hud-bearing">---°</p>
                    </div>
                </div>
                <button id="solar-toggle" class="w-full py-4 ${solarMode ? 'bg-signal-amber/20 hover:bg-signal-amber/30 border-2 border-signal-amber/50 text-amber-400' : 'bg-void-800/60 hover:bg-void-800/80 border-2 border-void-700/50 text-zinc-400'} rounded-[2px] font-mono font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span>${solarMode ? '☀️' : '🌚'}</span>
                    <span>${solarMode ? 'SOLAR MODE: ACTIVE (POINT PHONE AT SUN)' : '🌑 SOLAR MODE'}</span>
                </button>
                <div class="${solarMode ? 'bg-amber-900/60' : 'bg-void-900/60'} border ${solarMode ? 'border-signal-amber/20' : 'border-void-800'} rounded-[2px] p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-2 h-2 rounded-full ${solarMode ? 'bg-signal-amber' : 'bg-zinc-500'}" id="hud-gps-status"></div>
                        <p class="text-xs ${solarMode ? 'text-amber-400' : 'text-zinc-400'} font-mono" id="hud-status">AWAITING GPS LOCK...</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full ${solarMode ? 'bg-signal-amber' : 'bg-zinc-500'}" id="hud-compass-status"></div>
                        <p class="text-xs ${solarMode ? 'text-amber-400' : 'text-zinc-400'} font-mono" id="hud-compass-text">COMPASS: STANDBY</p>
                    </div>
                    ${solarMode ? `
                    <div class="flex items-center gap-2 mt-2">
                        <div class="w-2 h-2 rounded-full bg-signal-amber" id="hud-solar-status"></div>
                        <p class="text-xs text-amber-400 font-mono" id="hud-solar-text">SOLAR: CALCULATING SUN POSITION...</p>
                    </div>
                    ` : ''}
                </div>
                <button id="calibrate-btn" class="w-full py-4 ${solarMode ? 'bg-signal-amber/20 hover:bg-signal-amber/30 border-2 border-signal-amber/50 text-amber-400' : 'bg-signal-amber/20 hover:bg-signal-amber/30 border-2 border-signal-amber/50 text-amber-400'} rounded-[2px] font-mono font-bold text-sm transition-all active:scale-95">
                    CALIBRATE SENSORS (IOS)
                </button>
                <button onclick="window.showWaypointPanel()" class="w-full py-4 ${solarMode ? 'bg-signal-emerald/20 hover:bg-signal-emerald/30 border-2 border-signal-emerald/50 text-emerald-400' : 'bg-signal-emerald/20 hover:bg-signal-emerald/30 border-2 border-signal-emerald/50 text-emerald-400'} rounded-[2px] font-mono font-bold text-sm transition-all active:scale-95">
                    WAYPOINT NAVIGATION
                </button>
                <div class="${solarMode ? 'bg-amber-900/40 border-amber-800' : 'bg-void-900/40 border-void-800'} border rounded-[2px] p-4">
                    <p class="text-xs ${solarMode ? 'text-signal-amber' : 'text-zinc-500'} font-mono leading-relaxed">
                        <span class="${solarMode ? 'text-amber-400' : 'text-emerald-400'}">TIP:</span> 
                        ${solarMode ? 'Hold your device flat and point it at the sun. The arrow points to your destination using solar navigation.' : 'Hold your device flat and level. The arrow points directly to your destination. On iOS, tap CALIBRATE to enable compass access.'}
                    </p>
                </div>

                <!-- RECENT LOCATIONS -->
                ${recentLocationsHtml}
            </div>
        </div>
    `;
        };
    }

    if (typeof vectorHudUtils.resolveRenderVectorRecentLocationsHtml !== 'function') {
        vectorHudUtils.resolveRenderVectorRecentLocationsHtml = function resolveRenderVectorRecentLocationsHtml(options = {}) {
            try {
                const getMapState = options.getMapState || (() => ({}));

                // Get recent locations from map module state
                const mapState = getMapState() || {};
                const recentLocs = mapState.recentLocations || [];

                if (recentLocs.length === 0) {
                    return `
                <div class="mt-6 p-4 bg-void-900/40 border border-void-800 rounded-[2px]">
                    <div class="flex items-center gap-3 text-zinc-500">
                        <span class="text-xl">-</span>
                        <div>
                            <p class="text-sm font-mono text-zinc-400">No recent locations</p>
                            <p class="text-xs text-zinc-600">Places you visit will appear here</p>
                        </div>
                    </div>
                </div>
            `;
                }

                return `
            <div class="mt-6 space-y-2">
                <p class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-2">RECENT LOCATIONS</p>
                ${recentLocs.slice(0, 3).map(loc => `
                    <div class="p-3 bg-void-900/60 border border-void-800 rounded-[2px] flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-signal-emerald">*</span>
                            <span class="text-sm text-zinc-300 font-mono">${loc.name || 'Unknown'}</span>
                        </div>
                        <span class="text-xs text-zinc-500 font-mono">${loc.distance || ''}</span>
                    </div>
                `).join('')}
            </div>
        `;
            } catch (e) {
                const consoleObj = options.consoleObj || windowObj.console;
                consoleObj.error('[VECTOR HUD] renderRecentLocations error:', e);
                return ''; // Return empty string on error
            }
        };
    }

    if (typeof vectorHudUtils.resolveRenderVectorHudFlow !== 'function') {
        vectorHudUtils.resolveRenderVectorHudFlow = function resolveRenderVectorHudFlow(options = {}) {
            const documentObj = options.documentObj || windowObj.document;
            const requestAnimationFrameFn = options.requestAnimationFrameFn || windowObj.requestAnimationFrame.bind(windowObj);
            const initVectorSensorsFn = options.initVectorSensorsFn || (() => { });
            const consoleObj = options.consoleObj || windowObj.console;

            const app = documentObj.getElementById('app');
            if (!app) return false;

            const html = typeof vectorHudUtils.resolveRenderVectorHudHtml === 'function'
                ? vectorHudUtils.resolveRenderVectorHudHtml(
                    !!options.solarMode,
                    options.iconsObj || {},
                    options.recentLocationsHtml || ''
                )
                : '';
            app.innerHTML = html;

            // Ensure DOM is fully rendered before initializing sensors
            requestAnimationFrameFn(() => {
                try {
                    initVectorSensorsFn();
                } catch (e) {
                    consoleObj.error('[VECTOR HUD] Sensor init error:', e);
                }
            });

            return true;
        };
    }

    if (typeof vectorHudUtils.resolveSunAzimuth !== 'function') {
        vectorHudUtils.resolveSunAzimuth = function resolveSunAzimuth(lat, lng, dateObj) {
            const latRad = lat * Math.PI / 180;
            const now = dateObj instanceof Date ? dateObj : new Date();

            // Convert to radians
            const lngRad = lng * Math.PI / 180;
            const year = now.getUTCFullYear();
            const month = now.getUTCMonth() + 1;
            const day = now.getUTCDate();
            const hour = now.getUTCHours();
            const minute = now.getUTCMinutes();
            const second = now.getUTCSeconds();

            const a = Math.floor((14 - month) / 12);
            const y = year + 4800 - a;
            const m = month + 12 * a - 3;
            let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
                - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
            jd += (hour - 12) / 24 + minute / 1440 + second / 86400;

            const T = (jd - 2451545) / 36525;
            let L0 = 280.46646 + T * (36000.76983 + T * 0.0003032);
            L0 %= 360; if (L0 < 0) L0 += 360;
            let M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
            M %= 360; if (M < 0) M += 360;
            const M_rad = M * Math.PI / 180;
            const C = (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(M_rad)
                + (0.019993 - 0.000101 * T) * Math.sin(2 * M_rad)
                + 0.000289 * Math.sin(3 * M_rad);
            const TrueLon = L0 + C;
            const Omega = 125.04 - 1934.136 * T;
            const Lambda = TrueLon - 0.00569 - 0.00478 * Math.sin(Omega * Math.PI / 180);
            const epsilon0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
            const deltaEpsilon = 0.00256 * Math.cos(Omega * Math.PI / 180);
            const epsilon = epsilon0 + deltaEpsilon;
            const lambda_rad = Lambda * Math.PI / 180;
            const epsilon_rad = epsilon * Math.PI / 180;
            let RA = Math.atan2(Math.cos(epsilon_rad) * Math.sin(lambda_rad), Math.cos(lambda_rad));
            RA = RA * 180 / Math.PI; if (RA < 0) RA += 360;
            const delta = Math.asin(Math.sin(epsilon_rad) * Math.sin(lambda_rad)) * 180 / Math.PI;
            let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
            GMST %= 360; if (GMST < 0) GMST += 360;
            const LST = (GMST + lng) % 360;
            let HA = LST - RA;
            if (HA < -180) HA += 360;
            if (HA > 180) HA -= 360;

            const HA_rad = HA * Math.PI / 180;
            const delta_rad = delta * Math.PI / 180;

            const sinAlt = Math.sin(latRad) * Math.sin(delta_rad) + Math.cos(latRad) * Math.cos(delta_rad) * Math.cos(HA_rad);
            const alt = Math.asin(sinAlt);

            const cosAz = (Math.sin(delta_rad) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
            let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
            if (Math.sin(HA_rad) > 0) az = 360 - az;
            az %= 360; if (az < 0) az += 360;
            void lngRad;
            return az;
        };
    }

    if (typeof vectorHudUtils.resolveUpdateSolarDisplay !== 'function') {
        vectorHudUtils.resolveUpdateSolarDisplay = function resolveUpdateSolarDisplay(options = {}) {
            try {
                const documentObj = options.documentObj || windowObj.document;
                const getSolarModeFn = options.getSolarModeFn || (() => false);
                const getVectorLatFn = options.getVectorLatFn || (() => null);
                const getVectorLngFn = options.getVectorLngFn || (() => null);
                const setSunAzimuthFn = options.setSunAzimuthFn || (() => { });
                const getSunAzimuthFn = options.getSunAzimuthFn || (() => 0);

                const solarText = documentObj.getElementById('hud-solar-text');
                if (!solarText) return false;
                if (getSolarModeFn() && getVectorLatFn() && getVectorLngFn()) {
                    const azimuth = getSunAzimuthFn(getVectorLatFn(), getVectorLngFn());
                    setSunAzimuthFn(azimuth);
                    solarText.textContent = `SOLAR: SUN AZIMUTH ${Math.round(azimuth)}°`;
                    const solarStatus = documentObj.getElementById('hud-solar-status');
                    if (solarStatus) {
                        solarStatus.classList.remove('bg-zinc-500', 'bg-red-500');
                        solarStatus.classList.add('bg-signal-amber');
                    }
                } else {
                    solarText.textContent = 'SOLAR: INACTIVE';
                }
                return true;
            } catch (e) {
                const consoleObj = options.consoleObj || windowObj.console;
                consoleObj.error('[VECTOR HUD] Solar display error:', e);
                return false;
            }
        };
    }

    if (typeof vectorHudUtils.resolveInitVectorSensorsFlow !== 'function') {
        vectorHudUtils.resolveInitVectorSensorsFlow = function resolveInitVectorSensorsFlow(options = {}) {
            const documentObj = options.documentObj || windowObj.document;
            const navigatorObj = options.navigatorObj || windowObj.navigator;
            const windowParam = options.windowObj || windowObj;
            const consoleObj = options.consoleObj || windowObj.console;
            const deviceOrientationEventObj = options.deviceOrientationEventObj || windowObj.DeviceOrientationEvent;
            const appStateObj = options.appStateObj;
            const renderVectorHUDFn = options.renderVectorHUDFn || (() => { });
            const updateSolarDisplayFn = options.updateSolarDisplayFn || (() => { });
            const getSolarModeFn = options.getSolarModeFn || (() => false);
            const setSolarModeFn = options.setSolarModeFn || (() => { });
            const getSunAzimuthFn = options.getSunAzimuthFn || (() => 0);
            const getVectorLatFn = options.getVectorLatFn || (() => null);
            const getVectorLngFn = options.getVectorLngFn || (() => null);
            const setVectorLatLngFn = options.setVectorLatLngFn || (() => { });
            const getWatchIdFn = options.getWatchIdFn || (() => null);
            const setWatchIdFn = options.setWatchIdFn || (() => { });

            const TARGET_LAT = 31.626058;
            const TARGET_LNG = -7.988673;
            const needleEl = documentObj.getElementById('hud-needle');
            const distanceEl = documentObj.getElementById('hud-distance');
            const bearingEl = documentObj.getElementById('hud-bearing');
            const statusEl = documentObj.getElementById('hud-status');
            const gpsStatusEl = documentObj.getElementById('hud-gps-status');
            const compassStatusEl = documentObj.getElementById('hud-compass-status');
            const compassTextEl = documentObj.getElementById('hud-compass-text');
            const riskZoneCountEl = documentObj.getElementById('hud-risk-zone-count');
            const nearestSupportEl = documentObj.getElementById('hud-nearest-support');
            const intelIntegrityEl = documentObj.getElementById('hud-intel-integrity');
            const contextSourceEl = documentObj.getElementById('hud-context-source');
            const riskModeEl = documentObj.getElementById('hud-risk-mode');
            const calibrateBtn = documentObj.getElementById('calibrate-btn');
            const solarToggle = documentObj.getElementById('solar-toggle');
            let currentHeading = 0;
            let targetBearing = 0;
            let compassActive = false;
            void compassActive;
            void getSunAzimuthFn;

            function haversineDistance(lat1, lng1, lat2, lng2) {
                const R = 6371000;
                const toRad = (deg) => deg * (Math.PI / 180);
                const dLat = toRad(lat2 - lat1);
                const dLng = toRad(lng2 - lng1);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            }
            function calculateBearing(lat1, lng1, lat2, lng2) {
                const toRad = (deg) => deg * (Math.PI / 180);
                const toDeg = (rad) => rad * (180 / Math.PI);
                const dLng = toRad(lng2 - lng1);
                const lat1Rad = toRad(lat1);
                const lat2Rad = toRad(lat2);
                const x = Math.sin(dLng) * Math.cos(lat2Rad);
                const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
                let bearing = toDeg(Math.atan2(x, y));
                return (bearing + 360) % 360;
            }
            function updateNeedle() {
                if (!needleEl) return;
                let rotation;
                if (getSolarModeFn() && typeof options.getSunAzimuthValueFn === 'function' && options.getSunAzimuthValueFn()) {
                    const trueNorth = options.getSunAzimuthValueFn();
                    rotation = targetBearing - (currentHeading + trueNorth);
                } else {
                    rotation = targetBearing - currentHeading;
                }
                if (rotation > 180) rotation -= 360;
                if (rotation < -180) rotation += 360;
                needleEl.style.transform = `rotate(${rotation}deg)`;
            }
            function resolveVectorContextSnapshot() {
                if (!windowParam.contextEngine || typeof windowParam.contextEngine.getContext !== 'function') {
                    return null;
                }
                try {
                    return windowParam.contextEngine.getContext('vector');
                } catch (_error) {
                    return null;
                }
            }
            function updateBaselineIntelOverlay() {
                const vectorContext = resolveVectorContextSnapshot();
                const riskZones = Array.isArray(vectorContext?.riskZones) ? vectorContext.riskZones : [];
                const criticalPoints = Array.isArray(vectorContext?.criticalPoints) ? vectorContext.criticalPoints : [];
                const baselineIntel = vectorContext?.baselineIntel || null;
                const contextCache = vectorContext?.contextCache || null;
                const sessionData = windowParam.contextEngine?.context?.sessionData || null;
                const hasInterpolatedRisk = riskZones.some((zone) =>
                    zone?.source === 'baseline_risk_zone_interpolated' || Boolean(zone?.interpolation)
                );
                const hasDirectRisk = riskZones.some((zone) =>
                    zone?.source !== 'baseline_risk_zone_interpolated'
                );

                if (riskZoneCountEl) {
                    riskZoneCountEl.textContent = String(riskZones.length);
                    riskZoneCountEl.classList.toggle('text-red-400', hasDirectRisk);
                    riskZoneCountEl.classList.toggle('text-emerald-400', riskZones.length === 0 && !getSolarModeFn());
                    riskZoneCountEl.classList.toggle('text-amber-400', (riskZones.length === 0 && getSolarModeFn()) || (!hasDirectRisk && riskZones.length > 0));
                }

                if (nearestSupportEl) {
                    if (criticalPoints.length > 0) {
                        const nearest = criticalPoints[0];
                        const distanceLabel = typeof nearest.distance === 'number'
                            ? `${Math.round(nearest.distance)}M`
                            : '--';
                        nearestSupportEl.textContent = `${nearest.name} (${distanceLabel})`;
                    } else {
                        nearestSupportEl.textContent = 'NONE IN RANGE';
                    }
                }

                if (intelIntegrityEl) {
                    const rawStatus = String(baselineIntel?.integrityStatus || 'unknown').toLowerCase();
                    const warningCount = Number(baselineIntel?.validationWarningCount || 0);
                    const statusMap = {
                        verified: { label: 'VERIFIED', className: getSolarModeFn() ? 'text-amber-400' : 'text-emerald-400' },
                        pending: { label: 'VERIFYING', className: 'text-signal-amber' },
                        degraded: { label: 'DEGRADED', className: 'text-red-400' },
                        blocked: { label: 'BLOCKED', className: 'text-red-400' },
                        unavailable: { label: 'OFFLINE', className: 'text-zinc-400' },
                        legacy_unverified: { label: 'LEGACY', className: 'text-signal-cyan' },
                        unknown: { label: 'UNKNOWN', className: 'text-zinc-400' }
                    };
                    const statusUi = statusMap[rawStatus] || statusMap.unknown;
                    const warningText = warningCount > 0 ? ` (${warningCount})` : '';
                    intelIntegrityEl.textContent = `${statusUi.label}${warningText}`;
                    intelIntegrityEl.className = `text-xs font-mono font-bold ${statusUi.className}`;
                }

                if (contextSourceEl) {
                    const restoredFromCache = contextCache?.restoredFromCache === true;
                    const ageMs = Number(sessionData?.cachedSnapshotAgeMs);
                    const ageMinutes = Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 60000)) : null;
                    const sourceLabel = restoredFromCache
                        ? `CACHE${ageMinutes !== null ? ` (${ageMinutes}M)` : ''}`
                        : 'LIVE GPS';
                    contextSourceEl.textContent = sourceLabel;
                    contextSourceEl.className = `text-xs font-mono font-bold ${restoredFromCache ? 'text-amber-400' : (getSolarModeFn() ? 'text-amber-400' : 'text-emerald-400')}`;
                }

                if (riskModeEl) {
                    let modeLabel = 'CLEAR';
                    let modeClass = 'text-zinc-400';
                    if (riskZones.length > 0 && !hasDirectRisk && hasInterpolatedRisk) {
                        modeLabel = 'PERIMETER';
                        modeClass = 'text-amber-400';
                    } else if (riskZones.length > 0) {
                        modeLabel = 'DIRECT';
                        modeClass = 'text-red-400';
                    }
                    riskModeEl.textContent = modeLabel;
                    riskModeEl.className = `text-xs font-mono font-bold ${modeClass}`;
                }
            }
            function handleContextUpdate() {
                updateBaselineIntelOverlay();
            }
            function handleSecurityStateUpdate() {
                updateBaselineIntelOverlay();
            }
            function startGeolocation() {
                if (!navigatorObj.geolocation) {
                    if (statusEl) statusEl.textContent = 'GPS: NOT SUPPORTED';
                    if (gpsStatusEl) {
                        gpsStatusEl.classList.remove('bg-zinc-500', getSolarModeFn() ? 'bg-amber-400' : 'bg-emerald-400');
                        gpsStatusEl.classList.add('bg-red-500');
                    }
                    return;
                }
                // Clear any existing watcher before starting a new one
                if (getWatchIdFn() !== undefined && getWatchIdFn() !== null) {
                    navigatorObj.geolocation.clearWatch(getWatchIdFn());
                    setWatchIdFn(null);
                }
                if (statusEl) statusEl.textContent = 'ACQUIRING GPS SIGNAL...';
                setWatchIdFn(navigatorObj.geolocation.watchPosition((position) => {
                    try {
                        setVectorLatLngFn(position.coords.latitude, position.coords.longitude);
                        let contextSyncPromise = null;
                        if (windowParam.contextEngine?.updateLocation) {
                            contextSyncPromise = windowParam.contextEngine.updateLocation(getVectorLatFn(), getVectorLngFn(), {
                                source: 'vector_hud',
                                accuracy: position.coords.accuracy
                            }).catch((e) => consoleObj.warn('[CONTEXT] Vector HUD location sync failed:', e.message));
                        }
                        if (contextSyncPromise && typeof contextSyncPromise.finally === 'function') {
                            contextSyncPromise.finally(() => updateBaselineIntelOverlay());
                        } else {
                            updateBaselineIntelOverlay();
                        }
                        const distance = haversineDistance(getVectorLatFn(), getVectorLngFn(), TARGET_LAT, TARGET_LNG);
                        if (distance >= 1000) {
                            if (distanceEl) distanceEl.textContent = `${(distance / 1000).toFixed(2)} KM`;
                        } else {
                            if (distanceEl) distanceEl.textContent = `${Math.round(distance)} M`;
                        }
                        targetBearing = calculateBearing(getVectorLatFn(), getVectorLngFn(), TARGET_LAT, TARGET_LNG);
                        if (bearingEl) bearingEl.textContent = `${Math.round(targetBearing)}°`;
                        if (statusEl) statusEl.textContent = 'GPS: LOCKED';
                        if (gpsStatusEl) {
                            gpsStatusEl.classList.remove('bg-zinc-500', 'bg-red-500');
                            gpsStatusEl.classList.add(getSolarModeFn() ? 'bg-amber-400' : 'bg-emerald-400');
                        }
                        if (getSolarModeFn()) updateSolarDisplayFn();
                        updateNeedle();
                    } catch (e) {
                        consoleObj.error('[VECTOR HUD] GPS callback error:', e);
                    }
                }, (error) => {
                    if (statusEl) statusEl.textContent = `GPS ERROR: ${error.message}`;
                    if (gpsStatusEl) {
                        gpsStatusEl.classList.remove('bg-zinc-500', getSolarModeFn() ? 'bg-amber-400' : 'bg-emerald-400');
                        gpsStatusEl.classList.add('bg-red-500');
                    }
                }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }));
            }
            function handleOrientation(event) {
                try {
                    let heading;
                    if (event.webkitCompassHeading !== undefined) {
                        heading = event.webkitCompassHeading;
                    } else if (event.alpha !== null) {
                        heading = (360 - event.alpha) % 360;
                    } else { return; }
                    currentHeading = heading;
                    compassActive = true;
                    if (compassStatusEl) {
                        compassStatusEl.classList.remove('bg-zinc-500', 'bg-red-500');
                        compassStatusEl.classList.add(getSolarModeFn() ? 'bg-amber-400' : 'bg-emerald-400');
                    }
                    if (compassTextEl) compassTextEl.textContent = `COMPASS: ${Math.round(heading)}° ${getSolarModeFn() ? 'SOLAR' : 'ACTIVE'}`;
                    if (getSolarModeFn()) updateSolarDisplayFn();
                    updateNeedle();
                } catch (e) {
                    consoleObj.error('[VECTOR HUD] Orientation handler error:', e);
                }
            }
            function startCompass() {
                // Remove any existing listener before adding a new one
                windowParam.removeEventListener('deviceorientation', handleOrientation, true);
                windowParam.addEventListener('deviceorientation', handleOrientation, true);
                if (compassTextEl) compassTextEl.textContent = 'COMPASS: INITIALIZING...';
            }
            if (solarToggle) {
                solarToggle.addEventListener('click', () => {
                    try {
                        setSolarModeFn(!getSolarModeFn());

                        // Save solar mode state
                        appStateObj.setModule('vector', { solarMode: getSolarModeFn() });

                        if (getSolarModeFn()) {
                            solarToggle.classList.add('bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400');
                            solarToggle.innerHTML = '<span>☀️</span><span>SOLAR MODE: ACTIVE (POINT PHONE AT SUN)</span>';
                            if (getVectorLatFn() && getVectorLngFn()) updateSolarDisplayFn();
                        } else {
                            solarToggle.classList.add('bg-void-800/60', 'border-void-700/50', 'text-zinc-400');
                            solarToggle.innerHTML = '<span>🌚</span><span>🌑 SOLAR MODE</span>';
                        }
                        renderVectorHUDFn();
                    } catch (e) {
                        consoleObj.error('[VECTOR HUD] Solar toggle error:', e);
                    }
                });
            }
            if (windowParam.__ALIDADE_VECTOR_CONTEXT_UPDATE_HANDLER__) {
                windowParam.removeEventListener('contextUpdate', windowParam.__ALIDADE_VECTOR_CONTEXT_UPDATE_HANDLER__);
            }
            windowParam.__ALIDADE_VECTOR_CONTEXT_UPDATE_HANDLER__ = handleContextUpdate;
            windowParam.addEventListener('contextUpdate', handleContextUpdate);
            if (windowParam.__ALIDADE_VECTOR_SECURITY_UPDATE_HANDLER__) {
                windowParam.removeEventListener('alidade:securityStateChanged', windowParam.__ALIDADE_VECTOR_SECURITY_UPDATE_HANDLER__);
            }
            windowParam.__ALIDADE_VECTOR_SECURITY_UPDATE_HANDLER__ = handleSecurityStateUpdate;
            windowParam.addEventListener('alidade:securityStateChanged', handleSecurityStateUpdate);
            updateBaselineIntelOverlay();
            if (calibrateBtn) {
                calibrateBtn.addEventListener('click', async () => {
                    if (typeof deviceOrientationEventObj !== 'undefined' && typeof deviceOrientationEventObj.requestPermission === 'function') {
                        try {
                            const permission = await deviceOrientationEventObj.requestPermission();
                            if (permission === 'granted') {
                                startCompass();
                                calibrateBtn.textContent = '✅ SENSORS CALIBRATED';
                                calibrateBtn.classList.remove('bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400');
                                calibrateBtn.classList.add(...(getSolarModeFn() ? ['bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400'] : ['bg-signal-emerald/20', 'border-signal-emerald/50', 'text-emerald-400']));
                            } else {
                                calibrateBtn.textContent = '❌ PERMISSION DENIED';
                                calibrateBtn.classList.remove('bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400');
                                calibrateBtn.classList.add('bg-red-500/20', 'border-red-500/50', 'text-red-400');
                            }
                        } catch (error) {
                            consoleObj.error('[VECTOR HUD] Permission error:', error);
                            calibrateBtn.textContent = '⚠️ PERMISSION ERROR';
                        }
                    } else {
                        startCompass();
                        calibrateBtn.textContent = '✅ SENSORS ACTIVE';
                        calibrateBtn.classList.remove('bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400');
                        calibrateBtn.classList.add(...(getSolarModeFn() ? ['bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400'] : ['bg-signal-emerald/20', 'border-signal-emerald/50', 'text-emerald-400']));
                    }
                });
            }
            startGeolocation();
            if (typeof deviceOrientationEventObj !== 'undefined') {
                if (typeof deviceOrientationEventObj.requestPermission !== 'function') {
                    startCompass();
                    if (calibrateBtn) {
                        calibrateBtn.textContent = '⚡ SENSORS AUTO-STARTED';
                        calibrateBtn.classList.remove('bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400');
                        calibrateBtn.classList.add(...(getSolarModeFn() ? ['bg-signal-amber/20', 'border-signal-amber/50', 'text-amber-400'] : ['bg-signal-emerald/20', 'border-signal-emerald/50', 'text-emerald-400']));
                    }
                }
            }
            // Cleanup handler: Restore original navigateTo when leaving this view
            if (windowParam.alidadeApp && windowParam.alidadeApp.navigateTo) {
                const originalNavigateTo = windowParam.alidadeApp.navigateTo;
                windowParam.alidadeApp.navigateTo = (view) => {
                    // Cleanup GPS watch
                    if (getWatchIdFn() !== null) {
                        navigatorObj.geolocation.clearWatch(getWatchIdFn());
                        setWatchIdFn(null);
                    }
                    // Cleanup orientation listener
                    windowParam.removeEventListener('deviceorientation', handleOrientation, true);
                    windowParam.removeEventListener('contextUpdate', handleContextUpdate);
                    if (windowParam.__ALIDADE_VECTOR_CONTEXT_UPDATE_HANDLER__ === handleContextUpdate) {
                        windowParam.__ALIDADE_VECTOR_CONTEXT_UPDATE_HANDLER__ = null;
                    }
                    windowParam.removeEventListener('alidade:securityStateChanged', handleSecurityStateUpdate);
                    if (windowParam.__ALIDADE_VECTOR_SECURITY_UPDATE_HANDLER__ === handleSecurityStateUpdate) {
                        windowParam.__ALIDADE_VECTOR_SECURITY_UPDATE_HANDLER__ = null;
                    }
                    // Restore original function
                    windowParam.alidadeApp.navigateTo = originalNavigateTo;
                    // Navigate
                    originalNavigateTo(view);
                };
            }
            return true;
        };
    }

    windowObj.ALIDADE_VECTOR_HUD_UTILS = vectorHudUtils;
})(typeof window !== 'undefined' ? window : null);
