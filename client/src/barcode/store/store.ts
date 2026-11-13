// Tiny stand-in for Mahalashmi's product store: the Generator asks it to refresh after stock changes; Mahana's pages register their own refresh.
let refresh: (() => void | Promise<void>) | null = null
export const setProductRefresh = (fn: (() => void | Promise<void>) | null) => { refresh = fn }
export const useProductStore = <T,>(selector: (s: { fetchProducts: (force?: boolean) => Promise<void> }) => T): T =>
  selector({ fetchProducts: async () => { await refresh?.() } })
export const useSettingsStore = { getState: () => ({ settings: { lowStockThreshold: 3 } }) }
