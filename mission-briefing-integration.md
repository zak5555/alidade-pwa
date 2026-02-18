# Mission Briefing Modal - Integration Guide

This guide shows you how to integrate the Mission Briefing boot sequence into your existing `index.html`.

## Step 1: Add Fonts to `<head>`

Add these font imports to your existing `<head>` section:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
```

## Step 2: Add CSS Styles

Add this to your existing `<style>` section or `style.css`:

```css
/* Mission Briefing Modal Styles */
.modal-overlay {
    transition: opacity 0.5s ease-out, backdrop-filter 0.5s ease-out;
}

.modal-overlay.hiding {
    opacity: 0;
    backdrop-filter: blur(0px);
}

.modal-content {
    transition: transform 0.5s ease-out, opacity 0.5s ease-out;
}

.modal-overlay.hiding .modal-content {
    transform: scale(0.95);
    opacity: 0;
}

@keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}

.scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(to bottom, transparent, rgba(245, 158, 11, 0.3), transparent);
    animation: scan 3s linear infinite;
}
```

## Step 3: Add Modal HTML

Add this modal HTML RIGHT AFTER your opening `<body>` tag (before all other content):

```html
<!-- Mission Briefing Modal Overlay -->
<div id="missionBriefingModal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
    
    <!-- Scan Line Effect -->
    <div class="scan-line"></div>
    
    <!-- Modal Card -->
    <div class="modal-content relative max-w-3xl w-full mx-4 bg-zinc-950 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
        
        <!-- Decorative Top Border -->
        <div class="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 bg-zinc-900/50">
            <p class="text-xs text-amber-500 tracking-widest uppercase" style="font-family: 'Orbitron', monospace;">
                SYSTEM INITIALIZATION // CONCEPT
            </p>
        </div>
        
        <!-- Content -->
        <div class="px-8 py-12 space-y-8" dir="rtl">
            
            <!-- Logo/Icon -->
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 border-2 border-amber-500 rounded-full flex items-center justify-center">
                    <span class="text-3xl">🎯</span>
                </div>
            </div>
            
            <!-- Arabic Manifesto Text -->
            <div class="space-y-6 text-center" style="font-family: 'Cairo', sans-serif;">
                <p class="text-white text-xl md:text-2xl leading-relaxed font-semibold">
                    مشروع <span class="text-amber-500 font-bold">ALIDADE™</span> ليس دليلاً سياحياً.
                </p>
                
                <p class="text-zinc-300 text-lg md:text-xl leading-relaxed">
                    إنه يُعرف مفاهيمياً كنظام تشغيل تكتيكي 
                    <span class="text-amber-500 font-bold" style="font-family: 'IBM Plex Mono', monospace;">(Tactical OS)</span> 
                    لمدينة مراكش.
                </p>
                
                <p class="text-zinc-300 text-lg md:text-xl leading-relaxed">
                    إنه أصل رقمي مصمم لتزويد العميل بالاستخبارات، والأدوات اللغوية، والبيانات اللوجستية 
                    للتنقل في <span class="text-amber-500 font-bold">بيئة معلوماتية معادية</span> بدقة عميل ميداني.
                </p>
                
                <p class="text-white text-lg md:text-xl leading-relaxed font-semibold">
                    هذا ليس كتاباً إلكترونياً، ولا خدمة كونسيرج. 
                    <span class="text-amber-400">هذا عتاد ضروري لنجاح المهمة.</span>
                </p>
            </div>
            
            <!-- Divider -->
            <div class="flex items-center gap-4 py-4">
                <div class="flex-1 h-px bg-gradient-to-r from-transparent to-white/20"></div>
                <span class="text-amber-500 text-xs" style="font-family: 'Orbitron', monospace;">◈</span>
                <div class="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
            </div>
            
            <!-- English Translation -->
            <div class="text-center text-zinc-500 text-sm space-y-2" style="font-family: 'IBM Plex Mono', monospace;" dir="ltr">
                <p>Project ALIDADE™ is not a tourist guide.</p>
                <p>It is conceptually defined as a Tactical OS for Marrakech.</p>
                <p>Essential gear for mission success.</p>
            </div>
        </div>
        
        <!-- Action Button -->
        <div class="px-8 pb-8">
            <button 
                id="initializeBtn"
                class="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-lg rounded-lg transition-all duration-300 uppercase tracking-wider shadow-lg shadow-amber-500/50 hover:shadow-amber-500/70"
                style="font-family: 'Orbitron', monospace;">
                🔓 INITIALIZE SYSTEM
            </button>
            <p class="text-center text-zinc-600 text-xs mt-3" style="font-family: 'IBM Plex Mono', monospace;">
                // بدء التشغيل
            </p>
        </div>
        
        <!-- Decorative Bottom Border -->
        <div class="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
    </div>
</div>
```

## Step 4: Add JavaScript Logic

Add this JavaScript to your `app.js` or in a `<script>` tag at the end of your HTML (before closing `</body>`):

```javascript
// Mission Briefing Modal Logic
document.addEventListener('DOMContentLoaded', function() {
    const hasSeenBriefing = localStorage.getItem('hasSeenBriefing');
    const modal = document.getElementById('missionBriefingModal');
    const initializeBtn = document.getElementById('initializeBtn');

    // Hide modal if user has already seen it
    if (hasSeenBriefing === 'true') {
        modal.style.display = 'none';
    }

    // Handle "Initialize System" button click
    if (initializeBtn) {
        initializeBtn.addEventListener('click', function() {
            // Add hiding class for smooth transition
            modal.classList.add('hiding');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
                
                // Save flag to localStorage
                localStorage.setItem('hasSeenBriefing', 'true');
            }, 500); // Match the CSS transition duration
        });
    }
});
```

## Step 5: Testing

To test the modal again after dismissing it:

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Delete the `hasSeenBriefing` key
4. Refresh the page

Or run this in the console:
```javascript
localStorage.removeItem('hasSeenBriefing');
location.reload();
```

## Customization Options

### Force Users to Always See It
Remove the localStorage logic entirely and the modal will show on every visit.

### Change Duration
Adjust the timeout in JavaScript (currently 500ms) to match your desired fade duration.

### Different Button Text
Change "INITIALIZE SYSTEM" to whatever you prefer, like:
- "ENTER TACTICAL OS"
- "BEGIN MISSION"
- "ACCESS GRANTED"

---

**Note:** The standalone `mission-briefing.html` file is a complete demo you can open directly in a browser to see the full effect.
