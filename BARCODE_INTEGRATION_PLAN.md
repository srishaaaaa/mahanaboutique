# Barcode integration plan: bring the Mahalashmi barcode system into Mahana, identical

> **Status: built** (answers given: Mahana theme; both size lists; Mahalashmi's printers; custom sizes on the server *and* in the browser; cashiers scan / inventory staff generate and print / only admin or owner deactivate). See the 'Barcodes' section at the end of `PORT_TO_DHANYA_PROMPT.md` for what shipped. Still to verify by hand: real printing on your label printer and an A4 sheet, and camera scanning over HTTPS.

Source of truth: `github.com/srishaaaaa/mahalashmi` (branch `main`, HEAD `bae0be6`, 199 commits). I cloned it read-only into a scratch folder and read every barcode file listed below. Nothing in the Mahalashmi repo was changed and nothing in Mahana has been changed yet; **this document is the plan only.**

---

## 0. What I found, and four things you need to know first

1. **The screenshots and the repo's latest code disagree on the label-size list.** Your Settings screenshot lists sizes such as "50 × 25 mm × 2 (2-Up Roll, Candidate A)", "33 × 22 mm × 3 (3-Up Triple Roll)", "25 × 25 mm × 4 (4-Up Roll, Candidate A)". Those names exist only in an *older* Mahalashmi commit; commit `39eea5f` ("label sheet sizes") replaced them. The repo's latest list is in section 4.2 (13 sizes, including four **A4 label-sheet** layouts). **Decision needed:** I plan to use the latest repo list (it is a superset in function: thermal 1-up, 2-up/3-up rolls and A4 sheets). If you want the screenshot's exact older list instead, say so — it is a data change only.
2. **Different technology.** Mahalashmi is TypeScript + Tailwind + Supabase (calls database functions directly from the browser) + `lucide-react` + a zustand store. Mahana is JavaScript + plain CSS + Express/Postgres, no Tailwind, no zustand. So "exactly the same" means: same screens, same sizes, same behaviour, same print output, **rebuilt on Mahana's stack**, with the Mahalashmi components copied as closely as possible. Section 5 explains how I keep the look pixel-identical.
3. **Colours.** Mahalashmi's barcode screens are black and white (black header, black primary buttons). Mahana's rule is "everywhere our theme". I plan to keep every size, spacing and font identical and drive the *one* accent colour from a variable `--bc-ink` that defaults to Mahana's navy accent (`var(--d-acc)`). Setting `--bc-ink: #0A0A0A` makes it pure black like Mahalashmi. **Decision needed:** navy (my recommendation, matches the rest of the admin) or black (literal copy).
4. **Printing can only be fully verified on real hardware** (thermal label printer, A4 sheets). I can build and test everything else (tests, layout, barcode validity); the bar-width/dot maths is copied exactly from Mahalashmi (section 4.3) because it was tuned on a TVS LP 46 printer.

---

## 1. Everything barcode-related in Mahalashmi (the checklist that must exist in Mahana)

| # | Feature | Mahalashmi source | Size |
|---|---|---|---|
| 1 | **Barcode Generator** modal (black header with Printer/Size summary + gear + ✕; "Enter item details to add for barcode" card: Item name select*, Item code* + **Assign Code**, No. of labels*, Header, Line 1–4; **Live preview** panel with size chip, "Add for barcode"; **Item details (n)** list; footer: Close, **Update Stock** checkbox, **Generate & Print (n)**) | `components/barcode/CreateBarcodeModal.tsx` | 65 KB |
| 2 | **Barcode Settings** drawer (Printer: Label Printer (Thermal) / Regular Printer (A4 Sheet); Size list with radio rows; "+ Create Custom Size"; Additional fields: Sale Price, Company Name, Item Name, Discount / MRP; **Done**) | `BarcodeSettingsDrawer.tsx` | 10 KB |
| 3 | **Create Custom Size** modal (name, labels per row, width mm, height mm, gap mm; saved) | `CreateCustomSizeModal.tsx` | 13 KB |
| 4 | **Label** component (header, barcode, number, item name, price, discount lines) used for preview and print | `BarcodeLabel.tsx` | 4 KB |
| 5 | **Print modal** for one inventory item (reprint labels: count, preview, print) | `BarcodePrintModal.tsx` | 26 KB |
| 6 | **Sheet preview** (print preview of the whole sheet/roll) | `BarcodeSheetPreviewModal.tsx` | 9 KB |
| 7 | **Barcode library**: label sizes, A4 page builder, settings storage, CODE128 SVG, thermal dot-exact barcode HTML, validation | `lib/barcode.ts` | 11 KB |
| 8 | **Barcode service**: receive stock + assign barcode, lookup (registry, then variant barcode, then product barcode), registry list, deactivate | `services/barcodeService.ts` | 7 KB |
| 9 | **Database**: `barcode_registry`, `barcode_custom_sizes`, `inventory_movements` (barcode_id), sequences, `generate_barcode_value()`, `create_barcode_and_receive_stock()` | `supabase/mahalashmi_production.sql` | — |
| 10 | **Scan box in Billing**: "Scan barcode with machine, camera, or type code…" with camera button; beep on success/failure; out-of-stock message; "Added: <name> (+1 qty)" | `components/pos/BarcodeScannerInput.tsx` | 18 KB |
| 11 | **Camera scanning** with `@zxing/browser` (device list, start/stop) | inside `BarcodeScannerInput.tsx` | — |
| 12 | **Hardware scanner listener** (keyboard-wedge scanners): rapid-key burst detection, works even when focus is in another field | `hooks/useHardwareBarcodeScanner.ts` | 4 KB |
| 13 | **Scanned while on another page** dialog: "Barcode Scanned … switch to the Billing Panel and add this item?" | `components/pos/BarcodeRedirectDialog.tsx` | 4 KB |
| 14 | **Quick-add unknown barcode**: scanned code not in the system opens a small modal to create the product on the spot | `components/pos/QuickAddScannedProductModal.tsx` | 9 KB |
| 15 | **Inventory integration**: "Add barcode" button (printer icon, tooltip "Generate & print barcodes for items"), Barcode column ("No Barcode" in italics when empty), print-labels button per row, search by barcode | `components/inventory/InventoryTable.tsx` | — |
| 16 | **Add / Edit product** barcode field with duplicate-barcode pre-check | `AddEditProductView.tsx` (`isBarcodeConflict`) | — |
| 17 | **Stock history** shows barcode-based movements (INITIAL_BARCODE_STOCK, RESTOCK, …) | `StockHistoryDrawer.tsx`, `AdjustStockModal.tsx` | — |
| 18 | Barcode used in billing add-to-cart flow (`processIncomingCode`, `externalScannedCode`, `onNotFound` → quick add) | `pages/Pos.tsx` | — |

Everything in this table gets built; section 7 gives the order.

---

## 2. Data model: Supabase → Mahana (Express + Postgres)

Mahana already has `products`, `product_variants` (with unique `sku`, `stock_quantity`), `inventory_movements (variant_id, quantity_change, reason, reference_id)`, and a key/value `pos_settings` table. Mahana's stock lives on **variants** (a product with no sizes still has one variant), so every barcode attaches to a **variant**.

**Migration `033_barcodes.sql`** (new):
- `product_variants.barcode TEXT` (nullable) + unique index on `upper(barcode)` where not null: the "keep the barcode on the item itself" fallback copy, as in Mahalashmi.
- `barcode_registry(id, barcode_value UNIQUE, product_id, variant_id, is_active, created_by_name, created_at, updated_at)` — same columns; `entity_type` kept (`'variant'` always in Mahana, `'product'` allowed so the shape matches).
- `barcode_custom_sizes(id TEXT PK, name, labels_per_row, width_mm, height_mm, horizontal_gap_mm, is_custom, created_at, updated_at)` — identical to Mahalashmi's table.
- `inventory_movements`: add optional columns `barcode_id`, `quantity_before`, `quantity_after`, `unit_cost`, `note`, `created_by_name` so barcode receipts record exactly what Mahalashmi's do. Existing `reason` gets two new values: `barcode_initial_stock` (= INITIAL_BARCODE_STOCK) and `barcode_restock` (= RESTOCK).
- Sequences `barcode_variant_seq` and `barcode_product_seq` starting at `10000001`; generated values are `PBV` + 8 digits (variants) / `PBP` + 8 digits (products), exactly as `generate_barcode_value`.
- Migrations must be run on the live database (`npm run migrate`, as with 023–032).

---

## 3. Server (Express) — one endpoint per Mahalashmi function

All under `/api/admin/pos/barcodes/…`, role rules: lookup = cashier/inventory/admin/owner; everything that writes = inventory/admin/owner.
| Endpoint | Replaces (Mahalashmi) | Behaviour |
|---|---|---|
| `GET /barcodes/lookup?code=` | `barcodeService.lookupBarcode` | uppercase+trim; 1) active registry row, 2) `product_variants.barcode`, 3) `product_variants.sku` (Mahana-specific fallback, so old SKUs scan too). Returns product + variant + price + stock + image. |
| `POST /barcodes/receive` | RPC `create_barcode_and_receive_stock` | **Transactional port, line for line:** validate product/variant; normalise custom barcode (`UPPER(TRIM)`); if the custom value belongs to another item → error "Barcode X is already assigned to another item"; else reuse the item's active barcode or generate; insert/reactivate registry row; copy barcode onto the variant if empty; lock the variant row, add quantity, write the movement (`INITIAL_BARCODE_STOCK` for a new barcode, `RESTOCK` otherwise, with before/after/unit cost/note/who). Returns the same JSON shape (`barcode_value`, `is_new_barcode`, `quantity_before/received/after`, names). |
| `POST /barcodes/generate` | `generate_barcode_value` | next value from the sequence (used by **Assign Code**). |
| `GET /barcodes/registry?search=&limit=&offset=` | `fetchRegistry` | newest first, with product/variant, `ilike` search. |
| `POST /barcodes/:id/deactivate` | `deactivateBarcode` | sets `is_active=false`. |
| `GET/PUT/DELETE /barcodes/sizes` | `barcode_custom_sizes` | custom label sizes shared by every device (Mahalashmi kept them in `localStorage` only; I will keep the same localStorage keys as a cache and add the server copy). |
| `GET /barcodes/items?q=` | `InventoryTable` "combined product options" | flat list of every variant with product name, size, colour, sku, barcode, price, cost, stock, used by the Generator's **Item name** select. |
Tests (new `test/barcodes.test.js`): generate + receive (new vs reuse), duplicate barcode refusal, lookup fallbacks (registry, variant barcode, sku), case-insensitive lookup, deactivate, custom size CRUD, stock/movement rows correct, permissions.

---

## 4. Client library, copied exactly

### 4.1 Settings (defaults and storage)
```
printerType: 'label'            // 'label' (Thermal) | 'regular' (A4 sheet)
selectedSizeId: '2_38x25'       // 38 × 25 mm (Tag / Jewelry)
showSalePrice: true, showCompanyName: true, showItemName: true, showDiscount: false
```
Stored in `localStorage` (Mahalashmi keys `mahalashmi_stores_barcode_settings`, `mahalashmi_stores_custom_label_sizes` → Mahana: `mahana_barcode_settings`, `mahana_custom_label_sizes`). Company name printed on labels = the store name from Mahana's store settings.

### 4.2 Label sizes (latest repo list, in this order)
| id | Name | per row | W×H mm | gap |
|---|---|---|---|---|
| `1_35x22` | 35 × 22 mm (Compact Tag) | 1 | 35×22 | 0 |
| `2_38x25` | 38 × 25 mm (Tag / Jewelry) **default** | 1 | 38×25 | 0 |
| `1_50x25` | 50 × 25 mm (Standard Compact) | 1 | 50×25 | 0 |
| `2_50x25` | 50 × 38 mm (Retail Standard) | 1 | 50×38 | 0 |
| `1_60x40` | 60 × 40 mm (Shipping / Product) | 1 | 60×40 | 0 |
| `1_100x50` | 100 × 50 mm (Large Carton / Box) | 1 | 100×50 | 0 |
| `2up_35x22` | 35 × 22 mm × 2-Up (Roll, side-by-side) | 2 | 35×22 | 0 |
| `2up_50x25` | 50 × 25 mm × 2-Up (Roll, side-by-side) | 2 | 50×25 | 2 |
| `3up_35x22` | 35 × 22 mm × 3-Up (Roll, side-by-side) | 3 | 35×22 | 0 |
| `a4_4x48x25` | A4 Sheet — 4 columns × 48 × 25 mm | 4 | 48×25 | 2.5 |
| `a4_4x48x30` | A4 Sheet — 4 columns × 48 × 30 mm | 4 | 48×30 | 2.5 |
| `a4_3x63x38` | A4 Sheet — 3 columns × 63 × 38 mm | 3 | 63×38 | 2.5 |
| `a4_2x99x34` | A4 Sheet — 2 columns × 99 × 34 mm (Address label) | 2 | 99×34 | 2.5 |
Plus any custom sizes. (Section 0, point 1: if you want the older "Candidate A/B" list from your screenshot, it replaces this table.)

### 4.3 Printing rules (copied verbatim from `lib/barcode.ts`)
- Barcode format **CODE128** via `jsbarcode`; value normalised `trim().toUpperCase()`; valid values `^[A-Z0-9_-]{4,32}$`.
- **Thermal labels** (`labelBarcodeHtml`): bars drawn at an exact size in mm where every bar is a whole number of 203-dpi printer dots (`1 dot = 25.4/203 mm`), 1–3 dots per module chosen to fit the label width minus a 1.5 mm quiet zone each side; `shape-rendering: crispEdges`; the number is printed as text under the bars (Arial 700, 6.5 pt, letter-spacing .4 px), not inside the SVG.
- **A4 sheets** (`buildA4SheetPages`): rows = `floor((297 − 10) / heightMm)`, grid centred on the page (side margin = `(210 − cols·width − (cols−1)·gap)/2`, top margin = `(297 − rows·height)/2`), one `div` per page, `break-after: page`.
- Hardware scanner: keys arriving **< 45 ms apart** form a burst; Enter with a burst of **≥ 4 characters** and **< 150 ms since the last key** is a scan; the injected text is removed from a focused input; on the Billing page it adds the item, elsewhere it opens the redirect dialog.
- Scan feedback: success beep vs failure beep; out-of-stock text `"<name> (<variant>)" is out of stock (Stock: 0)`; success line `Added: <name> (+1 qty)`.

---

## 5. UI: keeping it visually identical on Mahana's stack

Mahalashmi's screens are built with Tailwind utility classes and `lucide-react` icons. To avoid re-drawing 180 KB of UI by eye:
1. Copy the barcode components to `client/src/barcode/*.jsx` (TypeScript types removed, nothing else changed — same JSX, same class names).
2. Add **Tailwind only for these components**: a `tailwind.barcode.config.js` with `content` limited to `client/src/barcode/**`, `important: '.bc'` (every rule prefixed so nothing leaks into the rest of Mahana), `corePlugins: { preflight: false }` (so Mahana's pages are not reset), and Mahalashmi's `theme.extend` (colours, `rounded-card/btn/input`, shadows, animations) copied verbatim. It compiles to one CSS file imported only by the lazy admin chunks that use barcodes. Every barcode modal root gets `className="bc …"`.
3. Fonts: the screenshots render in **Poppins** (Mahana's admin font), so the barcode modals inherit Mahana's Poppins; sizes come from the Tailwind classes, so they match the screenshots (e.g. section titles 13 px/800 uppercase, field labels 11 px/800 uppercase, inputs 14 px, modal header 20 px).
4. Dependencies added: `jsbarcode`, `lucide-react` (only the icons used), `@zxing/browser` (**lazy-loaded only when the camera button is pressed**, so the billing page stays light).
5. `--bc-ink` (section 0, point 3) replaces the hard-coded `#0A0A0A` black in headers/primary buttons.
6. Modals mount through a portal like Mahalashmi's `ModalPortal`, above Mahana's existing modals (z-index 500+).

### Screen-by-screen placement (from your screenshots)
- **Billing → Order items card:** the title row (🧾 "Order Items" left; right: CLEAR ORDER, ADD TO CATALOG, + ADD CUSTOM ITEM) and **directly under it the scan box**: rounded 16 px, 2 px grey border, scan icon left, placeholder "Scan barcode with machine, camera, or type code…", **camera button** right (a 40 px rounded square). In Mahana these sit with Mahana's existing buttons (Clear order, Catalog, Add service, Add custom item) — the scan box goes on a new row below them.
- **Inventory:** in Mahana's filter card add the **Add barcode** button (printer icon, text "ADD BARCODE", tooltip "Generate & print barcodes for items") at the far right of the chips row; add a **Barcode** line to every card / list row ("No Barcode" in italic grey if none) and a small print-labels button (disabled and invisible-but-space-reserving when no barcode); search matches barcodes.
- **Barcode Generator modal:** 1,300 px wide, black header (title "Barcode Generator ⓘ"; right side "Printer **Label Printer** | Size **38 × 25 mm (Tag / Jewelry)**", gear button, ✕), body in two cards (details form left ~2/3, live preview right ~1/3), Item details list below with an empty state ("Added items for Barcode generation will appear here. Select an item above, set quantity of labels, and click 'Add for Barcode'."), sticky footer.
- **Barcode Settings drawer:** slides in from the right, 435 px wide, black header "Barcode Settings" + ✕, sections PRINTER / SIZE / ADDITIONAL FIELDS with "Select any 1 option" hints, grouped radio list on a light card, black **✓ DONE** button pinned at the bottom.

---

## 6. Acceptance checklist (every item must pass before it is called done)
1. Add barcode → pick items → set labels → Assign code → **Add for barcode** → **Generate & Print (n)**; with **Update Stock** ticked the stock and a `INITIAL_BARCODE_STOCK` / `RESTOCK` movement are written once.
2. Settings drawer: printer type, every size in 4.2 selectable, custom size created/persisted across reload and devices, the four "additional fields" toggle what the label shows; the preview and the Printer/Size summary in the header update immediately.
3. A printed 38 × 25 mm label: bars are whole-dot widths, number printed below, quiet zone ≥ 1.5 mm, scans reliably with a USB scanner and a phone camera.
4. A4 sheet sizes print as whole A4 pages, grid centred, correct count per page.
5. Billing: a USB scanner scan anywhere on the Billing page adds the item (+1), repeated scans increment; unknown code opens Quick-add; out-of-stock shows the message; camera scan works over HTTPS.
6. Scanning while on another admin page shows the "Barcode Scanned" dialog; Confirm switches to Billing and adds the item.
7. Inventory shows the barcode (or "No Barcode"), reprint works, search by barcode works, Edit product refuses a barcode that belongs to another item.
8. All server tests (existing 80 + new barcode tests) pass; client builds; no Tailwind rule leaks into non-barcode pages (visual check of Billing, Inventory, Orders).

---

## 7. Build order (each step shippable and tested on its own)
1. **Server first:** migration 033, endpoints, tests (section 3).
2. **Library:** `barcode.js` (sizes, settings, CODE128, thermal/A4 HTML), Tailwind-scoped build setup, `lucide-react`/`jsbarcode` added.
3. **Settings drawer + Create Custom Size + Label component** (smallest, visually verifiable on their own).
4. **Barcode Generator modal + Print modal + Sheet preview**, wired to the Inventory "Add barcode" / per-row print buttons.
5. **Billing:** scan box, hardware listener, beep, redirect dialog, quick-add modal, camera (lazy zxing).
6. **Inventory touches:** barcode column/search, Edit product barcode field + conflict check, stock-history labels.
7. Update the Dhanya/Mahana porting prompts and run the full acceptance checklist; real-printer test on your label printer and an A4 sheet.

---

## 8. Open questions (answer these and I start with step 1)
1. **Colour:** theme navy (recommended) or literal black like Mahalashmi?
2. **Size list:** latest repo list (section 4.2, recommended) or the older list from your screenshot?
3. **Which printers do you use?** (e.g. TVS LP 46 thermal, A4 sheets) — it decides which sizes I test first and the default size.
4. **Custom sizes shared across devices** via the server (my recommendation) or per-browser only like Mahalashmi?
5. Should **cashiers** be able to scan (yes in my plan) and **inventory staff** generate/print barcodes (yes), while only admin/owner can deactivate a barcode?
