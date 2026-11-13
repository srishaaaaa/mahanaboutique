/**
 * Tailwind for the barcode screens ONLY (copied from Mahalashmi so every class renders the same).
 *  - content is limited to src/barcode, so no other page's CSS is generated;
 *  - important: '.bc' prefixes every rule, so nothing leaks into the rest of Mahana;
 *  - preflight is off (Mahana has its own base styles); src/barcode/barcode.css adds a small scoped reset instead.
 */
module.exports = {
  content: ['./src/barcode/**/*.{ts,tsx}'],
  important: '.bc.bc.bc', // tripled so these utilities beat the admin's own .dpos input rules (the scan box sits inside .dpos)
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bgMain: '#FBFAF6',
        cardBg: '#FFFFFF',
        brand: { black: '#0A0A0A', dark: '#141414', gold: '#2E7D32', goldHover: '#256428', goldLight: '#EAF6EC', goldBorder: '#B7E1BE' },
        gold: { DEFAULT: '#2E7D32', dark: '#1B5E20', light: '#EAF6EC', border: '#B7E1BE' },
        maroon: { DEFAULT: '#2E7D32', dark: '#0A0A0A', light: '#EAF6EC' },
        forestDark: '#123524',
        sage: '#8FBF9F',
        sageDark: '#2F6B44',
        textMain: '#111111',
        textMuted: '#6B7280',
        borderLight: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        dmsans: ['Poppins', 'sans-serif'],
        'dm-sans': ['Poppins', 'sans-serif'],
        outfit: ['Poppins', 'sans-serif'],
        brand: ['Poppins', 'serif'],
        headline: ['Poppins', 'sans-serif'],
      },
      boxShadow: { soft: '0 1px 3px rgba(0,0,0,0.05)', gold: '0 4px 20px -2px rgba(28, 40, 79, 0.25)' },
      borderRadius: { card: '12px', btn: '10px', input: '10px', table: '12px' },
      animation: { float: 'float 4s ease-in-out infinite', floatDelay: 'float 4s ease-in-out 1.5s infinite', slideUp: 'slideUp 0.6s ease forwards', fadeIn: 'fadeIn 0.5s ease forwards' },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
