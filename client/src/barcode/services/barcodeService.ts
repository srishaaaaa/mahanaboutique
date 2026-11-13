import { api } from '../../lib/api'

// Same interface as Mahalashmi's barcodeService, backed by Mahana's /api/admin/pos/barcodes endpoints.
// Prices cross this boundary in DOLLARS (what the screens show); the server works in cents.

export interface BarcodeRegistryRecord {
  id: string
  barcode_value: string
  entity_type: 'product' | 'variant'
  product_id: number
  variant_id?: string | null
  is_active: boolean
  created_by_name: string
  created_at: string
  updated_at: string
  product?: { id: number; name: string; name_ta?: string; price: number; offer_price?: number; image_url?: string; category?: string; stock_quantity?: number; stock?: number }
  variant?: { id: string; variant_name: string; price?: number; stock?: number; sku?: string } | null
}

export interface CreateBarcodeAndReceivePayload {
  product_id: number
  variant_id?: string | null
  quantity_received: number
  unit_cost?: number | null
  created_by_name?: string
  custom_barcode?: string | null
  note?: string
}

export interface CreateBarcodeResponse {
  success: boolean
  barcode_id: string
  barcode_value: string
  is_new_barcode: boolean
  movement_type: string
  quantity_before: number
  quantity_received: number
  quantity_after: number
  product_id: number
  variant_id?: string | null
  product_name: string
  variant_name?: string
}

export interface BarcodeItem {
  variantId: number
  productId: number
  name: string
  variantName: string
  sku: string
  barcode: string | null
  price: number
  cost: number
  stock: number
  category: string | null
  image: string | null
}

const dollars = (c: number | null | undefined) => (c == null ? 0 : c / 100)
let itemsCache: { at: number; list: BarcodeItem[] } | null = null
export const invalidateBarcodeItems = () => { itemsCache = null }
export async function fetchBarcodeItems(force = false): Promise<BarcodeItem[]> {
  if (!force && itemsCache && Date.now() - itemsCache.at < 20_000) return itemsCache.list
  const list = (await api('/admin/pos/barcodes/items')) as BarcodeItem[]
  itemsCache = { at: Date.now(), list }
  return list
}

export const barcodeService = {
  async receiveStockWithBarcode(payload: CreateBarcodeAndReceivePayload): Promise<CreateBarcodeResponse> {
    const variantId = Number(payload.variant_id)
    if (!variantId) throw new Error('Choose a size for this item first')
    const r = await api('/admin/pos/barcodes/receive', {
      method: 'POST',
      body: {
        variantId,
        quantity: Math.max(0, Math.floor(payload.quantity_received || 0)),
        unitCost: payload.unit_cost ? Math.round(payload.unit_cost * 100) : null,
        customBarcode: payload.custom_barcode || null,
        note: payload.note || '',
      },
    })
    invalidateBarcodeItems()
    return {
      success: true, barcode_id: String(r.barcodeId), barcode_value: r.barcodeValue, is_new_barcode: r.isNewBarcode, movement_type: r.movementType,
      quantity_before: r.quantityBefore, quantity_received: r.quantityReceived, quantity_after: r.quantityAfter, product_id: r.productId, variant_id: String(r.variantId),
      product_name: r.productName, variant_name: r.variantName,
    }
  },

  /** Resolve a scanned or typed code to a size: registry, then the barcode on the size, then its SKU. */
  async lookupBarcode(barcodeValue: string): Promise<BarcodeRegistryRecord | null> {
    const code = (barcodeValue ?? '').trim().toUpperCase()
    if (!code) return null
    const r = await api('/admin/pos/barcodes/lookup?code=' + encodeURIComponent(code))
    if (!r) return null
    const now = new Date().toISOString()
    return {
      id: `var-${r.variantId}`, barcode_value: r.barcode || code, entity_type: 'variant', product_id: r.productId, variant_id: String(r.variantId), is_active: true,
      created_by_name: 'System', created_at: now, updated_at: now,
      product: { id: r.productId, name: r.name, price: dollars(r.price), offer_price: dollars(r.price), image_url: r.image || undefined, category: r.category || undefined, stock_quantity: r.stock, stock: r.stock },
      variant: { id: String(r.variantId), variant_name: r.variantName, price: dollars(r.price), stock: r.stock, sku: r.sku },
    }
  },

  async fetchRegistry(params?: { search?: string; limit?: number; offset?: number }): Promise<{ records: BarcodeRegistryRecord[]; total: number }> {
    const q = new URLSearchParams({ search: params?.search || '', limit: String(params?.limit ?? 50), offset: String(params?.offset ?? 0) })
    const r = await api('/admin/pos/barcodes/registry?' + q)
    return {
      total: r.total,
      records: r.records.map((x: any) => ({
        id: String(x.id), barcode_value: x.barcodeValue, entity_type: x.entityType, product_id: x.productId, variant_id: x.variantId ? String(x.variantId) : null, is_active: x.isActive,
        created_by_name: x.createdByName, created_at: x.createdAt, updated_at: x.createdAt, product: { id: x.productId, name: x.productName, price: 0 },
        variant: x.variantId ? { id: String(x.variantId), variant_name: x.variantName, sku: x.sku } : null,
      })),
    }
  },

  async deactivateBarcode(id: string): Promise<void> {
    await api(`/admin/pos/barcodes/${encodeURIComponent(id)}/deactivate`, { method: 'POST', body: {} })
  },
}
