// Only the barcode stylesheet uses Tailwind (see tailwind.barcode.config.cjs). The plugin only rewrites `@tailwind` directives, so every other
// stylesheet in Mahana passes through exactly as it did before barcodes were added (no autoprefixer here on purpose: it would touch every file).
module.exports = {
  plugins: {
    tailwindcss: { config: './tailwind.barcode.config.cjs' },
  },
}
