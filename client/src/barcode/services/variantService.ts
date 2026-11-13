import { fetchBarcodeItems } from './barcodeService'

export interface ProductVariant {
  id: string
  product_id: string
  variantName: string
  price?: number
  stock?: number
  sku?: string
  barcode?: string | null
}

// Mahana keeps every size/colour as a variant of its product; this lists them for the Generator's size select.
export async function fetchVariantsByProduct(productId: string): Promise<ProductVariant[]> {
  const items = await fetchBarcodeItems()
  return items
    .filter((i) => String(i.productId) === String(productId))
    .map((i) => ({ id: String(i.variantId), product_id: String(i.productId), variantName: i.variantName, price: i.price / 100, stock: i.stock, sku: i.sku, barcode: i.barcode }))
}
