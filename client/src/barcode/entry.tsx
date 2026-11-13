import './barcode.css'
import { useEffect, useMemo, useState } from 'react'
import { CreateBarcodeModal } from './components/barcode/CreateBarcodeModal'
import { BarcodePrintModal } from './components/barcode/BarcodePrintModal'
import { BarcodeScannerInput, type ScannedItemPayload } from './components/pos/BarcodeScannerInput'
import { BarcodeRedirectDialog } from './components/pos/BarcodeRedirectDialog'
import { QuickAddScannedProductModal } from './components/pos/QuickAddScannedProductModal'
import { useHardwareBarcodeScanner } from './hooks/useHardwareBarcodeScanner'
import { useNavigationStore } from './store/navigationStore'
import { setBrand } from './lib/brand'
import { setProductRefresh } from './store/store'
import { fetchBarcodeItems, type BarcodeItem } from './services/barcodeService'
import { api } from '../lib/api'

// Entry point for the barcode tools. Mahana's admin pages import this lazily, so none of it (jsbarcode, the camera decoder, Tailwind CSS)
// loads until a barcode feature is used.
export { setBrand, setProductRefresh, useHardwareBarcodeScanner, useNavigationStore, BarcodeRedirectDialog }
export type { ScannedItemPayload }

/** The "Add barcode" workspace: pick items, set label counts, assign codes, update stock, then print. */
export function BarcodeGenerator({ onClose, onSuccess, preselectedVariantId = null }: { onClose: () => void; onSuccess?: () => void; preselectedVariantId?: number | null }) {
  const [items, setItems] = useState<BarcodeItem[] | null>(null)
  useEffect(() => { void fetchBarcodeItems(true).then(setItems).catch(() => setItems([])) }, [])
  const products = useMemo(() => {
    const by = new Map<number, { id: number; name: string; price: number; cost_price: number; stock_quantity: number; category?: string; has_variants: boolean }>()
    for (const i of items || []) {
      const cur = by.get(i.productId)
      if (!cur) by.set(i.productId, { id: i.productId, name: i.name, price: i.price / 100, cost_price: i.cost / 100, stock_quantity: i.stock, category: i.category || undefined, has_variants: true })
      else { cur.stock_quantity += i.stock; cur.price = Math.min(cur.price, i.price / 100) }
    }
    return [...by.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])
  const pre = items?.find((i) => i.variantId === preselectedVariantId)
  if (!items) return null
  return (
    <CreateBarcodeModal isOpen onClose={onClose} products={products} preselectedProductId={pre?.productId} preselectedVariantId={pre ? String(pre.variantId) : null} onSuccess={onSuccess} />
  )
}

/** Reprint labels for one size that already has a barcode. `price` is in cents. */
export function PrintLabels({ item, onClose }: { item: { name: string; variantName?: string; barcode: string; price: number; stock: number }; onClose: () => void }) {
  return (
    <BarcodePrintModal isOpen onClose={onClose} productName={item.name} variantName={item.variantName} barcodeValue={item.barcode} price={item.price / 100} defaultQuantity={Math.max(1, item.stock)} />
  )
}

/** Raw server lookup (cents): used by Billing to add the scanned size to the order. */
export const scanLookup = (code: string) => api('/admin/pos/barcodes/lookup?code=' + encodeURIComponent(code))

/**
 * The scan box (machine, camera or typed code), mounted inside Billing's Order items card.
 * Hardware-scanner reads that arrive while Billing is open are handed to `onCode` (the listener in BarcodeLayer stores them for it).
 */
export function ScanBox({ onCode, ...props }: { onItemScanned: (item: ScannedItemPayload) => void; onNotFound?: (code: string) => void; clearSignal?: number; disabled?: boolean; onCode?: (code: string) => void }) {
  const external = useNavigationStore((s) => s.externalScannedCode)
  const clear = useNavigationStore((s) => s.setExternalScannedCode)
  useEffect(() => { if (external) { clear(null); onCode?.(external) } }, [external, clear, onCode])
  return <div className="bc"><BarcodeScannerInput {...props} /></div>
}

/** Always mounted in the admin: the keyboard-wedge scanner listener, plus the "scanned on another page" dialog. */
export function BarcodeLayer({ onBilling, goBilling, shopName }: { onBilling: boolean; goBilling: () => void; shopName?: string }) {
  useEffect(() => { setBrand(shopName) }, [shopName])
  useHardwareBarcodeScanner({ isBillingActive: onBilling })
  return <BarcodeRedirectDialog onNavigateToBilling={() => goBilling()} />
}

/** "This barcode isn't in the catalogue" modal: create the product on the spot. */
export function QuickAdd({ barcode, categories, onClose, onCreated }: { barcode: string; categories: string[]; onClose: () => void; onCreated: (item: ScannedItemPayload) => void }) {
  return <QuickAddScannedProductModal barcode={barcode} categories={categories} onClose={onClose} onCreated={onCreated} />
}
