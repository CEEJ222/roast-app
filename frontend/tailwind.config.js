/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme color palette inspired by modern dark UIs
        dark: {
          // Background colors
          bg: {
            primary: '#0a0a0a',      // Deep black background
            secondary: '#111111',    // Slightly lighter for cards
            tertiary: '#1a1a1a',     // Even lighter for elevated elements
            quaternary: '#262626',    // Lightest for borders/separators
          },
          // Text colors
          text: {
            primary: '#ffffff',      // Pure white for primary text
            secondary: '#a3a3a3',    // Light gray for secondary text
            tertiary: '#737373',     // Medium gray for tertiary text
            muted: '#525252',        // Darker gray for muted text
          },
          // Accent colors (vibrant deep blue and purple gradient theme)
          accent: {
            primary: '#4f46e5',      // Deep indigo (main brand)
            secondary: '#7c3aed',    // Vibrant purple
            tertiary: '#a855f7',     // Bright purple
            quaternary: '#c084fc',   // Light purple
            success: '#10b981',       // Green for success states
            warning: '#f59e0b',      // Amber for warnings
            error: '#ef4444',        // Red for errors
            info: '#3b82f6',         // Blue for info
          },
          // Border colors
          border: {
            primary: '#262626',      // Main border color
            secondary: '#404040',    // Lighter border
            accent: '#4f46e5',       // Accent border (deep indigo)
          },
          // Chart colors for dark theme
          chart: {
            primary: '#4f46e5',     // Deep indigo
            secondary: '#7c3aed',   // Vibrant purple
            tertiary: '#a855f7',    // Bright purple
            blue: '#3b82f6',
            green: '#10b981',
            red: '#ef4444',
            cyan: '#06b6d4',
            yellow: '#f59e0b',
            pink: '#ec4899',
          }
        }
      },
      // Custom gradients for dark theme
      backgroundImage: {
        'dark-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)',
        'dark-card': 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
        'accent-gradient': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
        'accent-gradient-light': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        'accent-gradient-vibrant': 'linear-gradient(135deg, #3730a3 0%, #4f46e5 25%, #7c3aed 75%, #a855f7 100%)',
        'success-gradient': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'warning-gradient': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      },
      // Custom shadows for dark theme
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        'dark-glow': '0 0 20px rgba(79, 70, 229, 0.4)',
        'accent-glow': '0 0 20px rgba(79, 70, 229, 0.5)',
        'purple-glow': '0 0 20px rgba(124, 58, 237, 0.5)',
        'vibrant-glow': '0 0 25px rgba(124, 58, 237, 0.6)',
      },
      // Custom border styles for metallic reflective effect
      borderWidth: {
        'metallic': '1px 0 1px 0', // Top and bottom only
        'metallic-alt': '0 1px 0 1px', // Left and right only
      },
    },
  },
  plugins: [],
}