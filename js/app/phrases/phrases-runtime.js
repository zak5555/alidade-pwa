// Extracted from app.js (Batch 202): Phrase assistant runtime stack
// Preserves legacy globals and behavior parity.

/**
 * ---------------------------------------------------------------
 * CLASS: PhraseLibrary
 * Audio playback, search, favorites, and usage tracking
 * Offline-first architecture with instant playback
 * ---------------------------------------------------------------
 */
const phrasesRuntimeDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

class PhraseLibrary {
    constructor() {
        this.FAVORITES_KEY = 'alidade_phrase_favorites';
        this.USAGE_KEY = 'alidade_phrase_usage';
        this.audioCache = new Map();
        this.favorites = this._loadFavorites();
        this.usage = this._loadUsage();
        this.currentAudio = null;
        phrasesRuntimeDebugLog('[PHRASE-LIB] Initialized');
    }

    /** Get all phrases in a category */
    getByCategory(category) {
        return ARABIC_PHRASES[category] || [];
    }

    /** Get all categories with counts */
    getCategories() {
        return Object.entries(ARABIC_PHRASES).map(([key, phrases]) => ({
            key,
            name: this._formatCategoryName(key),
            count: phrases.length,
            icon: this._getCategoryIcon(key)
        }));
    }

    _formatCategoryName(key) {
        const names = {
            greetings: 'Greetings',
            shopping: 'Shopping',
            directions: 'Directions',
            numbers: 'Numbers',
            emergency: 'Emergency',
            food: 'Food & Drink'
        };
        return names[key] || key;
    }

    _getCategoryIcon(key) {
        const icons = {
            greetings: '👋',
            shopping: '🛍️',
            directions: '🧭',
            numbers: '🔢',
            emergency: '🚨',
            food: '🍽️'
        };
        return icons[key] || '💬';
    }

    /** Search phrases by English, Arabic, or phonetic */
    search(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return ALL_PHRASES.filter(p =>
            p.english.toLowerCase().includes(q) ||
            p.darija.toLowerCase().includes(q) ||
            p.phonetic.toLowerCase().includes(q) ||
            p.arabic.includes(query)
        ).slice(0, 20);
    }

    /** Play audio for a phrase */
    async playPhrase(phraseId) {
        const phrase = ALL_PHRASES.find(p => p.id === phraseId);
        if (!phrase) return false;

        // Track usage
        this._trackUsage(phraseId);

        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        try {
            // Check cache first
            if (this.audioCache.has(phrase.audio)) {
                this.currentAudio = this.audioCache.get(phrase.audio);
                this.currentAudio.currentTime = 0;
                await this.currentAudio.play();
                return true;
            }

            // Load and play
            const audio = new Audio(phrase.audio);
            audio.preload = 'auto';

            await new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = () => reject(new Error('Audio load failed'));
                setTimeout(() => reject(new Error('Audio timeout')), 5000);
            });

            this.audioCache.set(phrase.audio, audio);
            this.currentAudio = audio;
            await audio.play();
            Haptics?.trigger('light');
            return true;

        } catch (error) {
            console.warn('[PHRASE-LIB] Audio failed:', error);
            // Fallback: use Web Speech API
            return this._speakFallback(phrase.darija);
        }
    }

    /** Fallback speech synthesis */
    _speakFallback(text) {
        if (!('speechSynthesis' in window)) return false;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-MA';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
        return true;
    }

    /** Toggle favorite status */
    toggleFavorite(phraseId) {
        if (this.favorites.has(phraseId)) {
            this.favorites.delete(phraseId);
        } else {
            this.favorites.add(phraseId);
        }
        this._saveFavorites();
        Haptics?.trigger('light');
        return this.favorites.has(phraseId);
    }

    isFavorite(phraseId) {
        return this.favorites.has(phraseId);
    }

    getFavorites() {
        return ALL_PHRASES.filter(p => this.favorites.has(p.id));
    }

    /** Get most used phrases */
    getMostUsed(limit = 10) {
        const sorted = [...this.usage.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => ALL_PHRASES.find(p => p.id === id))
            .filter(Boolean);
        return sorted;
    }

    _trackUsage(phraseId) {
        const count = this.usage.get(phraseId) || 0;
        this.usage.set(phraseId, count + 1);
        this._saveUsage();
    }

    _loadFavorites() {
        try {
            const data = localStorage.getItem(this.FAVORITES_KEY);
            return new Set(data ? JSON.parse(data) : []);
        } catch { return new Set(); }
    }

    _saveFavorites() {
        try {
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify([...this.favorites]));
        } catch { }
    }

    _loadUsage() {
        try {
            const data = localStorage.getItem(this.USAGE_KEY);
            return new Map(data ? JSON.parse(data) : []);
        } catch { return new Map(); }
    }

    _saveUsage() {
        try {
            localStorage.setItem(this.USAGE_KEY, JSON.stringify([...this.usage]));
        } catch { }
    }

    /** Pre-cache audio for a category */
    async preloadCategory(category) {
        const phrases = this.getByCategory(category);
        for (const phrase of phrases.slice(0, 5)) {
            try {
                if (!this.audioCache.has(phrase.audio)) {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = phrase.audio;
                    this.audioCache.set(phrase.audio, audio);
                }
            } catch { }
        }
    }
}

/**
 * ---------------------------------------------------------------
 * CLASS: PronunciationTrainer
 * Speech recognition with fuzzy scoring for Darija
 * Online feature with graceful degradation
 * ---------------------------------------------------------------
 */
class PronunciationTrainer {
    constructor() {
        this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.recognition = null;
        this.isListening = false;
        this.currentPhrase = null;
        this.onResult = null;
        this.onError = null;
        phrasesRuntimeDebugLog(`[PRONUNCIATION] Supported: ${this.isSupported}`);
    }

    _createInstance() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-MA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        recognition.onresult = (event) => {
            let targetResult = null;

            // 1. Loop to find final result
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    targetResult = event.results[i];
                    break;
                }
            }

            // Fallback: Take last result if no final one found
            if (!targetResult && event.results.length > 0) {
                targetResult = event.results[event.results.length - 1];
            }

            if (!targetResult || targetResult.length === 0) {
                console.warn('[PRONUNCIATION] No valid results found');
                return;
            }

            // 2. Extract transcript for logging
            const transcript = targetResult[0].transcript;
            phrasesRuntimeDebugLog("[VOICE] Extracted text:", transcript);

            // 3. Prepare results for processing (passing all alternatives)
            const processingResults = [];
            for (let i = 0; i < targetResult.length; i++) {
                processingResults.push({
                    transcript: targetResult[i].transcript,
                    confidence: targetResult[i].confidence
                });
            }

            this._processResults(processingResults);
        };

        recognition.onerror = (event) => {
            console.warn('[PRONUNCIATION] Error:', event.error);
            this.isListening = false;

            // Detailed error mapping
            const errorMap = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'No microphone found. Check your settings.',
                'not-allowed': 'Microphone permission denied.',
                'network': 'Network error. Check connection.',
                'aborted': 'Listening stopped.',
                'service-not-allowed': 'Voice service not allowed.'
            };

            const errorMessage = errorMap[event.error] || `Error: ${event.error}`;
            if (this.onError) this.onError(errorMessage);
        };

        recognition.onend = () => {
            this.isListening = false;
        };

        return recognition;
    }

    /** Start listening for pronunciation */
    async startPractice(phrase, onResult, onError) {
        if (!this.isSupported) {
            if (onError) onError('not_supported');
            return false;
        }

        if (!navigator.onLine) {
            if (onError) onError('offline');
            return false;
        }

        // 1. Stop Audio Conflict (Stop-Wait-Start Protocol)
        if (typeof phraseLibrary !== 'undefined' && phraseLibrary.currentAudio) {
            phraseLibrary.currentAudio.pause();
        }

        this.currentPhrase = phrase;
        this.onResult = onResult;
        this.onError = onError;

        try {
            // 2. Stop Recognition Conflict & Cleanup
            if (this.recognition) {
                // Unbind listeners to prevent phantom callbacks
                this.recognition.onresult = null;
                this.recognition.onerror = null;
                this.recognition.onend = null;
                try {
                    this.recognition.abort();
                } catch (e) {
                    console.warn('[PRONUNCIATION] Abort error:', e);
                }
                this.recognition = null;
            }

            // 3. Cool-down Delay (300ms) to release microphone lock
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Create fresh instance
            this.recognition = this._createInstance();

            this.isListening = true;
            this.recognition.start();
            Haptics?.trigger('medium');

            // Auto-stop after 5 seconds (Internal Logic)
            setTimeout(() => {
                if (this.isListening) {
                    this.stopPractice();
                }
            }, 5000);

            return true;
        } catch (error) {
            console.error('[PRONUNCIATION] Start failed:', error);
            this.isListening = false;
            if (onError) onError('start_failed');
            return false;
        }
    }

    stopPractice() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('[PRONUNCIATION] Stop error:', e);
            }
            this.isListening = false;
        }
    }

    _processResults(results) {
        phrasesRuntimeDebugLog('[PRONUNCIATION] Raw Results:', results); // Debug log
        if (!this.currentPhrase || !this.onResult) return;

        let bestScore = -1;
        let bestTranscript = results[0]?.transcript || '';
        let usedTarget = '';

        for (const result of results) {
            // Pass the whole phrase to allow dual-script checking
            const { score, usedTarget: target } = this._calculateScore(this.currentPhrase, result.transcript, result.confidence);

            if (score > bestScore) {
                bestScore = score;
                bestTranscript = result.transcript;
                usedTarget = target;
            }
        }

        // Ensure we have a valid score (at least 0)
        bestScore = Math.max(0, bestScore);

        const feedback = this._generateFeedback(bestScore, usedTarget || this.currentPhrase.darija, bestTranscript);

        this.onResult({
            score: Math.round(bestScore),
            spoken: bestTranscript,
            target: usedTarget || this.currentPhrase.darija,
            feedback
        });
    }

    _normalize(text) {
        return text.toLowerCase()
            .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic script
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _normalizeArabic(text) {
        if (!text) return '';
        return text
            .replace(/[\u064B-\u065F]/g, '') // Remove Tashkeel (diacritics)
            .replace(/[أإآ]/g, 'ا')            // Normalize Alefs
            .replace(/[ى]/g, 'ي')             // Normalize Alef Maqsura
            .replace(/[ة]/g, 'ه')             // Normalize Taa Marbuta
            .replace(/[^\u0600-\u06FF\s0-9]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Levenshtein distance with fuzzy matching */
    /** Dual-Script Scoring Logic */
    _calculateScore(phrase, spoken, confidence = 0.8) {
        if (!spoken) return { score: 0, usedTarget: '' };

        const isArabic = /[\u0600-\u06FF]/.test(spoken);
        let target = '';
        let normalizedSpoken = '';

        if (isArabic) {
            // Arabic Matching
            target = this._normalizeArabic(phrase.arabic);
            normalizedSpoken = this._normalizeArabic(spoken);
            phrasesRuntimeDebugLog(`[SCORING] Mode: ARABIC | Target: ${target} | Spoken: ${normalizedSpoken}`);
        } else {
            // Latin/Darija Matching
            target = this._normalize(phrase.darija);
            normalizedSpoken = this._normalize(spoken);
            phrasesRuntimeDebugLog(`[SCORING] Mode: LATIN | Target: ${target} | Spoken: ${normalizedSpoken}`);
        }

        // Exact match
        if (target === normalizedSpoken) return { score: 100, usedTarget: target };

        // Calculate Levenshtein distance
        const distance = this._levenshtein(target, normalizedSpoken);
        const maxLen = Math.max(target.length, normalizedSpoken.length);

        if (maxLen === 0) return { score: 100, usedTarget: target };

        // Base score from edit distance
        let score = (1 - distance / maxLen) * 100;

        // Apply fuzzy matching bonuses
        if (!isArabic) {
            score = this._applyFuzzyBonus(target, normalizedSpoken, score);
        } else {
            // Simple loose matching for Arabic if close enough
            if (score > 80) score += 5;
        }

        // Adjust for speech recognition confidence
        score = score * (0.5 + confidence * 0.5);

        return {
            score: Math.max(0, Math.min(100, score)),
            usedTarget: target
        };
    }

    _levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    /** Fuzzy matching for Darija variations */
    _applyFuzzyBonus(target, spoken, baseScore) {
        const equivalents = [
            ['kh', 'ch', 'h'],
            ['gh', 'r'],
            ['q', 'k', 'g'],
            ['3', 'a', 'aa'],
            ['7', 'h'],
            ['th', 't'],
            ['dh', 'd'],
            ['ou', 'u', 'oo'],
            ['ay', 'ai', 'ei'],
            ['sh', 'ch']
        ];

        let normalizedTarget = target;
        let normalizedSpoken = spoken;

        for (const group of equivalents) {
            for (const variant of group) {
                normalizedTarget = normalizedTarget.replace(new RegExp(variant, 'g'), group[0]);
                normalizedSpoken = normalizedSpoken.replace(new RegExp(variant, 'g'), group[0]);
            }
        }

        if (normalizedTarget === normalizedSpoken) {
            return Math.min(100, baseScore + 20);
        }

        const newDistance = this._levenshtein(normalizedTarget, normalizedSpoken);
        const maxLen = Math.max(normalizedTarget.length, normalizedSpoken.length);
        const newScore = (1 - newDistance / maxLen) * 100;

        return Math.max(baseScore, (baseScore + newScore) / 2 + 5);
    }

    _generateFeedback(score, target, spoken) {
        const tips = [];

        // Check for difficult sounds
        if (target.includes('kh') && !spoken.toLowerCase().includes('kh')) {
            tips.push({ sound: 'kh', tip: "The 'kh' sound is like Scottish 'loch'" });
        }
        if (target.includes('gh') && !spoken.toLowerCase().includes('gh')) {
            tips.push({ sound: 'gh', tip: "The 'gh' is a guttural sound, like French 'r'" });
        }
        if (target.includes('3') || target.includes('ayn')) {
            tips.push({ sound: "'ayn", tip: "The 'ayn is pharyngeal - tighten your throat" });
        }
        if (target.includes('q') && !spoken.toLowerCase().includes('q')) {
            tips.push({ sound: 'q', tip: "The 'q' is a deep 'k' from the throat" });
        }

        let message, emoji;
        if (score >= 90) {
            message = "Excellent! Native-like pronunciation!";
            emoji = "[A]";
        } else if (score >= 75) {
            message = "Great job! Very clear.";
            emoji = "[B]";
        } else if (score >= 60) {
            message = "Good effort! Keep practicing.";
            emoji = "[C]";
        } else if (score >= 40) {
            message = "Needs work. Focus on the sounds.";
            emoji = "[D]";
        } else {
            message = "Try again. Listen carefully first.";
            emoji = "[E]";
        }

        return { message, emoji, tips };
    }

    /** Get phonetic breakdown for offline practice */
    getPhoneticBreakdown(phrase) {
        const syllables = phrase.phonetic.split('-');
        const breakdown = syllables.map(s => {
            const approximations = {
                'LAM': "'lam' as in 'llama'",
                'CHHAL': "'chhal' rhymes with 'shall'",
                'KHEER': "'kheer' with throaty 'kh'",
                'ZAF': "'zaf' as in 'staff'",
                'SHOO': "'shoo' as in 'shoe'",
                'BGHIT': "soft 'b', silent 'gh'"
            };
            return {
                syllable: s,
                approximation: approximations[s.toUpperCase()] || null
            };
        });

        return {
            syllables: breakdown,
            tips: [
                'Listen to audio carefully',
                'Repeat slowly, then faster',
                'Write it phonetically',
                'Record yourself and compare'
            ]
        };
    }
}

// ---------------------------------------------------------------
// PHRASE SYSTEM INSTANCES
// ---------------------------------------------------------------
const phraseLibrary = new PhraseLibrary();
const pronunciationTrainer = new PronunciationTrainer();

// Expose globally
window.ARABIC_PHRASES = ARABIC_PHRASES;
window.phraseLibrary = phraseLibrary;
window.pronunciationTrainer = pronunciationTrainer;

phrasesRuntimeDebugLog('[ALIDADE] Arabic Phrase Assistant Initialized');


/**
 * ---------------------------------------------------------------
 * PHRASE ASSISTANT UI
 * Frontend implementation for the Arabic Voice Assistant
 * ---------------------------------------------------------------
 */

// Known existing audio files (basename only)
const EXISTING_AUDIO_FILES = phraseConfigData.EXISTING_AUDIO_FILES || new Set();

function isAudioMissing(path) {
    const basename = path.split('/').pop();
    return !EXISTING_AUDIO_FILES.has(basename);
}

function ensurePracticeModalShell() {
    let modal = document.getElementById('practice-modal');
    if (modal) return modal;

    const shellHtml = `
            <div id="practice-modal" class="fixed inset-0 z-[120] flex items-end justify-center transform translate-y-full transition-transform duration-300 ease-out pointer-events-none" style="transform: translateY(100%); pointer-events: none;">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="practice-backdrop" style="opacity: 0; pointer-events: none; transition: opacity 0.3s;"></div>

                <div class="relative bg-void-900 border-t border-signal-emerald/30 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto w-full max-w-md mx-auto z-10">
                    <div class="w-full flex justify-center pt-3 pb-1">
                        <div class="w-12 h-1.5 bg-void-700 rounded-full"></div>
                    </div>
                    <div id="modal-content" class="p-6 space-y-6"></div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', shellHtml);
    modal = document.getElementById('practice-modal');
    return modal;
}

function getPhraseViewState() {
    if (!window.__phraseViewState) {
        window.__phraseViewState = { activeCat: 'all', query: '' };
    }
    return window.__phraseViewState;
}

function getPhrasesByCategory(category) {
    const accessiblePhrases = getAccessiblePhrases();
    const allowedIds = new Set(accessiblePhrases.map((phrase) => phrase.id));

    if (category === 'favorites') {
        return phraseLibrary.getFavorites().filter((phrase) => allowedIds.has(phrase.id));
    }
    if (category === 'all') {
        return accessiblePhrases;
    }
    if (!isPhraseCategoryUnlocked(category)) {
        return [];
    }
    return accessiblePhrases.filter((phrase) => phrase.category === category);
}

function filterPhrasesByQuery(phrases, query) {
    const q = String(query || '').trim();
    if (!q) return phrases;

    const lower = q.toLowerCase();
    return phrases.filter(p =>
        p.english.toLowerCase().includes(lower) ||
        p.darija.toLowerCase().includes(lower) ||
        p.phonetic.toLowerCase().includes(lower) ||
        p.arabic.includes(q)
    );
}

function applyPhraseFilter() {
    const state = getPhraseViewState();
    const base = getPhrasesByCategory(state.activeCat || 'all');
    const filtered = filterPhrasesByQuery(base, state.query || '');
    renderPhraseList(filtered);
}

function setActivePhraseTab(activeCat) {
    document.querySelectorAll('.phrase-cat-btn').forEach(btn => {
        const isActive = btn.dataset.cat === activeCat;
        btn.classList.toggle('bg-signal-emerald/20', isActive);
        btn.classList.toggle('text-emerald-400', isActive);
        btn.classList.toggle('border-signal-emerald/30', isActive);

        btn.classList.toggle('bg-void-800/50', !isActive);
        btn.classList.toggle('text-zinc-400', !isActive);
        btn.classList.toggle('border-void-700/30', !isActive);
    });
}

/**
 * Render the main Phrases view
 */
function renderPhrases() {
    const app = document.getElementById('app');
    if (!app) return;
    const hasUltimateAccess = isUltimateTierActive();
    const unlockedCategories = getUnlockedPhraseCategories();
    const lockedCategories = getLockedPhraseCategories();

    if (!hasUltimateAccess) {
        trackLockImpression('PHRASES_FULL_ARCHIVE', 'phrases_view');
    }

    // Header
    let html = `
            <div class="p-4 space-y-4 pb-24">
                <header class="flex items-center gap-3 mb-6">
                    <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 -ml-2 rounded-full hover:bg-void-800 text-zinc-400 hover:text-white transition-colors">
                        ${ICONS.arrowLeft}
                    </button>
                    <div class="flex-1 flex justify-between items-center">
                        <div>
                            <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                <span class="text-signal-emerald">*</span> LANGUAGE BRIDGE
                            </h1>
                            <p class="text-zinc-400 text-sm">Speak like a local.</p>
                        </div>
                        <div class="text-xs font-mono text-zinc-500 border border-void-800 px-2 py-1 rounded">
                            PRO-7 AUDIO
                        </div>
                    </div>
                </header>

                <!-- Status Bar -->
                <div class="flex gap-2 mb-4">
                    <div class="bg-void-900/50 border border-void-800 rounded px-3 py-2 flex-1 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${navigator.onLine ? 'bg-signal-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}"></span>
                        <span class="text-xs font-mono text-zinc-400">${navigator.onLine ? 'ONLINE: VOICE ACTIVE' : 'OFFLINE: PLAYBACK ONLY'}</span>
                    </div>
                </div>

                ${hasUltimateAccess ? '' : `
                <div class="rounded-machined border border-signal-amber/40 bg-signal-amber/5 p-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-[10px] text-signal-amber uppercase tracking-widest font-mono">CLASSIFIED PREVIEW</p>
                            <p class="text-xs text-zinc-300 mt-1">Basic includes critical phrases only. Unlock full archive for all categories and drills.</p>
                        </div>
                        <button
                            onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: 'phrases_banner', feature: 'PHRASES_FULL_ARCHIVE' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'PHRASES_FULL_ARCHIVE')"
                            class="px-3 py-2 bg-signal-amber text-black text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm hover:bg-amber-400 transition-colors"
                        >
                            UNLOCK
                        </button>
                    </div>
                </div>
                `}

                <!-- Search -->
                <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="phrase-search" 
                        class="bg-void-900 border border-void-800 text-zinc-100 text-sm rounded-machined focus:ring-emerald-500 focus:border-signal-emerald block w-full pl-10 p-3 transition-all placeholder-zinc-600" 
                        placeholder="Search English, Arabic, or phonetic...">
                </div>

                <!-- Categories -->
                <div class="flex overflow-x-auto pb-2 gap-2 no-scrollbar" id="phrase-categories">
                    <button class="phrase-cat-btn active whitespace-nowrap px-4 py-2 rounded-full bg-signal-emerald/20 text-emerald-400 border border-signal-emerald/30 text-sm font-medium transition-all" data-cat="all"> All </button>
                    <button class="phrase-cat-btn whitespace-nowrap px-4 py-2 rounded-full bg-void-800/50 text-zinc-400 border border-void-700/30 text-sm font-medium hover:bg-void-800 transition-all" data-cat="favorites"> Favorites </button>
                    ${unlockedCategories.map(cat => `
                        <button class="phrase-cat-btn whitespace-nowrap px-4 py-2 rounded-full bg-void-800/50 text-zinc-400 border border-void-700/30 text-sm font-medium hover:bg-void-800 transition-all" data-cat="${cat.key}">
                            ${cat.icon} ${cat.name}
                        </button>
                    `).join('')}
                    ${lockedCategories.map(cat => `
                        <button
                            type="button"
                            onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: 'phrases_locked_category', feature: 'PHRASES_FULL_ARCHIVE' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'PHRASES_FULL_ARCHIVE')"
                            class="whitespace-nowrap px-4 py-2 rounded-full bg-signal-amber/10 text-signal-amber border border-signal-amber/30 text-sm font-medium transition-all"
                        >
                            ${cat.icon} ${cat.name} | CLASSIFIED
                        </button>
                    `).join('')}
                </div>

                <!-- Phrase List -->
                <div id="phrase-list" class="space-y-3 min-h-[50vh]">
                    <!-- Populated by JS -->
                </div>
            </div>

        `;

    app.innerHTML = html;
    ensurePracticeModalShell();

    // Initialize Logic
    setupPhraseListeners();
    const state = getPhraseViewState();
    state.activeCat = 'all';
    state.query = '';
    setActivePhraseTab(state.activeCat);
    applyPhraseFilter();

    // Setup Search
    const searchInput = document.getElementById('phrase-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const viewState = getPhraseViewState();
            viewState.query = e.target.value || '';
            applyPhraseFilter();
        });
    }
}

function renderPhraseList(phrases) {
    const container = document.getElementById('phrase-list');
    if (!container) return;

    if (phrases.length === 0) {
        container.innerHTML = `
                <div class="text-center py-12 text-zinc-500">
                    <div class="text-4xl mb-2">*</div>
                    <p>No phrases found.</p>
                </div>
            `;
        return;
    }

    container.innerHTML = phrases.map(phrase => {
        const isFav = phraseLibrary.isFavorite(phrase.id);
        const missingAudio = isAudioMissing(phrase.audio);
        const greetingFluencyLocked = isGreetingFluencyLocked(phrase);
        const fluencyUpgradeAction = "window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: 'phrases_greetings_fluency_lock', feature: 'PHRASES_FULL_ARCHIVE' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'PHRASES_FULL_ARCHIVE')";
        const difficultyColor = {
            easy: 'text-emerald-400',
            medium: 'text-amber-400',
            hard: 'text-rose-400'
        }[phrase.difficulty] || 'text-zinc-400';

        if (greetingFluencyLocked) {
            trackLockImpression('PHRASES_FULL_ARCHIVE', 'phrases_greetings_fluency_lock');
        }

        return `
                <div class="bg-void-900/40 border border-void-800/60 rounded-machined p-4 active:bg-void-800/40 transition-colors relative overflow-hidden group">
                    <!-- Background accent -->
                    <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

                    <div class="flex justify-between items-start mb-2">
                        <div class="space-y-1">
                            <h3 class="text-white font-medium text-lg leading-tight flex items-center gap-2">
                                ${phrase.english}
                                ${missingAudio ? '<span class="text-[10px] bg-signal-amber/10 text-signal-amber border border-signal-amber/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Rec Needed</span>' : ''}
                            </h3>
                            <div class="text-2xl font-arabic text-emerald-100 font-bold py-1 ${greetingFluencyLocked ? 'blur-[4px] select-none' : ''}" dir="rtl" lang="ar">${phrase.arabic}</div>
                            <div class="text-emerald-400/80 font-mono text-sm tracking-wide">${phrase.phonetic}</div>
                        </div>
                        <button type="button" data-phrase-action="toggle-favorite" data-phrase-id="${phrase.id}" class="p-2 -mr-2 -mt-2 text-zinc-600 hover:text-amber-400 transition-colors ${isFav ? 'text-amber-400' : ''}">
                            ${isFav ? '?' : '?'}
                        </button>
                    </div>

                    <div class="flex items-center justify-between mt-4">
                        <div class="flex gap-2">
                            <span class="text-xs ${difficultyColor} bg-void-950/50 px-2 py-0.5 rounded border border-void-800 uppercase tracking-wider">${phrase.difficulty}</span>
                            <span class="text-xs text-zinc-500 bg-void-950/50 px-2 py-0.5 rounded border border-void-800 uppercase tracking-wider">${phrase.category}</span>
                        </div>
                        
                        <div class="relative">
                            <div class="flex gap-2">
                                ${greetingFluencyLocked ? `
                                    <button type="button" onclick="${fluencyUpgradeAction}" class="w-10 h-10 rounded-full bg-void-800 text-emerald-400 flex items-center justify-center border border-void-700 blur-[4px]">
                                        *
                                    </button>
                                    <button type="button" onclick="${fluencyUpgradeAction}" class="h-10 px-4 rounded-full bg-signal-amber/10 text-signal-amber border border-signal-amber/30 flex items-center gap-2 transition-all">
                                        Locked
                                    </button>
                                ` : `
                                    <button type="button" data-phrase-action="play-audio" data-phrase-id="${phrase.id}" class="w-10 h-10 rounded-full bg-void-800 text-emerald-400 flex items-center justify-center border border-void-700 hover:bg-signal-emerald hover:text-black hover:border-emerald-400 transition-all ${missingAudio ? 'opacity-50' : ''}">
                                        *
                                    </button>
                                    <button type="button" data-phrase-action="open-practice" data-phrase-id="${phrase.id}" class="h-10 px-4 rounded-full bg-signal-emerald/10 text-emerald-400 border border-signal-emerald/30 flex items-center gap-2 hover:bg-signal-emerald hover:text-black transition-all">
                                        Practice
                                    </button>
                                `}
                            </div>
                            ${greetingFluencyLocked ? `
                                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span class="px-2 py-1 rounded-sm bg-black/85 border border-signal-amber/40 text-[10px] text-signal-amber font-mono font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                                        UNLOCK FLUENCY PACK
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
    }).join('');
}

function setupPhraseListeners() {
    // Category Buttons
    document.querySelectorAll('.phrase-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const state = getPhraseViewState();
            state.activeCat = btn.dataset.cat || 'all';
            setActivePhraseTab(state.activeCat);
            applyPhraseFilter();
            Haptics?.trigger('light');
        });
    });

    // Close Modal on Backdrop Click
    const backdrop = document.getElementById('practice-backdrop');
    if (backdrop && !backdrop.dataset.closeBound) {
        backdrop.dataset.closeBound = '1';
        backdrop.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closePracticeModal();
        });
    }

    // Stable delegation for phrase card actions across rerenders/navigation
    if (!window.__phraseActionDelegateBound) {
        window.__phraseActionDelegateBound = true;

        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-phrase-action]');
            if (!actionBtn) return;

            const phraseId = actionBtn.dataset.phraseId;
            const action = actionBtn.dataset.phraseAction;
            if (!phraseId || !action) return;

            e.preventDefault();

            if (action === 'toggle-favorite') {
                window.togglePhraseFavorite(phraseId);
                return;
            }

            if (action === 'play-audio') {
                window.playPhraseAudio(phraseId);
                return;
            }

            if (action === 'open-practice') {
                window.openPracticeModal(phraseId);
            }
        });
    }
}

// Global Handlers
window.playPhraseAudio = async (id) => {
    const btn = document.querySelector(`button[data-phrase-action="play-audio"][data-phrase-id="${id}"]`);
    if (btn) btn.classList.add('animate-pulse', 'text-emerald-200');

    const success = await phraseLibrary.playPhrase(id);

    if (btn) {
        btn.classList.remove('animate-pulse', 'text-emerald-200');
        if (!success) {
            // Shake effect on error
            btn.classList.add('animate-shake');
            setTimeout(() => btn.classList.remove('animate-shake'), 400);
        }
    }
};

window.togglePhraseFavorite = (id) => {
    const isFav = phraseLibrary.toggleFavorite(id);
    const btn = document.querySelector(`button[data-phrase-action="toggle-favorite"][data-phrase-id="${id}"]`);
    if (btn) {
        btn.innerHTML = isFav ? '?' : '?';
        btn.classList.toggle('text-amber-400', isFav);
    }

    const state = getPhraseViewState();
    if (state.activeCat === 'favorites') {
        applyPhraseFilter();
    }
};

/**
 * Practice Modal Logic (Bottom Sheet)
 */
/**
 * Practice Modal Logic (Bottom Sheet)
 */
/**
 * Practice Modal Logic (Bottom Sheet)
 */
function resetPracticeButton(practiceBtn, micMessage = '', micMessageClass = 'text-zinc-500') {
    if (!practiceBtn) return;

    practiceBtn.disabled = false;
    practiceBtn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse', 'opacity-50');
    practiceBtn.classList.add('bg-signal-emerald', 'text-black');
    practiceBtn.innerHTML = '<span>*</span> Tap to Practice';

    if (micMessage) {
        const micStatus = document.getElementById('mic-status');
        if (micStatus) {
            micStatus.classList.remove('hidden');
            micStatus.innerHTML = `<span class="${micMessageClass}">${micMessage}</span>`;
        }
    }
}

async function startPracticeFromModalButton(practiceBtn) {
    if (!practiceBtn) return;

    // Prevent multiple clicks if already disabled
    if (practiceBtn.disabled) {
        phrasesRuntimeDebugLog('[PRACTICE] Button already disabled, ignoring click');
        return;
    }

    phrasesRuntimeDebugLog('[PRACTICE] Button clicked');

    // IMMEDIATE AUDIO RESUME (Critical for iOS/Mobile)
    if (window.audioCtx && window.audioCtx.state === 'suspended') {
        phrasesRuntimeDebugLog('[PRACTICE] Resuming suspended AudioContext');
        try {
            await window.audioCtx.resume();
        } catch (e) {
            console.warn('[PRACTICE] AudioContext resume failed:', e);
        }
    }

    // Visual feedback - brief opacity flash to confirm click registered
    const originalOpacity = practiceBtn.style.opacity;
    practiceBtn.style.opacity = '0.6';
    setTimeout(() => {
        practiceBtn.style.opacity = originalOpacity || '1';
    }, 100);

    const phraseId = practiceBtn.dataset.phraseId;
    const phrase = ALL_PHRASES.find(p => p.id === phraseId);
    if (!phrase) {
        console.error('[PRACTICE] Phrase not found for ID:', phraseId);
        return;
    }

    phrasesRuntimeDebugLog('[PRACTICE] Starting practice for phrase:', phrase.english);

    // Stability Fix: Ensure AudioContext exists
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!window.audioCtx && AudioContext) {
            window.audioCtx = new AudioContext();
            phrasesRuntimeDebugLog('[PRACTICE] Created new AudioContext');
        }
    } catch (e) {
        console.warn('[PRACTICE] AudioContext creation failed:', e);
    }

    // 1. Permission Check
    if (!navigator.onLine) {
        alert('Offline Mode: Speech recognition requires an internet connection.');
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone API is not available on this browser.');
        return;
    }

    try {
        // Request Mic Permission explicit check
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking access
    } catch (err) {
        alert('Microphone Access Denied: Please enable microphone permissions in your browser settings to practice.');
        return;
    }

    // 2. Start Interface
    practiceBtn.disabled = true;

    // SAFETY TIMEOUT: Force reset if engine hangs (8 seconds)
    const safetyTimer = setTimeout(() => {
        console.warn('[SAFETY] Recognition timed out, resetting UI.');
        resetPracticeButton(practiceBtn, 'Timed out. Try again.', 'text-zinc-500');
    }, 8000);

    // 3. Start Trainer (Async Stop-Wait-Start)
    const started = await pronunciationTrainer.startPractice(
        phrase,
        (result) => {
            clearTimeout(safetyTimer); // Clear safety timer on success
            showPracticeResult(result, phrase.id);
        },
        (error) => {
            clearTimeout(safetyTimer); // Clear safety timer on error
            resetPracticeButton(practiceBtn, error, 'text-signal-crimson');
        }
    );

    // 4. Update UI to "Listening" only after Cool-down & Start
    if (started) {
        practiceBtn.classList.remove('bg-signal-emerald', 'hover:bg-emerald-400', 'text-black');
        practiceBtn.classList.add('bg-rose-600', 'text-white', 'animate-pulse');
        practiceBtn.innerHTML = '<span>*</span> Listening...';

        const micStatus = document.getElementById('mic-status');
        if (micStatus) {
            micStatus.classList.remove('hidden');
        }

        const practiceResult = document.getElementById('practice-result');
        if (practiceResult) {
            practiceResult.classList.add('hidden');
        }
    } else {
        clearTimeout(safetyTimer);
        resetPracticeButton(practiceBtn, 'Failed to start. Try again.', 'text-signal-crimson');
    }
}

window.openPracticeModal = async (id) => {
    ensurePracticeModalShell();

    const phrase = ALL_PHRASES.find(p => p.id === id);
    if (!phrase) return;

    const modal = document.getElementById('practice-modal');
    const modalContent = document.getElementById('modal-content');
    const backdrop = document.getElementById('practice-backdrop');
    if (!modal || !modalContent) return;

    // Generate Modal Content inside the existing modal shell
    modalContent.innerHTML = `
            <div class="relative space-y-6">
                <!-- Close Button -->
                <button onclick="closePracticeModal()" 
                        class="absolute -top-2 right-0 text-zinc-500 hover:text-white text-2xl z-10">
                    ?
                </button>

                <!-- Phrase Header -->
                <div class="mb-6 pr-10">
                    <h3 class="text-2xl font-bold text-white mb-2">${phrase.english}</h3>
                    <p class="text-signal-amber text-xl mb-1" dir="rtl">${phrase.arabic}</p>
                    <p class="text-emerald-400 font-mono text-sm">${phrase.phonetic}</p>
                </div>

                <!-- Practice Controls -->
                <div id="practice-controls" class="space-y-4 pt-2">
                    <div id="mic-status" class="text-sm text-zinc-400 text-center hidden"></div>
                    
                    <button id="start-practice-btn" 
                            data-phrase-id="${phrase.id}" 
                            class="w-full py-4 rounded-machined bg-signal-emerald text-black font-bold text-lg tracking-wide hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)]">
                        <span>*</span> Tap to Practice
                    </button>
                    
                    <button onclick="playPhraseAudio('${id}')" class="w-full py-3 rounded-machined bg-void-800 text-zinc-300 font-medium hover:bg-void-700 transition-all">
                        Listen Again
                    </button>
                </div>

                <!-- Practice Result (Hidden initially) -->
                <div id="practice-result" class="hidden bg-void-800/50 rounded-machined p-4 border border-void-700">
                    <!-- Results populated dynamically -->
                </div>
            </div>
        `;

    // Wait for DOM to be painted before wiring interactions
    await new Promise(resolve => requestAnimationFrame(resolve));

    const practiceBtn = document.getElementById('start-practice-btn');
    if (!practiceBtn) return;

    practiceBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await startPracticeFromModalButton(practiceBtn);
    };

    // Support Check
    if (!pronunciationTrainer.isSupported) {
        practiceBtn.disabled = true;
        practiceBtn.classList.add('opacity-50', 'cursor-not-allowed');
        practiceBtn.innerHTML = '<span>*</span> Not Supported on this Browser';
        const micStatus = document.getElementById('mic-status');
        micStatus.classList.remove('hidden');
        micStatus.innerHTML = '<span class="text-signal-crimson">Please use Chrome or Edge</span>';
    }

    // Mobile touch optimization
    practiceBtn.style.touchAction = 'manipulation';

    // Show Modal with Animation
    modal.classList.remove('pointer-events-none');
    modal.style.pointerEvents = 'auto';
    modal.style.transform = 'translateY(0)';
    if (backdrop) {
        backdrop.style.opacity = '1';
        backdrop.style.pointerEvents = 'auto';
    }

    phrasesRuntimeDebugLog('[PRACTICE] Modal opened for:', phrase.english);
};

function showPracticeResult(result, phraseId) {
    document.getElementById('mic-status').classList.add('hidden');
    document.getElementById('practice-controls').classList.add('hidden');

    const resultArea = document.getElementById('practice-result');
    resultArea.classList.remove('hidden');

    const scoreColor = result.score >= 80 ? 'text-emerald-400' : (result.score >= 50 ? 'text-amber-400' : 'text-rose-400');
    const borderColor = result.score >= 80 ? 'border-signal-emerald/30' : (result.score >= 50 ? 'border-signal-amber/30' : 'border-signal-crimson/30');

    resultArea.className = `bg-void-900 border ${borderColor} rounded-machined p-6 transition-all animate-fadeIn`;
    resultArea.innerHTML = `
            <div class="text-center space-y-4">
                <div class="text-6xl animate-bounce">${result.feedback.emoji}</div>
                <div>
                    <div class="text-sm text-zinc-500 font-mono uppercase">Unrivaled Analysis</div>
                    <div class="text-4xl font-bold ${scoreColor}">${result.score}%</div>
                    <div class="text-white font-medium mt-1">${result.feedback.message}</div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-sm bg-void-950/50 p-3 rounded-machined border border-void-800">
                    <div class="text-zinc-500">Target</div>
                    <div class="text-emerald-400 font-mono">${result.target}</div>
                    <div class="text-zinc-500">You said</div>
                    <div class="text-white font-mono">${result.spoken || '...'}</div>
                </div>

                ${result.feedback.tips.length > 0 ? `
                    <div class="text-left bg-signal-amber/10 border border-signal-amber/20 rounded p-3 text-sm">
                        <div class="text-signal-amber font-bold text-xs uppercase mb-1">Correction Intel</div>
                        <ul class="list-disc list-inside text-amber-200/80 space-y-1">
                            ${result.feedback.tips.map(t => `<li><span class="font-bold text-amber-400">${t.sound}:</span> ${t.tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <button onclick="openPracticeModal('${phraseId}'); setTimeout(() => document.getElementById('start-practice-btn').click(), 200);" class="w-full py-3 bg-void-800 hover:bg-void-700 rounded-machined text-white font-medium">
                    Try Again
                </button>
                <button onclick="closePracticeModal()" class="w-full py-3 text-zinc-400 hover:text-white">
                    Close
                </button>
            </div>
        `;

    // Haptic score
    if (result.score >= 80) Haptics?.trigger('success');
    else Haptics?.trigger('warning');
}

window.closePracticeModal = () => {
    const modal = document.getElementById('practice-modal');
    const backdrop = document.getElementById('practice-backdrop');
    if (!modal) return;

    modal.style.transform = 'translateY(100%)';
    modal.style.pointerEvents = 'none';
    modal.classList.add('pointer-events-none');
    if (backdrop) {
        backdrop.style.opacity = '0';
        backdrop.style.pointerEvents = 'none';
    }

    pronunciationTrainer.stopPractice();
    phraseLibrary.currentAudio?.pause();
};

// ---------------------------------------------------------------
// PRACTICE HANDLER BOOTSTRAP
// ---------------------------------------------------------------
function initializePracticeEventDelegation() {
    if (window.__practiceBootstrapLogged) return;
    window.__practiceBootstrapLogged = true;
    phrasesRuntimeDebugLog('[PRACTICE] Direct modal binding ready');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePracticeEventDelegation);
} else {
    // DOM already loaded, initialize immediately
    initializePracticeEventDelegation();
}
