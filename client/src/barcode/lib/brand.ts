// Store name used on labels and headings. Admin pages call setBrand() with the store's name; live bindings update everywhere.
export let BRAND_EN = 'Mahana Boutique & Tailors'
export let BRAND_MONOGRAM = 'MBT'
export const setBrand = (name?: string | null) => {
  const n = (name || '').trim()
  if (!n) return
  BRAND_EN = n
  BRAND_MONOGRAM = n.split(/[^A-Za-z]+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('').slice(0, 4) || 'MBT'
}
