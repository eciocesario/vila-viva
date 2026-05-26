import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Extracted from prototype CSS custom properties
        terra: '#B85C2A',
        mata: '#1A5C38',
        areia: '#F7F2EA',
        carvao: '#1E2B20',
        // Secondary palette tokens
        mata2: '#2E8B57',
        mata3: '#4FAF7A',
        matac: '#E6F3EC',
        matam: '#C8EDD8',
        terrac: '#F5E8DF',
        areia2: '#EDE6D6',
        carvao2: '#3A4D3C',
        ci: '#566A58',
        ci2: '#A8B8A9',
        br: '#FAFDF8',
        ou: '#C49A2A',
        ouc: '#FDF3D0',
        az: '#2A6B8A',
        azc: '#DFF0F7',
        rx: '#6B4FA0',
        rxc: '#EDE7F8',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        soft: '14px',
        card: '20px',
        pill: '999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
