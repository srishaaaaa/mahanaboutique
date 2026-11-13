// Only the barcode stylesheet uses Tailwind (see tailwind.barcode.config.cjs); every other stylesheet passes through untouched.
module.exports = {
  plugins: {
    tailwindcss: { config: './tailwind.barcode.config.cjs' },
    autoprefixer: {},
  },
}
