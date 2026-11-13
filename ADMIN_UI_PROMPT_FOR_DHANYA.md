# Prompt: make the Dhanya admin look EXACTLY like the Mahana admin (layout, boxes, sizes, fonts, placement)

You are an AI coding agent working in the **Dhanya** codebase (React + Vite client). Your only job here is the **look and placement** of the admin side (`/admin/*`, the "POS" admin). Business logic, routes and data are covered by a separate prompt (`PORT_TO_DHANYA_PROMPT.md`); do not change behaviour here.

**How to use this prompt.** Part 1 is the design system in words (tokens, fonts, type scale, spacing). Part 2 places every box on every admin page. It comes with a second file, **`ADMIN_UI_CSS_PART1_OF_4.md` … `PART4_OF_4.md`** (Part 3 = shell/modal/period-filter source, Part 4 = the complete Mahana admin CSS, verbatim, in load order). **Attach that file and copy its CSS as-is** — the numbers in Parts 1–2 are a reading guide for it, and where they ever disagree the CSS wins. Do not "improve", round or re-derive any value. Do not add a zoom/scale hack. After copying, make Dhanya's markup use the same class names (Part 3 and Part 2 list them), then compare each page against the placement rules.

Rules that apply everywhere:
- Everything is scoped under `.dpos` (page root) or `.dpos-modal` (pop-ups). No admin rule may leak to the public site, and no public rule may leak into admin.
- Desktop admin is drawn at **90% (`--z: .9`, CSS `zoom` on `.dpos`, set in the final block of `pos3.css`)** so it looks right at the browser's own 100% zoom; phones (< 900px) stay at 100%. Do not add any other scale hack; the sizes below are the CSS pixels *before* that 90%. Portal-level pop-ups outside `.dpos` carry the same 90% (`.bc-portal`).
- Colours are tokens, never hard-coded in components: `--d-acc` (accent) comes from the store theme (`var(--pos-accent, #1c284f)`, Mahana = navy `#1c284f`). Active states, primary buttons, selected chips, totals and links use the accent. Dhanya must set its own `--pos-accent` and everything follows.
- Money prints with the store currency symbol; the layout never depends on it.

---

# PART 1 — Design system

## 1.1 Typeface
- **Poppins** for *all* admin text (loaded from Google Fonts: `Poppins:wght@400;500;600;700;800`). Fallback `system-ui, -apple-system, 'Segoe UI', sans-serif`. Monospace only for invoice numbers / coupon codes: `ui-monospace, 'SF Mono', Consolas, monospace`.
- Applied with an explicit `:is(h1…li, small, b, strong, …)` rule on `.dpos` and `.dpos-modal` so nothing falls back to the public site font. Letter-spacing 0 for body; headings `-.015em`.
- Weights used: 400 body, 500 nav items and inputs, 600 buttons/nav-active, 700 headings and bold values, 800 for small uppercase labels, tile numbers and pills.

## 1.2 Tokens (on `.dpos`)
`--d-ink #121214` text · `--d-mut #6f6b66` muted text · `--d-line #dfdfec` borders · `--d-bg #f3f1ec` page background · `--d-card #fff` card · `--d-ok #1c7a4b` · `--d-bad #b3261e` · `--d-acc` accent (theme). Tints are `color-mix(in srgb, var(--d-acc) 7–10%, #fff)`.
Radii: cards 22px, tiles 18–22px, inputs 12px, buttons pill (999px) or 12–14px for block buttons, chips pill, modal 26–30px. Shadows are very light: `0 6px 20px -14px rgba(0,0,0,.35)` for tiles, `0 14px 26px -12px rgba(accent,.7)` only on the main CTA.

## 1.3 Type scale (final, in CSS px)
| Where | Size / weight |
|---|---|
| Base page text | 14.5px, line-height 1.4 |
| Page title (`.dpos-head h1`) | 27px / 700, line-height 1.1 |
| Page subtitle (`.sub`) | 14px, muted |
| Top-bar title (`.dpos-top-t`) | 17px / 700 |
| Card heading (`h2` in a card) | 17px / 700, 12px below |
| Sub-heading (`h3`) | 15px |
| Sidebar item | 15px / 500 (active 600), row padding 13px 16px, radius 14px |
| Sidebar group label | 10.5px / 800, letter-spacing .24em, uppercase, colour `#aaa59d` |
| Table body | 14px; cell padding 15px 16px |
| Table head | 10.5px / 700, letter-spacing .14em, uppercase; padding 13px 16px |
| Inputs / selects / textareas | 14.5px, padding 12px 15px, radius 12px (inside table cells 8px 11px) |
| Field labels (`label.f`, `.cp-l`, `.pe-l`) | 11.5px / 800, letter-spacing .1em, uppercase, 7px gap to input |
| Buttons (`.dpos-btn`) | 13.5px / 600, padding 10px 17px, pill |
| Period / filter chips (`.dpos-pg button`) | 12px / 800, uppercase, letter-spacing .04em, padding 8px 14px, pill |
| Tabs (`.dpos-tabs button`) | 14px / 700, uppercase, letter-spacing .04em, padding 14px 4px, 28px gap, 2px accent underline when active |
| Tile label (small caps) | 10.5–11px / 800, letter-spacing .12–.14em |
| Tile value | 22–28px / 800 (Grand total 34px accent) |
| Footer | 11–12px, uppercase, letter-spacing .06em, colour `#8d8a84` |
| Inventory card name / price | 15.5px / 700; category 13.5px; Cost/Selling labels 12px, values 14px / 700; "N Total Units" 14px / 800 |

## 1.3b Spacing rhythm
Page padding `18px clamp(10px,1.4vw,26px) 16px`; gap between sidebar and content 22px; gap between blocks in the content column 18px; card padding `20px 24px`; grid gaps inside pages 14–18px; chips gap 8px; tab gap 28px. Max content width of the whole admin: **1760px**, centred.

---

# PART 2 — Where every box goes

## 2.1 Frame (every admin page)
`.dpos` is a CSS grid: column 1 = **sidebar 262px** (only at viewport ≥ 900px), column 2 = content `minmax(0,1fr)`, gap 22px, align-items start.
- **Sidebar** (`.dpos-side`): white card, radius 22px, padding 12px, sticky `top: 18px`, `max-height: 100vh − 36px`, scrolls inside itself. Top: the store **logo image** (`.dpos-brand img`, max-width 150px) with "ADMIN" under it (10px, .2em). Then groups, each with a small uppercase group label and rows (icon + label, 14px gap). Active row = accent fill, white text. Group order: *Retail billing* (Billing, POS Analytics, Advance Orders, Order History, Inventory, Customers, Coupons, Date of Birth, Expenses) → *Stitching* (Stitching Dashboard, Stitching Orders, Measurements, Stitching Reports) → *Online store* (Online orders, Reviews, Categories, Trending, Site text, Storefront images, Reels & Gallery, Enquiries, Users, Sample data) → **Settings always last** (POS Settings, Store Settings).
- **Below 900px** the sidebar becomes a horizontal scroll strip above the content (`flex-wrap: nowrap; overflow-x: auto`, hidden scrollbar), the footer is static, the desktop grid is not applied.
- **Header row** (top of the content column): title (27px) with subtitle under it on the left; on the right: page actions (buttons), then "← View Store" pill, then the round 38px avatar (accent fill, white initial). There is **no separate "Dashboard" bar** and **no duplicate title** inside the page body.
- **Footer** (`.dpos-foot`): pinned at the bottom of the content column (sticky, never moves up on short pages): left `© YEAR ALL RIGHTS RESERVED. <STORE NAME>.`, centre `POWERED BY <b>CENEXA SYSTEMS</b> ©YEAR`, right italic `• <tagline>`; top border, background `#f1efea`, 16px 8px padding.

## 2.2 Filter rows (reused on many pages)
- **Period pill** (`PeriodFilter`): ONE white pill, radius 999px: `PERIOD` label (10px/800) then chips *All time · Today · This week · This month · This year · Custom*; the From/To date inputs appear inside the same pill **only when Custom is chosen**. Active chip = accent fill, white text.
- **Chips** (`Chips`): same pill, with its own small uppercase label (e.g. `STATUS`, `SHOW`).
- **Export** button: ghost pill "⤓ EXPORT EXCEL" at the far right of the filter row.
- A page filter row is: chips (left) · period pill · export (right), wrapping on narrow widths (`.dpos-bar-tools`).

## 2.3 Page by page
**Billing** (`/admin/billing`): two columns — left *Customer details* card (name, mobile, DOB, address; typing a mobile auto-fills) above *Order items* card (buttons row: CLEAR ORDER, CATALOG (accent), ADD SERVICE, + ADD CUSTOM ITEM; each line = item block left, qty stepper + ✕ right; a service/custom line (name, price, GST select, "Add measurements") exists **only after Add service / Add custom item and disappears if left empty**); right column (sticky) *Summary*: ledger rows (subtotal, discount, delivery, GST split box), GST toggle (NON-GST BILL | GST INVOICE pills), "FINANCIAL OPTION" four pills (CASH, QR / PAYNOW, CARD, SPLIT), GRAND TOTAL row (label 17px, amount 34px accent), pay box (bordered, radius 18px), then the CTA stack "COMPLETE SALE & WHATSAPP" (full-width accent), PRINT, SAVE ONLY. Split: choose 2–3 methods, one input each; typing in one fills the balance into the first untouched box.
**POS Analytics**: *three rows only*: (1) period pill; (2) tabs REVENUE · TODAY'S SALES · PRODUCTS · COUPONS with a 1px bottom line; (3) ONE filter bar: channel segment (All Channels | Offline (POS) | Online) + GST chips + payment segment (All | Cash | QR / PayNow | Card | Split) on the same line, wrapping only under ~1500px. Then tiles: 4 per row on desktop (auto-fit, min ≈ 240px), 2 on tablet, 1 on phone; each tile white, radius 22px, label (small caps), big value (green for revenue, orange for offline, etc.), muted sub-line, "VIEW DETAILS →".
**Advance Orders / Order History**: summary tiles row, filter row, then white card with table; row actions are 36px square icon buttons (WhatsApp green, PDF red, eye grey, delete red); status/payment as small uppercase tags.
**Inventory**: top filter card (chips: All · Best Sellers (n) · Low Stock · Out of Stock; category select; sort select; Grid/List switch; search box right-aligned), stock-alert banner above it; grid of cards `repeat(auto-fill, minmax(240px, 1fr))`, gap 18px. Card: white, radius 22px, **photo box always 3:4 (`object-fit: cover`)**, status badge top-left, edit + delete 36px buttons top-right, then name (full, wrapping — no ellipsis) with price at right, category, *Cost / Selling* two-column mini row (managers only), footer: "N Total Units" button + status text. Low stock card cream `#fffbec` with amber border, out-of-stock `#fff6f6` with red border. **Edit/Add Product** modal is two columns (left: basic details, description, media gallery; right: organisation & pricing — category, status, selling price, cost price, GST, flags ticks "Show in Trending collections" and "Show in Best Sellers", low-stock level, default stock), below it the **variants table** (Size, Colour, SKU, Selling price S$, Cost price S$, Stock, actions) with an add-row line, the Cancel / Save buttons, and **last, below the variants: "Suggested Products (n/4)"** — search box, then two panes (AVAILABLE with + buttons, SELECTED with ✕), each pane a rounded list with 44×52 thumbnails.
**Customers**: search + period + export + "Add customer" toolbar, one white card table (Name, Mobile, DOB, Bills, Spent, actions View/Edit/Delete); clicking a row opens the wide history modal (details, 4 small totals tiles, invoices table, advance-orders table).
**Coupons**: two columns — left "+ New Coupon" card (code with Generate button, discount %, min order, % off | S$ off switch, expiry, usage limit, "only for customers it's sent to" switch row, full-width accent CREATE COUPON button), right "All Coupons (n)" card with All/Active/Inactive chips, search, list of coupon cards. Theme accent only; no gold/brown.
**Measurements / Stitching pages**: tiles row, filter row, bill cards (expandable) / tables; Stitching Dashboard = 8 KPI tiles + Due-in-7-days + Overdue lists + recent orders table.
**Expenses, Date of Birth, Settings**: single-column cards, 24px apart; Settings ends with *Delivery charge (distance & order)* then password and staff-access cards.
**Categories (Taxonomy)**: search bar, then two columns: *Departments* (exactly two built-in rows: "Trending collections", "Best Sellers", each a white row card 22px radius with title 17px, small uppercase meta line, and an Edit button) and *Categories* (rows with Edit pieces, on/off switch, red trash).
**Trending**: two-column grid of blocks (`.adm`): Trending collections picker (max 4) and Best Sellers (max 10: list with Remove, category chips, product cards with "+ Add").
**Site text, Storefront images, Reels & Gallery, Enquiries, Users & Roles, Online orders, Reviews**: content pages built on `.adm` — a responsive grid `repeat(auto-fit, minmax(min(100%, 460px), 1fr))`, 14px/16px gaps; blocks white, radius 18px, padding 18px 22px; inputs full width (not 70%); enquiries and online orders are **card grids** (min 430px) not tall single rows; Users & Roles has its toolbar (search, + ADD USER, role chips Everyone/Admins/Staff/Customers, period, export) in ONE filter row above the table, roles shown as Admin / Staff · Billing / Staff · Stock / Customer / Owner.
**Modals** (`Modal`): centred white sheet on a dim scrim, radius 26–30px, header (title 22px + muted subtitle, ✕ top-right), scrolling body, sticky footer with Cancel (ghost) and the primary button (accent). Widths: default 560px, `.wide` 980px, product editor `.pe-wide`. Esc and backdrop close.

## 2.4 Responsive
- ≥ 900px: sidebar + content. < 900px: strip nav, single column, footer static.
- Tiles / cards use auto-fit grids so they reflow 4 → 2 → 1; tables scroll inside `.dpos-tw` (never the page).
- Nothing may overflow horizontally at 390px; filter rows wrap; buttons keep ≥ 40px touch height.

When you finish, check each page of Part 2 against the result, one by one, at 1534px, 1024px and 390px wide.
