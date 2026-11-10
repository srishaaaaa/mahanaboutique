# Prompt: port the Mahana changes into the Dhanya codebase

You are an AI coding agent working in the **Dhanya** codebase (React + Vite client in `client/`, Express + PGlite/Postgres server in `server/`, migrations in `server/db/migrations/`, tests in `server/test/` run with `node --test`). The same product was customised for **Mahana Boutique & Tailors** (a Singapore boutique, currency **S$**, GST **9%**, phone numbers **+65**, payment rails **PayNow / card / cash**). Re-create every change below so Dhanya ends up with the **same screens, same wording, same behaviour and the same look**. Where a value is given (colour, size, label, order of items), use it exactly. Where Dhanya already has the feature, upgrade it to match rather than duplicating it.

Work area by area, run the server tests after every server change, and build the client (`npm run build --prefix client`) before you finish. Do not skip the database migrations: the live database must receive them with `npm run migrate` in `server/`, or pages that use the new columns will show "Server error".

If something here is ambiguous, keep Dhanya's existing behaviour and note it; do not invent features that are not listed. Section 14 lists what was **not** done, so you do not build it by accident.

---

## 0. Global conventions

- **Money** is stored as integer minor units (cents) and shown with the `inr()` helper, which prints `S$` amounts. Keep that helper; never hard-code a currency symbol in new code.
- **Payment method labels, everywhere, always in this order:** `Cash`, `QR / PayNow`, `Card`, `Split`. Internal keys are `cash`, `upi`, `card`, `split`. In upper-case buttons: `CASH`, `QR / PAYNOW`, `CARD`, `SPLIT`.
- **Theme colours.**
  - Admin theme (navy): `--d-acc` = `var(--pos-accent, #1c284f)`; secondary navy `#2d3e76`; dark ink `#1a123c` / `#141c38`.
  - Public store accent, **rose gold** (replaces the old red and gold everywhere in `client/src` CSS, JSX and 3D scene code): `#e33944 → #c9897a`, `#bf1722 → #a65f4e`, `#9e1019 → #8f4f40`, `#edc677 → #efc3b3`, `#e8c27a → #e0a899`, `#d4a24f → #c58a78`, `#f6e2ae → #f7d9cd`, and the matching `rgba()` values (`227,57,68 → 201,137,122`, `191,23,34 → 166,95,78`, `237,198,119 → 239,195,179`). The navy stays as it is.
  - In the admin, every black button, chip or tab background (`#111`, `#141414`, `#0b0b0e`, `var(--d-ink)` used as a background) becomes `var(--d-acc, #1c284f)`. Pink (`#f5009b`) in the neck picker becomes the navy theme.
- **Fonts.**
  - Public store: script `Allura` (`--script`), headings serif `Cormorant Garamond` (`--serif`). Add both, plus `Poppins` (400–800), to the Google Fonts link in `client/index.html`.
  - Admin: **Poppins** on `.dpos` and `.dpos-modal` and all their text elements (monospace stays for codes and invoice numbers).
  - Invoices, return invoices and thermal bills: a fixed, print-safe stack so screen and paper match: Arial / Helvetica for A4/A5, Courier New for thermal (`!important`, `font-synthesis: none`).
- **Logo.** Make a transparent PNG of the supplied rose-gold logo (key out the black background: alpha from brightness, crop tight, about 1200 px wide) and save it as `client/public/logo.png`. The logo is the only logo: header, mobile menu, admin sidebar top, invoices, bills, job sheets (the server's `shopInfo()` returns `logo: '/logo.png'`). The favicon, `icon-192/512`, `apple-touch-icon` use the square supplied logo on black; `theme-color` is `#000000`. The old "upload a logo" setting no longer changes anything.
- Add an **ErrorBoundary** (`client/src/components/ErrorBoundary.jsx`) around the app in `main.jsx`: on a crash show a white card with a heading, the error stack (first 800 chars) and a Reload button. If the message matches a failed dynamic import ("Failed to fetch dynamically imported module", "Loading chunk"), show "This page is out of date" with Reload instead.

---

## 1. Public store (customer-facing)

### 1.1 Home page and navigation
- **Remove collections from the store**: the "Collection" link in the desktop nav and the mobile menu, the Collections dropdown, the footer "Collections" link, the home "Choose your world" collections section (`CollectionsFlow`), collection results in search, collection chips in the search overlay, the About page's "VIEW COLLECTIONS" link and collection counts. `/collections` and `/collections/*` redirect to `/shop`. Hero chips that pointed at collections now link to `/search?q=festive` and `/search?q=bridal`. The About band heading "OUR COLLECTIONS" becomes "OUR CATEGORIES".
- **Keep** the "Trending Collections" section (`FeaturedCollections`, driven by Admin → Trending picks, else featured products). Home order: hero → ticker → Trending → editorial → categories → details → service highlights → story → reviews → Instagram strip → map → enquiry.
- The **Categories** dropdown lists only the categories (no "All pieces", no "New arrivals").
- **Featured categories** cards become **vertical rectangles**: `.nk-card { border-radius: 22px }`, `.nk-arch { border-radius: 14px; aspect-ratio: 3/4 }` (no arch/oval).
- **Reels & photo gallery (home Instagram strip)**: render only items that were added. No placeholder frames. Arrows show only with more than one reel. If there are no reels, hide the reels block; same for photos; if there is nothing at all, return `null` for the whole section. In Admin → Reels & Gallery show the added items plus **one** empty "add" box (not six).

### 1.2 Shop page
- No filters. Delete the filter drawer, Filter button and filter chips. Add a row of **category tabs** above the toolbar (`All` + each category with products; hidden on `/search`). A tab sets the `category` URL filter (single category). Keep sort and grid-size buttons. Style: pill buttons, white with a rose border (`#c9897a` at 50%), active tab filled `#2d1a3a` with white text, uppercase 12px, `letter-spacing .14em`.
- Menu, footer, home category cards and breadcrumbs all land on `/shop?category=<slug>` and the matching tab is active.

### 1.3 Product page
- Price shows `S$x` plus small text `incl. 9% GST` (or `GST-free` when the rate is 0). Never "+ GST".
- **Delivery & returns box** above the details, light beige card (`#f3eeea`, radius 16, 1px rose border), heading `DELIVERY & RETURNS` (12px, 800, `letter-spacing .18em`) and bullets:
  1. `Delivery across Singapore: S$<flat>, free on bag totals above S$<threshold>`
  2. `Price includes 9% GST, itemised at checkout and on your bill` (or `This piece carries no GST`)
  3. `Made-to-measure and altered garments are non-returnable`
  4. `Questions about fit or fabric? Message us on WhatsApp before you order`
- **Product details** accordion (open by default) replaces "Description"; text supports `**bold**` (render as `<strong>`, never show asterisks); paragraphs split on blank lines; fallback text when empty.
- **More from <category>** below the product: only pieces of the same category (server `related`: same `category_id`, active, not itself, featured first then newest, **limit 8**, none if the product has no category).
- Quick view pop-up: **solid dark panel `#1a123c`, no glass blur, no 3D tilt** (animation is opacity + 24px slide, 0.28 s). Root cause fixed: the dark scrim had `z-index: 1` while the pop-up had no z-index, so the scrim covered it and swallowed clicks. Now `.overlay-root > .scrim { z-index: 1; backdrop-filter: none; background: rgba(8,6,20,.72) }` and `.quick.glass { z-index: 2; backdrop-filter: none; background: #1a123c }`.

### 1.4 GST-inclusive pricing (online shop)
- Shop prices **include** GST. Server `cart.js` exports `gstSplit(lines)`: per line `tax = round(price × qty × rate / (100 + rate))`, grouped by rate → `{ byRate: [{rate, gross, base, tax}], included }`.
- `cartView()` adds `taxRate` to items and returns `gst` (the split), `shipping: {amount, freeOver}` and `total = subtotal + shipping.amount` (shipping carries no GST).
- `createPendingOrder()`: `subtotal = Σ price × qty`, `tax_amount = gstSplit(lines).included`, `total_amount = subtotal + shipping`. The tax is no longer added on top. Update any test that expected `subtotal + tax + shipping`.
- `BagTotals` component (cart drawer and checkout): rows `Subtotal (incl. GST)`, `Shipping` (`Free` when 0), a bold `Total`, then a tinted box **"GST included in your total"** with one line per rate: `GST 9%  on S$<base>   S$<tax>` and `Total GST` when more than one rate.

### 1.5 Bag drawer
- Header "Your Bag (n)" with a ✕. At the top a **free-shipping bar**: text `Add S$x more for free shipping.` / `You have free shipping on this order.` and a 6px rose-gold progress bar (`linear-gradient(90deg,#c9897a,#efc3b3)`). Items as before (rounded 14px thumbnails, pill quantity box). Footer: `BagTotals`, a navy gradient `CHECKOUT · S$total` pill button (`linear-gradient(135deg,#3a2354,#1a123c)`, hover rose), and the small line `Secure payment · Prices include GST`.

### 1.6 Checkout page
- Two columns: **bag on the left** (white card, 22px radius, rose border) with the item list, `BagTotals` and a trust line (`✓ Prices include GST`, `✓ Secure payment by Stripe`, `✓ Totals calculated on our server`); **delivery form on the right** (sticky card). Header row: "Checkout" and a three-step pill row `Bag` (done, rose tint) · `Details` (active, `#2d1a3a`) · `Payment`.
- The pay button reads `PAY S$<total>`. Submitting the form opens a **Secure checkout** modal (cream `#f6f1ec`, radius 22): title `SECURE CHECKOUT`, text "You will be securely redirected to Stripe to complete your payment.", a white method card (card icon, **PayNow, Cards, GrabPay, Apple Pay & Google Pay**, "100% secure payments powered by Stripe"), and a black full-width pill `CONFIRM ORDER S$<total>`; ✕ and backdrop close it. The payment request is only sent when Confirm is pressed.

### 1.7 Sign in / register
- Split layout (max 980px): left plum panel (`radial-gradient` `#3a2354 → #1a123c → #0f0a26`) with the logo, a script tagline (`Welcome back` / `Join the Mahana family`) and three ticks (Track your orders and bills · Save addresses for one-tap checkout · Keep a wishlist of pieces you love); right white card with the form. Buttons: plum gradient pill, rose gradient on hover; inputs `#fbf8f6` with a rose focus ring. Stacks on mobile (the ticks hide).

### 1.8 Profile dashboard (`/account`)
- Hero card (plum gradient): avatar with the initial (rose-gold gradient circle), `Hello, <first name>`, email and "Member since", buttons `STAFF DASHBOARD` (staff only) and `WISHLIST (n)`.
- Four stat tiles: Orders, Total spent (paid orders), Saved addresses, Wishlist.
- Left side menu (Profile, Addresses, Orders, Security, Sign out) with icons; active item filled `#2d1a3a`. Right panel with the section.
- Orders as cards: order number, "Placed <date>", status and payment **pills** (green paid/delivered, blue shipped/processing, amber pending, red cancelled/failed/refunded), total `incl. GST`. Phone placeholder `+65 9123 4567`.

---

## 2. Database migrations to add (in this order, after the existing ones)

1. `023_stitching_no_trials.sql` — `UPDATE stitch_orders SET status='stitching' WHERE status IN ('trial_scheduled','trial_completed');` (only if Dhanya has the stitching module with trials).
2. `024_coupon_audience.sql` — `ALTER TABLE pos_coupons ADD COLUMN sent_only BOOLEAN NOT NULL DEFAULT false;` and `CREATE TABLE pos_coupon_sends (id identity pk, coupon_id int references pos_coupons(id) on delete cascade, phone text, name text default '', sent_at timestamptz default now(), unique(coupon_id, phone));`
3. `025_low_stock_alert.sql` — `ALTER TABLE products ADD COLUMN low_stock_alert INT NOT NULL DEFAULT 3 CHECK (low_stock_alert >= 0);`
4. `026_returns.sql` — tables `pos_returns` (id, `return_no` unique, `sale_id` → pos_sales, reason, `refund_mode` in cash/upi/card, subtotal, discount, tax, total, `share_token` unique, created_by, created_at) and `pos_return_items` (id, return_id cascade, `sale_item_id` → pos_sale_items, quantity > 0, line_total, discount, tax), with indexes on `sale_id` and `sale_item_id`.
5. `027_tailoring_status.sql` — `ALTER TABLE pos_sales ADD COLUMN tailoring_status TEXT NOT NULL DEFAULT 'pending' CHECK (tailoring_status IN ('pending','completed'));`

Add a test file per feature and list them in `server/package.json`'s `test` script: `coupons.test.js`, `returns.test.js`, `measurements.test.js`. Run the suite with `node --test --test-concurrency=1` (parallel runs of the in-memory database are flaky).

---

## 3. Admin shell (applies to every admin page)

- **Size (current, supersedes any earlier 65% note):** the admin renders at full scale (`--z: 1`) with Poppins, max width 1760px, base font 14.5px, using the exact type sizes of the reference admin (user's screens render about 1.2x CSS px, so do NOT add a zoom or shrink). Desktop grid (262px sidebar + content) only at `min-width: 900px`; below 899px the sidebar becomes a static horizizontal-scroll row, the footer is static and `.an-head` is block.
- **Compact tiles:** `.dpos-k4` gap 10px, columns `repeat(auto-fit, minmax(190px,1fr))`; `.dpos-card2` padding 12×15, radius 16, value 22px (text values 16px), title 11px, icon 28px; cost cards padding 14×18, value 24px; formula bar padding 8×14.
- **Typeface/spacing rhythm (Poppins):** sidebar padding 16, nav items `padding 15×16`, font 16px/600, gap 14; main gap 24; cards padding 22×24, radius 22; tables 15px text, header 11px/700/`.14em`, cell padding 18×20 (header 16×20); tabs 14px/700 with 28px gap; inputs 15px; buttons 14px/600, padding 12×20.
- **Sidebar order:**
  - Retail billing: Billing, POS Analytics (manager), Advance Orders, Order History, **Measurements**, Inventory (manager), Customers, Coupons (manager), Date of Birth (manager), Expenses (manager).
  - Online store: Online orders, Reviews, Categories, Trending, Site text, Storefront images, Reels & Gallery, Enquiries, Users, Sample data (manager).
  - Last group `Settings`: **POS Settings** and **Store Settings** (manager) — settings always sit at the very bottom.
  - The separate "Stitching Studio" group no longer exists (section 8).
- **Brand header:** the logo image (max 190px wide) with a small `ADMIN`/`CASHIER` tag under it.
- **Footer on every admin page**, pinned to the bottom of the screen (`position: sticky; bottom: 0; margin-top: auto` inside a flex-column main with `min-height: calc(100vh/.65 - 48px)`), background `#f1efea`, top border, 12.5px Poppins 600: left `© <year> ALL RIGHTS RESERVED. MAHANA BOUTIQUE & TAILORS.` · centre `POWERED BY **CENEXA SYSTEMS** ©<year>` · right italic bold `• Boutique & Tailoring`. (Use Dhanya's own shop name for the left text if it differs.)
- Add the reusable **`ExportCsv`** component (`components/ExportCsv.jsx`): a button `Export Excel` (download icon, `dpos-btn outline`, disabled when no rows) that calls the existing `downloadCsv(name-YYYY-MM-DD.csv, header, rows)` (UTF-8 with BOM). Put it on: Order History, Advance Orders, Customers, Expenses (plus a visible `⚙ Manage categories` button beside it), POS Analytics → Product Sales Leaderboard, Online orders, Users, Enquiries, Measurements, Stock movements, Birthdays, Inventory snapshot; Coupons use a server `GET /api/admin/pos/coupons/export` CSV.

---

## 4. Billing panel (`/admin/billing`)

Layout: left column cards **Customer details** (name, mobile/WhatsApp, bill date, date of birth, address) and **Order items**; right column **Current order** (source, customer, phone, date, items) with coupon, manual discount, note, subtotal, delivery, invoice type, payment and the action buttons.

- **Order items header buttons:** `Clear order`, **`☰ Catalog`** (primary), `✂ Add service`, `+ Add custom item`. The old "Find a product" search/category card is removed; products are chosen in the Catalog window.
- **Catalog picker** (`components/CatalogPicker.jsx`), a modal (max 980px, radius 26, cream `#fbfbf4`): title `Add products to the bill — pick one or more`; a pill search box (type a name/SKU/size, or scan a barcode and press Enter to add an exact SKU); category chips (`All` + categories, active chip navy); a **2-column grid** of rows — 60px rounded photo, name, `S$price · size · colour · N in stock`, and a `+ Add` button that becomes a navy `− n +` stepper (capped at stock; out-of-stock rows dimmed). Footer `N items · S$total` with `Cancel` and **`OK`** (disabled until something is picked). **OK adds every picked piece to the bill in one go** (quantities add to lines already there) and shows the toast `N items added to the bill`. Data from `GET /api/admin/pos/catalog?q=&limit=300`.
- **Added-to-bill indicator:** a toast `<name> added to the bill`, the row pulses green for 1.6 s (`@keyframes dposFlash`), and a green count badge beside "Current order" pops. Respect `prefers-reduced-motion`.
- **GST split-up** under the GST row when "GST invoice" is chosen: a dashed cream box with `TAXABLE VALUE`, then for each rate `GST 9% on S$base — S$tax`, indented `CGST 4.5%` and `SGST 4.5%` (half each; an odd cent goes to SGST), and `TOTAL GST` when more than one rate. Per-line GST select is 130px wide so "9% GST" is not cut off.
- **Action buttons:** green **`COMPLETE SALE & WHATSAPP`**, then a two-column row **`PRINT`** and **`SAVE ONLY`**, then `SAVE AS ADVANCE ORDER`. WhatsApp saves the bill and opens `https://wa.me/<number>?text=…` with the invoice link; Print saves and opens the invoice with `?print=1`. The new tab is opened synchronously inside the click, then pointed at the URL (so popup blockers allow it); if saving fails the tab closes and the error shows.
- **Payment selector** (same component everywhere, `PayPicker`): `CASH · QR / PAYNOW · CARD · SPLIT`. Cash shows "Amount Received" and change; Split lets you pick 2 or 3 methods and enter each amount, with "Total received" and "Change to return"; QR/Card show an optional `Transaction ID` / `Slip / approval no.`. The footnote says "QR / PayNow and card are confirmed by the cashier at the counter; no payment gateway is attached."

---

## 5. Bills and invoices (A4, A5 and thermal)

Shared row builder `client/src/lib/billSummary.js` (used by invoices, Order History, Advance Orders). **Row order on every bill:**
1. `Products` and `Stitching charges` (only when both exist; stitching lines are those with measurements) → `Subtotal` (note `EXCL. GST` on GST bills).
2. Either `Manual discount (x%)` **or** `Coupon discount (CODE)` (a coupon replaces the manual discount).
3. `Delivery fee`.
4. GST bills: `TAXABLE VALUE`; per rate `GST 9%  on <base>`; indented `CGST 4.5%` and `SGST 4.5%` with amounts; `Total GST` when more than one rate.
5. `TOTAL`.
6. Payment block:
   - single mode: `Paid by <mode>` (+ `Cash received` / `Change returned` for cash), `Balance Due 0.00`;
   - **split:** `Paid by Split`, then **all three methods always in the order Cash, QR / PayNow, Card with their amounts (0.00 when unused)**, `Total Received`, `Balance Due 0.00`;
   - advance order still open: `Advance Paid`, the three method lines, **`Balance Due`**;
   - bill made from an advance: `Deposit Paid` + three method lines, `Final Balance Paid` + three method lines, `Total Received`, `Balance Due 0.00`;
   - voided: `VOID — bill cancelled, nothing collected`.
7. Returns against the bill: `Less: returned (RET-…)` per return and `NET AFTER RETURNS`.

Rendering:
- A4/A5 sheet shows the items table (a red `returned n` note under a line's quantity when part of it came back), a dashed rose "RETURNS AGAINST THIS INVOICE" box listing each return with its items and amount, amount in words, terms/notes, totals column, signature line. Thermal shows the same rows in a 58/80 mm monospace receipt (tax and method rows indented, returned lines noted, a `RETURNS` block).
- **Print sizing:** A4 `@page { size: A4; margin: 10mm }`, A5 `A5; margin: 8mm`; the document has no padding/border in print and fills the width; head/foot/bill rows are forced to row layout (the mobile column layout previously triggered on A5 and broke it — scope the mobile rule to `@media screen`). Thermal: `@page { size: <58|80>mm <H>mm; margin: 0 }` where **H = ceil(receipt height px × 25.4 / 96) + 6 mm**, recomputed on `beforeprint`, with the receipt keeping its on-screen width (80mm / 58mm), padding (3mm/2.5mm) and type size. Colours print exactly (`print-color-adjust: exact`).

### 5.1 Return invoices (credit notes)
- Server `lib/returns.js`: `createReturn(db, user, invoice, {items:[{itemId, qty}], reason, refundMode})`. Rules: only a completed bill; each line can be returned up to `quantity − already returned`; refund per line = `line_total − discount_alloc + tax_amount` for the returned quantity, **the last unit takes the remainder so parts add up exactly**; delivery fee is not refunded; stock goes back (`pos_return` inventory movement); number `RET-<year>-<5 chars>`; share token; audit. `getReturn()` returns the return with `returned` lines (return qty/amount) and `kept` lines (still with the customer, after all returns) and `otherReturns`.
- A bill with returns **cannot be voided** (409). `getSale()` adds `returnedQty` per line and `returns[]`.
- Routes: `POST /api/admin/pos/sales/:invoice/returns` (owner/admin) → 201 + return; `GET /api/admin/pos/returns/:no`. The public link `/api/invoice/:token` also resolves return tokens and then answers `{ kind:'return', shop, ret }` with **no internal ids**; original-invoice payloads strip line ids.
- UI: on the invoice page, owner/admin see **`↩ Return items`** (when something is returnable): a modal "Return items — Against invoice X" with a table (Item, Sold, Already returned, Return now input + `All`), a Reason field and **REFUND PAID BY** Cash / QR / PayNow / Card; button `Create return invoice` → opens the credit note.
- **Return invoice document** (A4 and thermal): header `RETURN INVOICE` + `CREDIT NOTE`, `#RET-…`, date/time, **Original invoice #… and its date**, customer; section **ITEMS RETURNED** (returned qty of sold, rate, amount); section **ITEMS NOT RETURNED (KEPT BY THE CUSTOMER)** (or "Nothing — every item … has now been returned"); totals `Returned items value`, `Discount reversed` / `Coupon discount reversed`, `TAXABLE VALUE`, `GST 9% reversed`, `CGST`, `SGST`, **`REFUND TOTAL`**, `Refunded by <mode>`, `Delivery fee is not refunded`; refund in words, reason, other returns on the same invoice, footer "This credit note is issued against invoice #…".

---

## 6. Order History (`/admin/billing/orders`)

- Filters: search order ID, customer name, phone, order source, plus **GST chips** (`All bills · GST invoices · Non-GST bills`) and **payment chips** (`PAYMENT: All methods · Cash · QR / PayNow · Card · Split`). Server `listSales` accepts `gst` (`all|gst|nongst`) and `payment` (`all|cash|upi|card|split`).
- Row actions: WhatsApp, **invoice icon → in-page Invoice Preview**, **eye → Quick details** pop-up, void (owner/admin). **No page navigation or refresh** for either.
- **Quick details** (eye): modal with the invoice number, an `IN-STORE`/`ONLINE` pill and ✕; a 2×2 grid CUSTOMER / PHONE / DATE / STATUS; a bordered box listing each item `name (size) × qty — amount` followed by the full bill split-up; buttons `Close` and `View invoice`.
- **Invoice Preview** (modal, max 1000px): dark header bar `🖨 INVOICE PREVIEW • #<no>` with an `Open Full Page ↗` button and ✕, the A4 invoice (or return invoice) inside, scrollable; Esc closes; `Open Full Page` navigates to `/invoice/<token>`. All other places that opened an invoice (analytics lists, coupon panel, post-sale) use the same preview.

---

## 7. POS Analytics (`/admin/billing/analytics`)

- Header: title `POS Analytics`, subtitle `Real-time store & channel insights`; a pill bar `PERIOD: ALL TIME · TODAY · THIS WEEK · THIS MONTH · THIS YEAR · CUSTOM` on the right (hidden on Today's sales).
- Tabs: Revenue · Today's sales · Products · Coupons. Under them a grey **channel bar** `All Channels · ● Offline (POS) · ● Online` with the GST chips at its right end, and a cream **payment bar** `PAYMENT  All Methods · ● Cash · ● QR / PayNow · ● Card · ● Split` (coloured dots amber/blue/pink/violet). Active chip black → navy theme.
- Server `GET /api/admin/pos/reports` accepts `source` (`all|offline|online`) and `payment` (`all|cash|upi|card|split`), applied to every figure, chart and list (they extend the shared filter fragment).
- Tiles use the compact sizes in section 3. Product Sales Leaderboard has `Export Excel` (Rank, Product, Qty sold, Revenue, Market share %). Keep the existing richer tiles (net profit, GST sales, non-GST sales, expenses, cost price, formula bar).

---

## 8. Stitching: one billing panel, no separate studio

- The whole **Stitching Studio** is removed from the admin: Dashboard, Stitching Orders, Design Library, Tailors, Stitching Reports, Garment Types, the new-order form, order detail, job-card print page, trials and appointments. Routes `/admin/stitching/*` redirect to `/admin/billing/measurements`. Keep the neck-drawing component as `components/NeckPicker.jsx` (used by the measurement window). The stitching database tables and API may stay; they are no longer reachable from the UI.
- Stitching is billed in the **Billing panel**: `✂ Add service` adds a service line; its `Add measurements` opens the Measurement window (front neck and back neck pictures, sleeve type, sleeve length, due date, sizes in cm — Front neck, Back neck, Shoulder, Sleeve length, Arm hole curve, Shoulder to waist, Chest, Waist, Blouse length, Side cut, Front cut, Back cut — and remarks). Measurements are stored on the bill line (`variant_snapshot.measure`) and print under the item on the invoice. Advance orders (deposit now, balance on collection) cover advance payments.
- **Measurements page** (`/admin/billing/measurements`, `PosMeasurements.jsx`): title `Measurements`, subtitle `Tailoring measurements for each saved bill`, period pills and `Export Excel`; four clickable tiles `TOTAL BILLS` (black), `PENDING` (amber), `COMPLETED` (green), `CANCELLED` (red) that filter the list; a filter card (Search order ID, Customer name, Customer phone, Status); then one **card per bill**: customer name, invoice pill, `phone · date · N items`, a status control (`Pending`/`Completed` select; a voided bill is a fixed red `Cancelled`) and an expand arrow. Expanded: address, then each stitching line with its price, **front neck and back neck with their drawings**, sleeve type, sleeve length, due date, cm sizes as tinted tiles (`FRONT NECK 12 cm`…), and a `REMARKS` bullet list.
- Server (`lib/measurements.js`): `GET /api/admin/pos/measurements?q&name&phone&status&from&to` → `{ counts:{all,pending,completed,cancelled}, bills:[{invoiceNo, customerName, customerPhone, customerAddress, billDate, createdAt, status, total, shareToken, items:[{name, unitPrice, quantity, lineTotal, measure}]}] }` for retail bills having at least one line whose `variant_snapshot` has `measure`; effective status = `cancelled` when the bill is voided, otherwise `tailoring_status`. `PATCH /api/admin/pos/sales/:invoice/tailoring {status:'pending'|'completed'}` (409 for a voided bill).

---

## 9. Coupons (`/admin/billing/coupons`)

- Page header `Coupon Management` / "Create discount codes and send them to customers on WhatsApp. Applies to the product subtotal only." with `Download Excel` and `Refresh`; three KPI cards (Total coupons, Active coupons, Total redemptions); a blue note: "Coupon discount applies to the product subtotal only — not delivery charges or GST. Staff can apply a coupon in Billing; enter the customer's phone first for member-only coupons." (keep the last clause only if sent-only coupons exist).
- **No loyalty / audience concept anywhere** (no Everyone / Non-loyalty / Loyalty members cards, no loyalty flag on customers).
- **New Coupon** card: code (+ gold `Generate` button), Discount % and Min order (S$), a `% off / S$ off` toggle, Expiry date, Usage limit, and a switch **"Only for customers it's sent to — works only for the mobile numbers you send it to from this page"**, button `CREATE COUPON` (gold `#9a7120`).
- **All Coupons** card: count badge, filter chips `All · Active · Inactive · Sent only` (with counts), search box, and per coupon: monospace code, `ACTIVE`/`INACTIVE` badge (+ `SENT ONLY`), `10% OFF · min S$500`, `Used 0 times of 100 · no expiry · sent to n`, and buttons `EVERYONE` (opens the recipient list), `SEND`, `ACTIVE/INACTIVE` toggle, edit (pencil: discount, min, expiry, limit, only-sent switch — never the code) and delete.
- **Send coupon** modal: help text, `CUSTOMER PHONE *`, `CUSTOMER NAME`, switch `ONLY FOR THIS CUSTOMER` (when on, an amber warning "This coupon will only work for the phones it was sent to. Walk-in customers can't use it any more…"), buttons `Cancel`, green `Send link on WhatsApp`, outlined `Generate & share PDF`. WhatsApp opens with: `Hello <name>,` / `🎁 Here is a coupon from *<shop>*` / `Code: *CODE*` / `Offer: *10% OFF*` / bullets (`Valid on purchases of S$x or more`, `Valid till <date>`, `Only for the mobile number it was sent to`, `Show this code at billing. Discount applies to the item value only.`) / `Download your coupon: <origin>/coupon/CODE` / `📞 <shop phone>`. "Generate & share PDF" opens the public coupon card with `?print=1` (browser Save-as-PDF). Every send is recorded.
- **Recipients modal** (`EVERYONE`): every customer with a phone: name, phone, green `SEND` (→ `SENT ✓ · AGAIN` after sending, light green), footer `Done · n sent`.
- **Public coupon card** `/coupon/:code` (bare page, no site chrome): dashed black-bordered white card, shop name, `GIFT COUPON`, huge `10% OFF`, the code in a black rounded box, rules, and a black `⬇ Download coupon` button that draws the card on a canvas and saves a PNG. Public API `GET /api/coupon/:code` returns only `{ shop:{name,phone}, coupon:{code, discountType, discountValue, minOrder, expiresOn, active, sentOnly} }`.
- Server: `couponAccessProblem` — a `sent_only` coupon is accepted only for a phone present in `pos_coupon_sends`; enforced both in `GET /pos/coupons/check?code&subtotal&phone` and inside `createSale` (customer phone). Endpoints: list (adds `sentOnly`, `sentCount`), create/edit (`PATCH` with full body), `POST /pos/coupons/:id/sends {phone,name,onlyThis}`, `GET /pos/coupons/:id/recipients`, `GET /pos/coupons/export` (CSV: Code, Discount, Minimum order, Expires, Usage limit, Used, Status, Only sent customers). Billing passes the customer's phone when applying a coupon.

---

## 10. Inventory (`/admin/billing/inventory`)

- Header: `Inventory` / `N products · same catalog customers see`, an **Alerts** button (amber, red count badge) and black→navy `+ Add Product`.
- Warning banner when needed: `⚠ 4 out of stock · 13 running low · 9 with a size sold out — restock soon.`
- Filter card: chips `All · New Arrivals (n) · Best Sellers (n) · Low Stock · Out of Stock` (New Arrivals = collection slug `new-arrivals`, Best Sellers = featured), a category select, a sort select (Name A–Z, Stock low→high, high→low, Price low→high, high→low), a `Grid | List` toggle, and a search box.
- **Card grid** (`repeat(auto-fill, minmax(230px, 1fr))`): tall photo with a badge `IN STOCK` (green) / `LOW STOCK` (amber) / `OUT OF STOCK` (red), edit and delete buttons top-right, name + price, category, a bordered `N Total Units` box (opens Adjust Stock) and `In stock` / `Low · reorder @ n` / `Sold out`. Low cards have a pale-yellow background with a gold border; out cards pale red. The previous list view stays as the `List` option.
- **Stock Alert modal** (opens once per browser session when something is low or sold out, and from the Alerts button): round amber ⚠ icon, `Stock Alert`, `N product(s) need attention`; each product card (yellow, or pink when 0 units) with name, `category · N units in total · alert at <level> or fewer`, an `Edit` button, and for each size at ≤1 unit a row `10yrs / Brown · sold out` with **`+1 +5 +10`** buttons (quick restock via `POST /api/admin/pos/stock {variantId, type:'restock', qty}`); `Dismiss` at the bottom.
- **Per-product low-stock level:** `products.low_stock_alert` (migration 025), default 3, returned as `lowAlert`, saved via the product `PATCH` (`lowAlert`). A product is "low" when its total stock across all sizes ≤ its level.
- **Edit Product** modal: one scrolling window in two columns. Left: **Basic Details** (Product name, Description) and **Media Gallery** (the existing photo manager). Right (light grey): **Organization & Pricing** (Category, Status, Selling price, Cost price, GST %, Fabric/material, checkbox `Mark as "New Arrival"` (toggles the `new-arrivals` collection), checkbox `Show in "Best Sellers"` (featured), the collections chips) and **Inventory Alerts** (`LOW-STOCK ALERT AT`, hint "COMPARED AGAINST THE TOTAL ACROSS ALL VARIANTS"). Below, a grey **Product Variants** section (table of sizes/colours/SKU/own price/stock with the existing row editor, an add-row form with an `+ Add Row` button) and `Cancel` / `Save Changes` (dark, large) at the bottom. Labels are 12px uppercase with `.12em` tracking.

---

## 11. Advance orders, payments and customers

- Advance order screens use the same `PayPicker` (Cash, QR / PayNow, Card, Split) for the deposit and for the balance; the deposit and balance split are stored and printed (section 5).
- Customers: name, mobile, date of birth, notes (no loyalty). `Export Excel` columns: Name, Mobile, Date of birth, Bills, Spent (S$), Notes.
- Expense tracker: `⚙ Manage categories` and `Export Excel` (Date, Expense, Category, Amount, Paid by, Notes) next to the period filter; the existing add/remove-category panel stays.

---

## 12. Server test additions (keep them green)

- `coupons.test.js`: open coupon needs no phone; sent-only is refused until the phone was sent the coupon, then accepted, still refused for other phones; "only for this customer" switches an open coupon to sent-only; recipients show who already got it; edit works; a bill with a sent-only coupon is refused for the wrong phone and accepted for the right one; public card has no counts/recipients; unknown code → 404.
- `returns.test.js`: partial then final return, refund maths (subtotal/discount/tax of all returns add up to the original), stock goes back, over-return refused, original lists returns with `returnedQty`, void refused after a return, public credit note has no internal ids.
- `measurements.test.js`: only bills with stitching lines are listed; counts by status; status change; voided bill → cancelled and cannot be set back; name filter.
- Update `api.test.js`: the checkout total is now `subtotal + shipping` (GST included).

---

## 13. Deployment checklist

1. Apply migrations 023–027 to the live database (`cd server && npm run migrate`); the Vercel API does **not** run migrations at start-up.
2. Build the client and run the whole suite serially.
3. Check visually (the work above was not screenshot-verified in a browser for every screen): home, shop tabs, product page, bag drawer, checkout + confirm pop-up, sign-in, account; admin at 65%: Billing (Catalog picker, GST split, three action buttons), Order History (eye, invoice preview, filters), Measurements, Coupons (send, recipients, public card), Inventory (grid, alert, Edit Product), Analytics (filters), invoice print preview on A4, A5, 58 mm and 80 mm, a split-payment bill, an advance bill, and a return invoice.

---

## 14. Added after the sections above (all built; port these too)

**Built since the first version of this prompt**
- **Add Product** two-column modal (basic details + media gallery + suggested products | organisation & pricing, flags, low-stock level, default stock, variants); **Edit Product** the same. Variant column is **Selling price S$** (blank = product price). Inventory cards show **Cost** and **Selling** (managers), list view shows `Cost / Selling`. All inventory photos are the same 3:4 box (`object-fit: cover`, absolutely positioned) so cards align and the edit/delete buttons are never clipped.
- **Home shelves**: *New Arrivals* and *Best Sellers* (`FlagShelf`, first 4 flagged products). "VIEW ALL" goes to `/shop?flag=new|best`; the Shop page reads `flag`, passes it to `GET /products?flag=` and shows the matching title/intro. Each shelf keeps **only the 10 newest flagged products** (`capFlags()` in `lib/catalog.js`, called when flags are saved; flagging touches `updated_at`).
- **Taxonomy (Categories) page** always lists the built-in rows *Trending collections*, *Best Sellers* and *New Arrivals* with live product counts (`shelves` in `GET /admin/taxonomy`) and an edit link; the collection rows below stay editable.
- **Online orders** as cards; **edit issued invoices** from Order History (`PATCH /admin/pos/sales/:invoice`, stock follows, audit-logged, "EDITED" mark).
- **Suggested products / "Complete the look"**: migration `029_product_suggestions.sql`, `GET/PUT /admin/pos/products/:id/suggested` (max 4, ordered), `suggested` in the product detail response, a "Complete the look" section on the product page above "More from <category>", and the two-pane `SuggestPicker` (Available | Selected, search, +/✕) in Add and Edit Product.
- **Stitching sidebar group** (between Retail billing and Online store): Stitching Dashboard, Stitching Orders, Measurements, Stitching Reports (manager). Backend: `GET /admin/pos/stitching/orders` and `/stitching/overview` (`lib/measurements.js`: `listStitchingOrders`, `stitchingOverview`; orders = bills with stitching lines + open advance orders). `+ New stitching order` opens Billing with a service line ready (`/admin/billing?new=stitching`).
- **POS Analytics header in three rows**: (1) one `PERIOD` pill — All time / Today / This week / This month / This year / **Custom** (From/To date inputs appear only for Custom), (2) tabs Revenue · Today's sales · Products · Coupons, (3) one filter bar: channel (All Channels / Offline (POS) / Online) + GST chips + payment (All / Cash / QR / PayNow / Card / Split). Compact spacing, same font sizes.
- **Split payment auto-balance** in Billing: the amounts typed stay; the remaining balance goes into the first box not typed in (so entering Cash fills QR / PayNow with the rest).
- **Customer details**: typing a mobile number (8+ digits) fetches name, date of birth and last address (`GET /admin/pos/customers/lookup`). Customers page: click a row or *View* for the full history (`GET /admin/pos/customers/:id/history`): contact details, totals, every invoice (click opens the invoice), advance orders and stitching bills.
- **Delivery charge by distance, configured in admin**: `lib/delivery.js` + `pos_settings.delivery_rules` = `{ enabled, storePostal, freeOver, maxKm, perKmBeyond, bands:[{upToKm, fee}], orderTiers:[{minOrder, fee}] }`. Distance = straight line between the shop's and the customer's postal codes (OneMap geocode, cached, 4s timeout; unknown distance uses the first band). Free when the order is at least `freeOver`; a higher `orderTiers` entry caps the fee; beyond the last band add `perKmBeyond` per km; beyond `maxKm` checkout is refused. `GET/PUT /admin/pos/delivery-rules` (manager). The cart (`GET /cart?pin=XXXXXX`) and `createPendingOrder` use the same `shippingFor(db, subtotal, pin)`. Admin: a *Delivery charge* card at the bottom of POS Settings (`DeliveryRulesCard`) edits all of it. Checkout: once the 6-digit postal code is typed, `loadCart(pin)` re-prices the bag (`GET /cart?pin=`), the totals show `Delivery (x km)` and any note; `loadCart` ignores non-string arguments.
- **Roles** (Users & Roles): shown as Admin, Staff · Billing (`cashier`), Staff · Stock (`inventory`), Customer, Owner. Only the owner adds users and changes roles; the toolbar (search, Add user, filters) sits in the filter row. Filters: Everyone / Admins / Staff / Customers.
- Header **logo and Home** always scroll to the top of the home page, even from Shop Story. The shop/catalogue filter bar is **not sticky** any more.
- Admin content pages (Trending, Site text, Enquiries, Storefront images) use a responsive grid (`.adm`) so blocks fill the width; enquiries are a card grid with a compact status select.

**Still not done (do not assume these exist)**
- Extra-fee row on bills; Department / MRP / base weight / age range product fields; Split option for old stitching payments.
- A sidebar close (✕) button: the user later said to keep it in the quick view, which already has it.

Migrations to run on the live database: 023–030 (`npm run migrate`; Vercel does not migrate automatically).

**Added later (also built)**
- **Cost price per size**: migration `030_variant_cost.sql` adds `product_variants.cost_override` (null = the product's cost). Guarded by `hasVariantCost()` so the code works before the migration runs. A sale line snapshots `COALESCE(size cost, product cost)`; stock value in reports uses the same; `listProducts` variants carry `costOverride` and effective `cost`. `PATCH /admin/pos/products/:id/variants/:vid` accepts `cost`; product create accepts `variants[].cost`. UI: a Cost price column in Edit Product variants and a COST (S$) column in Add Product rows (placeholder = product cost).
- **Reports subtract returns** (`report()` in `lib/pos.js`): returns made in the period (by return date, same channel/GST/source filters) reduce `revenue`, GST (`tax`), cash/upi/card by refund mode, GST/non-GST and offline/online sales, units, cost of goods sold (returned pieces at their cost snapshot), margin, daily/monthly/weekly charts and the product ranking. The response also has `grossRevenue` and `returned: { count, total, tax }`. The "Where the money went" panel says "after returns". Test: `test/reportreturns.test.js`.