/**
 * ALIDADEâ„¢ Protocol-7 Design Language System
 * Military-Grade OLED Interface Configuration
 * ================================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // ================================================
      // TYPOGRAPHY STACK - "Cockpit" System
      // ================================================
      fontFamily: {
        // Primary: UI/Labels - Inter with tight tracking
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Secondary: Data/Values - JetBrains Mono
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      letterSpacing: {
        // CRITICAL: Default tight tracking for "Linear" dense feel
        'tight-ui': '-0.025em',
        'tighter-ui': '-0.035em',
        'data': '0.02em',
      },

      // ================================================
      // THE "VOID" PALETTE - Backgrounds
      // ================================================
      colors: {
        // Deep Space Hierarchy
        void: {
          950: '#050505',  // Main Background (Deep Space)
          900: '#0A0A0A',  // Card Surface (Carbon Plate)
          800: '#121212',  // Elevated/Interactive (Armor)
          700: '#18181b',  // Input Fields (Recess)
          600: '#27272a',  // Borders/Dividers
          500: '#3f3f46',  // Disabled/Muted
        },

        // THE "SIGNAL" PALETTE - Data States
        signal: {
          emerald: '#10b981',  // Safe/Healthy
          'emerald-dim': '#059669',
          'emerald-glow': 'rgba(16, 185, 129, 0.15)',

          amber: '#f59e0b',    // Caution/Loading
          'amber-dim': '#d97706',
          'amber-glow': 'rgba(245, 158, 11, 0.15)',

          crimson: '#ef4444',  // Critical/Hostile
          'crimson-dim': '#dc2626',
          'crimson-glow': 'rgba(239, 68, 68, 0.15)',

          cyan: '#06b6d4',     // Telemetry/Info
          'cyan-dim': '#0891b2',
          'cyan-glow': 'rgba(6, 182, 212, 0.15)',
        },

        // Legacy aliases for backward compatibility
        hudBlack: '#050505',
        hudBlackLight: '#0A0A0A',
        neonGreen: '#10b981',
        neonGreenDim: '#059669',
        neonGreenDark: '#064e3b',
        base: '#050505',
        surface: '#0A0A0A',
        'accent-gold': '#f59e0b',
        'accent-emerald': '#10b981',
      },

      // ================================================
      // BORDER RADIUS - "Machined" System
      // ================================================
      borderRadius: {
        'machined': '2px',
        'machined-sm': '1px',
        'machined-lg': '4px',
      },

      // ================================================
      // SHADOWS - "Glow" System (No heavy shadows)
      // ================================================
      boxShadow: {
        // Signal Glows
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15), 0 0 40px rgba(16, 185, 129, 0.05)',
        'glow-emerald-sm': '0 0 10px rgba(16, 185, 129, 0.1)',
        'glow-emerald-lg': '0 0 30px rgba(16, 185, 129, 0.2), 0 0 60px rgba(16, 185, 129, 0.1)',

        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15), 0 0 40px rgba(245, 158, 11, 0.05)',
        'glow-amber-sm': '0 0 10px rgba(245, 158, 11, 0.1)',

        'glow-crimson': '0 0 20px rgba(239, 68, 68, 0.15), 0 0 40px rgba(239, 68, 68, 0.05)',
        'glow-crimson-sm': '0 0 10px rgba(239, 68, 68, 0.1)',

        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.15), 0 0 40px rgba(6, 182, 212, 0.05)',
        'glow-cyan-sm': '0 0 10px rgba(6, 182, 212, 0.1)',

        // Void depth (subtle)
        'void': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'void-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6)',

        // Legacy
        'neon': '0 0 10px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2)',
      },

      // ================================================
      // BACKGROUND IMAGES - Grid System
      // ================================================
      backgroundImage: {
        'micro-grid': 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'vignette': 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(5,5,5,0.8) 100%)',
      },

      backgroundSize: {
        'grid-20': '20px 20px',
      },

      // ================================================
      // ANIMATIONS - Scanline Heartbeat
      // ================================================
      animation: {
        'scanline': 'scanline-heartbeat 10s linear infinite',
        'pulse-signal': 'pulse-signal 2s ease-in-out infinite',
        'data-stream': 'data-stream 3s ease-in-out infinite',
      },

      keyframes: {
        'scanline-heartbeat': {
          '0%': { transform: 'translateY(-100%)' },
          '5%': { opacity: '0.05' },
          '10%': { transform: 'translateY(100vh)', opacity: '0' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        'pulse-signal': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)' },
        },
        'data-stream': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },

      // ================================================
      // SPACING - Tactical Density
      // ================================================
      spacing: {
        'tight': '0.5rem',
        'compact': '0.75rem',
        'standard': '1rem',
        'loose': '1.5rem',
      },
    },
  },
  plugins: [
    // Custom plugin for Protocol-7 utilities
    function ({ addComponents, addUtilities, theme }) {
      // Component base styles
      addComponents({
        '.card-carbon': {
          backgroundColor: theme('colors.void.900'),
          border: `1px solid ${theme('colors.void.800')}`,
          borderRadius: theme('borderRadius.machined'),
        },
        '.panel-armor': {
          backgroundColor: theme('colors.void.800'),
          border: `1px solid ${theme('colors.void.700')}`,
          borderRadius: theme('borderRadius.machined'),
        },
        '.input-recess': {
          backgroundColor: theme('colors.void.700'),
          border: `1px solid ${theme('colors.void.600')}`,
          borderRadius: theme('borderRadius.machined-sm'),
          color: theme('colors.zinc.100'),
          '&:focus': {
            borderColor: theme('colors.signal.emerald'),
            boxShadow: theme('boxShadow.glow-emerald-sm'),
          },
        },
        '.text-data': {
          fontFamily: theme('fontFamily.mono'),
          letterSpacing: theme('letterSpacing.data'),
        },
        '.text-label': {
          fontFamily: theme('fontFamily.sans'),
          letterSpacing: theme('letterSpacing.tight-ui'),
        },
      });

      // Utility classes
      addUtilities({
        '.tracking-tight-ui': {
          letterSpacing: '-0.025em',
        },
        '.tracking-tighter-ui': {
          letterSpacing: '-0.035em',
        },
        '.text-signal-emerald': {
          color: '#10b981',
        },
        '.text-signal-amber': {
          color: '#f59e0b',
        },
        '.text-signal-crimson': {
          color: '#ef4444',
        },
        '.text-signal-cyan': {
          color: '#06b6d4',
        },
      });
    },
  ],
};