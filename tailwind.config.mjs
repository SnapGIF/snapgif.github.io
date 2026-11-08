/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'retro-teal': '#31AAA9',
        'vanilla-cream': '#F8E0A4',
        'crimson-red': '#A82020',
        'burgundy-mahogany': '#6C1A1A',
        'canvas-white': '#FFFFFF',
        'soft-cream': '#FFFDF7',
        'dark-bg': '#1E0B0B',
        'dark-workspace': '#2B1010',
        theme: {
          bg: 'var(--bg-primary)',
          surface: 'var(--bg-surface-card)',
          workspace: 'var(--workspace-box-bg)',
          action: 'var(--primary-action-button)',
          'action-hover': 'var(--primary-action-hover)',
          'action-text': 'var(--primary-action-text)',
          secondary: 'var(--secondary-accent-surface)',
          pill: 'var(--highlight-pill-badge)',
          border: 'var(--border-color)',
          text: 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'retro-card': '0 12px 32px -8px rgba(108, 26, 26, 0.14), 0 4px 0 0 #31AAA9',
        'retro-btn': '0 4px 0 0 #6C1A1A',
        'retro-btn-dark': '0 4px 0 0 #31AAA9',
        'crimson-glow': '0 8px 24px -4px rgba(168, 32, 32, 0.45)'
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(49, 170, 169, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(49, 170, 169, 0)' }
        }
      },
      animation: {
        'float-slow': 'floatSlow 3.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.4s infinite'
      }
    }
  },
  plugins: []
};
