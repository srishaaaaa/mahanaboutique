# ADMIN UI ATTACHMENT — PART 2 OF 4
(Companion to ADMIN_UI_PROMPT_FOR_DHANYA.md. Do NOT start work until you have received all 4 parts. Parts are in order; a code block that continues in the next part is closed and reopened — join those pieces into one file/section when you copy.)

```css
.ex-empty { display: grid; justify-items: center; gap: 6px; padding: 34px 10px; text-align: center } .ex-empty p { margin: 0; font-size: 13px; opacity: .65 } .ex-pig { width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; background: #f1eff3; color: #6b6670 }
.ex-bars { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px } .ex-bars li { display: grid; grid-template-columns: 150px 1fr auto; align-items: center; gap: 12px; font-size: 13px } .ex-bars i { height: 10px; border-radius: 999px; background: #eceaee; overflow: hidden } .ex-bars u { display: block; height: 100%; background: var(--ex); border-radius: 999px; min-width: 4px } .ex-bars b { font-size: 13px }
.ex-mgr { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1fr); gap: 14px } @media (max-width: 700px) { .ex-mgr { grid-template-columns: 1fr } }
.ex-add-cat { display: grid; gap: 10px; align-content: start; padding: 16px; border: 1px solid #e8e4dd; border-radius: 16px } .ex-add-cat b { display: flex; align-items: center; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid #eee }
.ex-cats { border: 1px solid #e8e4dd; border-radius: 16px; overflow: hidden } .ex-cats-h { padding: 14px 16px; background: #faf8f5; font-weight: 800; font-size: 13px } .ex-cats ul { list-style: none; padding: 0; margin: 0; max-height: 330px; overflow: auto }
.ex-cats li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 14px 16px; border-top: 1px solid #f0ece6 } .ex-on { padding: 4px 12px; border-radius: 999px; background: #dcfce7; border: 1px solid #bbf7d0; color: #166534; font-size: 11px; font-weight: 800 } .ex-cats li button { color: #9a9a9a } .ex-cats li button:hover { color: var(--ex) }
.ex-fl { display: flex; gap: 10px; flex-wrap: wrap } .ex-fl select, .ex-fl input { width: auto; min-width: 170px }
.ex-chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #f1eff3; font-size: 12px; font-weight: 700 } .ex-amt { color: var(--ex); font-weight: 800 }

/* ---- analytics boxes that open ---- */
.dpos-card2.openable { cursor: pointer; transition: transform .2s, box-shadow .2s } .dpos-card2.openable:hover, .dpos-card2.openable:focus-visible { transform: translateY(-2px); box-shadow: 0 14px 28px -16px rgba(0, 0, 0, .35); outline: none }
.dpos-card2 .s.more { margin-top: 8px; font-size: 11px; font-weight: 800; letter-spacing: .06em; color: #b91c1c } .dpos-card2.net .s.more { color: #fff; opacity: .9 }
.money-sum { display: grid; gap: 8px; padding: 14px 16px; border: 1px solid #e8e4dd; border-radius: 14px; background: #faf8f5 } .money-sum > div { display: flex; justify-content: space-between; font-size: 14px } .money-sum .tot { padding-top: 10px; border-top: 1px solid #e5e2dd; font-weight: 800; font-size: 16px } .money-sum .neg { color: #b91c1c } .money-sum .pos { color: #0a7a3d }
.money-h { margin: 18px 0 8px; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase }

/* the shopping bag uses the same light panel as Refine */
.drawer.refine.glass { right: 0 } .drawer.refine .bag-thumb { background: #dfdeed } .drawer.refine .bag-lines li { border-color: rgba(20, 28, 56, .12) }
.drawer.refine .muted, .drawer.refine .small { color: rgba(20, 28, 56, .65) } .drawer.refine .btn.solid { background: var(--red, #2d3e76); color: #fff; border-color: var(--red, #2d3e76) }
.drawer.refine .link-u { color: #141c38 } .drawer.refine .icon-btn, .drawer.refine .qty button { color: #141c38 }

/* ---- Coupon Management ---- */
.cp, .bd { --p: var(--pos-accent, #1c284f); display: grid; gap: 16px } .cp-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px } .cp-top h2 { margin: 0; font-size: 28px; font-weight: 800 } .cp-top .sub { margin: 4px 0 0 }
.cp-ref { display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font-size: 13px; font-weight: 700 }
.cp-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px } @media (max-width: 820px) { .cp-kpis { grid-template-columns: 1fr } }
.cp-k { display: flex; justify-content: space-between; gap: 12px; padding: 20px 22px; border: 1px solid #e8e4dd; border-radius: 20px; background: #fff } .cp-k span { display: block; font-size: 11px; font-weight: 800; letter-spacing: .08em } .cp-k b { display: block; margin: 16px 0 4px; font-size: 32px; font-weight: 800 } .cp-k b.g { color: #0f9d6b } .cp-k small { font-size: 13px; opacity: .65 }
.cp-k i { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: #f1eff3; color: #44403c; font-style: normal; font-weight: 800 } .cp-k i.g { background: #dcfce7; color: #0f9d6b } .cp-k i.dark { background: var(--d-acc, #1c284f); color: #fff; border-radius: 50% }
.cp-note { display: flex; align-items: center; gap: 10px; margin: 0; padding: 14px 18px; border-radius: 14px; background: #f1efec; font-size: 14px }
.cp-two { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 18px; align-items: start } @media (max-width: 1000px) { .cp-two { grid-template-columns: 1fr } }
.cp-card { display: grid; gap: 12px; padding: 24px; border: 1px solid #e8e4dd; border-radius: 22px; background: #fff; align-content: start } .cp-card h3 { margin: 0; font-size: 20px; font-weight: 800 }
.cp-badge { justify-self: start; padding: 5px 12px; border-radius: 999px; background: var(--p); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: .08em }
.cp-l { display: block; margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #1c1917 } .cp-l em { color: #b91c1c; font-style: normal }
.cp-card input, .cp-card select { width: 100%; padding: 14px 16px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fafafa; font: inherit; font-size: 14px; letter-spacing: 0 } .cp-card input:focus { outline: none; border-color: var(--p); background: #fff }
.cp-code { display: grid; grid-template-columns: 1fr auto; gap: 10px } .cp-code input { font-family: ui-monospace, Menlo, monospace; font-weight: 700 } .cp-code button { display: inline-flex; align-items: center; gap: 8px; padding: 0 18px; border-radius: 12px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .06em }
.cp-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px } .cp-type { display: grid; grid-template-columns: 1fr 1fr; gap: 8px } .cp-type button { padding: 11px; border: 1px solid #e5e2dd; border-radius: 12px; font-size: 12px; font-weight: 800; background: #fff } .cp-type button.on { background: var(--p); border-color: var(--p); color: #fff }
.cp-go { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; border-radius: 14px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .08em } .cp-go:disabled { opacity: .5 }
.cp-lh { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid #eee } .cp-n { display: inline-block; margin-left: 8px; padding: 2px 10px; border-radius: 999px; background: var(--d-acc, #1c284f); color: #fff; font-size: 12px } .cp-adm { padding: 5px 12px; border-radius: 999px; background: #f1eff3; font-size: 10px; font-weight: 800; letter-spacing: .08em }
.cp-empty { padding: 44px 16px; border-radius: 16px; background: #faf8f5; text-align: center; font-weight: 700; color: #3a3438 }
.cp-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px } .cp-list li { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 14px 16px; border: 1px solid #ece8e1; border-radius: 14px } .cp-list li.off { opacity: .55 } .cp-list p { grid-column: 1; margin: 0; font-size: 12px; opacity: .7 } .cp-act { grid-column: 2; grid-row: 1 / 3; display: flex; align-items: center; gap: 12px }
.cp-c { font-family: ui-monospace, Menlo, monospace; font-size: 15px } .cp-d { margin-left: 10px; padding: 3px 10px; border-radius: 999px; background: #e9e8f4; color: var(--p); font-size: 12px; font-weight: 800 } .cp-del { color: #9a9a9a } .cp-del:hover { color: #b91c1c }

/* ---- Date of Birth ---- */
.bd-top { display: flex; align-items: center; gap: 14px } .bd-top h2 { margin: 0; font-size: 26px; font-weight: 800 } .bd-top .sub { margin: 2px 0 0 } .bd-ic { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: #f1eff3 } .bd-ic.sm { width: 40px; height: 40px }
.bd-add { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; padding: 14px 20px; border-radius: 14px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .06em }
.bd-tabs { display: flex; gap: 24px; border-bottom: 1px solid #e5e2dd } .bd-tabs button { padding: 12px 2px; font-size: 14px; font-weight: 800; color: #6b6670; border-bottom: 2px solid transparent; margin-bottom: -1px } .bd-tabs button.on { color: #111; border-bottom-color: var(--p) }
.bd-two { display: grid; grid-template-columns: minmax(300px, .62fr) minmax(0, 1.4fr); gap: 18px; align-items: start } @media (max-width: 960px) { .bd-two { grid-template-columns: 1fr } } .bd-col { display: grid; gap: 16px }
.bd-card { display: grid; gap: 10px; padding: 20px; border: 1px solid #e8e4dd; border-radius: 20px; background: #fff; align-content: start } .bd-h { margin: 0 0 4px; font-size: 16px; font-weight: 800 }
.bd-cal-h { display: flex; align-items: center; gap: 8px } .bd-cal-h select { padding: 10px 12px; border: 1px solid #e5e2dd; border-radius: 12px; font-weight: 700; background: #fff } .bd-sp { flex: 1 } .bd-cal-h button { padding: 9px 12px; border: 1px solid #e5e2dd; border-radius: 10px; background: #fff; font-weight: 700 }
.bd-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 8px } .bd-days i { display: block } .bd-days button { position: relative; aspect-ratio: 1 / .85; border: 1px solid #e5e2dd; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 800 } .bd-days button.now { border-color: var(--d-acc, #1c284f) } .bd-days button.sel { background: var(--p); border-color: var(--p); color: #fff }
.bd-days u { position: absolute; right: 5px; top: 5px; width: 6px; height: 6px; border-radius: 50%; background: #e11d48 } .bd-leg { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; font-size: 12px; opacity: .7 } .bd-leg u { width: 7px; height: 7px; border-radius: 50%; background: #e11d48 }
.bd-chips { display: flex; flex-wrap: wrap; gap: 8px } .bd-chips button { padding: 9px 14px; border-radius: 10px; background: #f1efec; font-size: 12px; font-weight: 800 } .bd-chips button.on { background: var(--d-acc, #1c284f); color: #fff }
.bd-l { margin: 8px 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #44403c } .bd-sel { display: grid; grid-template-columns: 1.3fr 1fr; gap: 10px } .bd-sel select, .bd-offer select { width: 100%; padding: 13px 14px; border: 1px solid #e5e2dd; border-radius: 12px; background: #fff; font: inherit; font-weight: 700 }
.bd-none { margin: 0; padding: 18px 4px; color: #6b6670; font-size: 14px } .bd-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px }
.bd-list li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid #ece8e1; border-radius: 14px } .bd-list b { display: block } .bd-list span { font-size: 12px; opacity: .65 } .bd-list em { font-style: normal; font-size: 12px; font-weight: 800; color: #b45309 }
.bd-send { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: #16a34a; color: #fff; font-size: 12px; font-weight: 800 }
.bd-oh { display: flex; align-items: center; gap: 12px } .bd-oh .sub { margin: 0 } .bd-save { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 12px; background: var(--p); color: #fff; font-size: 12px; font-weight: 800 } .bd-save:disabled { background: #e5e2dd; color: #858490 }
.bd-offer { display: grid; grid-template-columns: 1fr auto auto; gap: 8px } .bd-offer button { width: 46px; border: 1px solid #e5e2dd; border-radius: 12px; display: grid; place-items: center } .bd-offer button.del { color: #b91c1c; background: #fef2f2 } .bd-offer button:disabled { opacity: .4 }
.bd-addoffer { padding: 13px; border: 1px dashed #c9c4bd; border-radius: 12px; font-weight: 800; font-size: 13px }
.bd-card textarea { width: 100%; padding: 14px; border: 1px solid #e5e2dd; border-radius: 12px; font: inherit; font-size: 14px; resize: vertical } .bd-hint { margin: 0; font-size: 12px; opacity: .7 }
.bd-prev { padding: 16px; border: 1px solid #bbf7d0; border-radius: 14px; background: #f0fdf4 } .bd-prev p { margin: 0 0 8px; font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #44403c } .bd-prev pre { margin: 0; white-space: pre-wrap; font: inherit; font-size: 14px }
.bd-fh { display: flex; align-items: center; justify-content: space-between; gap: 10px } .bd-csv { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #a7f3d0; border-radius: 12px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800 } .bd-csv:disabled { opacity: .5 }

.cp-l input, .cp-l select { margin-top: 8px }


/* Reels & Photo Gallery admin page: six slots per section */
.dpos-reels.six { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px } @media (max-width: 900px) { .dpos-reels.six { grid-template-columns: repeat(2, minmax(0, 1fr)) } } @media (max-width: 520px) { .dpos-reels.six { grid-template-columns: 1fr } }
.dpos-reels.six .media { max-height: 340px; overflow: hidden } .dpos-reels.six .media img, .dpos-reels.six .media video { width: 100%; height: 100%; object-fit: cover }


/* =====================================================================
   POS theme pass: decorative red becomes the theme purple (or the accent chosen in Settings).
   Red is kept only where it carries meaning: errors, delete, negative amounts, shortfalls, balance due and out-of-stock.
   ===================================================================== */
.dpos { --d-bill: var(--pos-accent, #2d3e76); --d-tint: color-mix(in srgb, var(--d-bill) 10%, #fff); --d-tint2: color-mix(in srgb, var(--d-bill) 18%, #fff) }
.dpos-cta:not(.amber) { box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--d-bill) 70%, transparent) }
.dpos-splitpick button.on { background: var(--d-tint); border-color: var(--d-bill); color: var(--d-bill) }
.dpos-recv b.short { color: #b91c1c }

/* advance orders */
.adv-k span { color: var(--d-bill) } .adv-k i.rose { background: var(--d-tint2); color: var(--d-bill) }
.adv-search { color: var(--d-bill) } .adv-search input:focus { border-color: var(--d-bill) }
.adv-chips button.on, .adv-modes button.on { background: var(--d-bill); border-color: var(--d-bill) }
.adv-done .oid { color: var(--d-bill) } .adv-tag { background: var(--d-tint); color: var(--d-bill) }

/* inventory, movements, analytics */
.sm-btn.red { background: var(--d-bill) } .sm-k i.r { background: var(--d-tint2); color: var(--d-bill) } .sm-tag.out { background: var(--d-tint); color: var(--d-bill); border-color: var(--d-tint2) }
.an-red, .an-top em { color: var(--d-bill) } .an-bar u, .an-top u, .an-share u { background: var(--d-bill) } .adm-act .danger:not(:hover) { }
.dpos-card2 .s.more { color: var(--d-bill) } .dpos-card2.net .s.more { color: #fff }

/* birthdays, coupons, expenses already follow the theme; their small accents too */
.bd-days u, .bd-leg u { background: var(--d-bill, #2d3e76) }
.cp-d { background: var(--d-tint); color: var(--d-bill) }
.ex { --ex: var(--d-bill, #2d3e76) }
.ex-title svg { color: var(--d-bill, #2d3e76) }
.money-sum .neg { color: #b91c1c }

.ra.doc { background: var(--d-tint, #e9e8f4); color: var(--d-bill, #2d3e76) }
/* cost price boxes in analytics */
.cost-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px } @media (max-width: 760px) { .cost-row { grid-template-columns: 1fr } }
.cost-card { display: grid; gap: 14px; padding: 22px 24px; border: 1px solid; border-radius: 22px; background: #fff } .cost-card.teal { border-color: #b8d8d2; background: linear-gradient(180deg, #f3fbf9, #fff) } .cost-card.amber { border-color: #f7ebd4; background: linear-gradient(180deg, #f5f5fa, #fff) }
.cc-t { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px } .cc-t span { font-size: 12px; font-weight: 800; letter-spacing: .1em } .cc-t i { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center } .teal .cc-t i { background: #dcefec; color: #0f766e } .amber .cc-t i { background: #e1e0ee; color: #c2410c }
.cost-card b { font-size: 36px; font-weight: 800; letter-spacing: -.01em } .teal b { color: #0f766e } .amber b { color: #b45309 } .cost-card small { font-size: 12px; font-weight: 600 } .cost-card small em { font-style: normal; font-weight: 800; color: #0a8a5c } .cost-card small em.neg { color: #b91c1c }
/* search boxes: keep the icon clear of the text (the global POS input padding was winning) */
.dpos .adv-search input, .dpos .sm-search input, .dpos .an-search input { padding-left: 44px !important }
.dpos .adv-search svg, .dpos .sm-search svg, .dpos .an-search svg { pointer-events: none }


/* Photos inside the product Edit window */
.pphotos .adm-gal { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) }

/* Billing: service line Measurements */
.msr { display: grid; gap: 16px }
.msr-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px }
.msr-f { display: grid; gap: 6px; min-width: 0 }
.msr-l { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase }
.msr-h { margin: 6px 0 0; font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--d-bill, #2d3e76) }
.msr-neck { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 46px; padding: 6px 14px; border: 1px solid var(--d-line, #dfdfec); border-radius: 12px; background: #fff; text-align: left }
.msr-neck svg { width: 34px; height: 26px; flex: none }
.msr-neck > span:last-child { margin-left: auto; opacity: .5 }
.msr-chips { display: flex; flex-wrap: wrap; gap: 8px }
.msr-chips button { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--d-line, #dfdfec); background: #fff; font-weight: 700; font-size: 13px }
.msr-chips button.on { background: var(--d-bill, #2d3e76); border-color: var(--d-bill, #2d3e76); color: #fff }
.msr-cm { position: relative; display: block }
.msr-cm input { width: 100%; padding-right: 40px }
.msr-cm em { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-style: normal; font-size: 12px; opacity: .55; pointer-events: none }
.msr-rh { display: flex; align-items: center; justify-content: space-between; gap: 12px }
.msr-rem { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px }
.msr-rem li { display: flex; justify-content: space-between; gap: 10px; padding: 8px 12px; border-radius: 10px; background: var(--d-tint, #f6eef6); font-size: 14px }
.msr-rem button { opacity: .6 }
.msr-add { display: flex; gap: 8px; flex-wrap: wrap }
.msr-add input { flex: 1 1 220px }
.dpos-modal .pick-ov { z-index: 500 }
.msr-line { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap }
.msr-sum { font-size: 12px; color: var(--d-mut, #6f6b66); line-height: 1.5 }
@media (max-width: 560px) { .msr-two { grid-template-columns: 1fr } }

.inv-msr { display: block; margin-top: 4px; font-size: 11px; line-height: 1.5; color: #6f6b66 }

/* Product card buttons: soft pill edges */
.pcard-actions .pcard-quick, .pcard-quick, .pcard-add { border-radius: 999px }

/* Admin: Site text */
.st-fields { display: grid; gap: 14px; max-width: 760px }
.st-para { display: grid; gap: 4px; margin-bottom: 8px; justify-items: start } .st-para textarea { width: 100% }
.st-policy { display: grid; gap: 12px; max-width: 760px }
/* Admin: product editor tabs */
.pe-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--d-line, #dfdfec) }
.pe-tabs button { padding: 10px 14px; font-weight: 700; font-size: 13px; border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--d-mut, #6f6b66) }
.pe-tabs button.on { color: var(--d-ink, #121214); border-bottom-color: var(--d-bill, #2d3e76) }
.pe-check { display: flex; align-items: center; gap: 10px; font-weight: 600 }
.pe-cols { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px }
.pe-col { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid var(--d-line, #dfdfec); border-radius: 999px; background: #fff; font-weight: 600; font-size: 13px; cursor: pointer }
.pe-col.on { border-color: var(--d-bill, #2d3e76); background: var(--d-tint, #f6eef6) }
.pe-vars input { width: 100%; min-width: 70px; padding: 8px 10px }
.pe-acts { display: flex; gap: 6px; justify-content: flex-end; white-space: nowrap }
.pe-add { display: grid; grid-template-columns: repeat(4, minmax(80px, 1fr)) auto; gap: 8px }
@media (max-width: 640px) { .pe-add { grid-template-columns: 1fr 1fr } }
.adv-k small { display: block; margin-top: 4px; font-size: 12px; color: var(--d-mut, #6f6b66) }

.adm-note { margin: 8px 0 12px; padding: 12px 14px; border-radius: 12px; background: #eeeef6; border: 1px solid #f7ebd4; font-size: 14px }
.adm-pick-n { display: flex; align-items: center; gap: 10px; font-weight: 700 } .adm-pick-n img { object-fit: cover; border-radius: 8px; flex: none }
.dpos-warn { display: block; margin-top: 6px; color: #9a5b00; font-size: 12px; font-weight: 600 }

/* Payment split picker (advance deposit / balance) */
.payp { display: grid; gap: 10px }
.payp-split { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px }
.payp-split label { display: grid; gap: 4px; font-size: 12px; font-weight: 700 }
.payp-split p { grid-column: 1 / -1; margin: 0; font-size: 12px; font-weight: 700 }
.payp-ok { color: #1c7a4b } .payp-bad { color: #b3261e }
.adv-split { display: block; font-size: 11px; font-weight: 600; opacity: .7 }

/* Complete bill split-up (admin) */
.bsum { display: grid; gap: 2px; font-size: 14px }
.bsum > div { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0 }
.bsum small { font-size: 10px; letter-spacing: .08em; opacity: .55 }
.bsum-muted { font-size: 11px; letter-spacing: .08em; color: var(--d-mut, #6f6b66); border-top: 1px dashed var(--d-line, #dfdfec); margin-top: 4px }
.bsum-total { border-top: 2px solid var(--d-ink, #121214); border-bottom: 1px solid var(--d-line, #dfdfec); margin: 6px 0 4px; padding: 12px 0 !important; font-weight: 800; font-size: 17px }
.bsum-pay { font-weight: 700; margin-top: 4px }
.bsum-paysub { padding: 2px 0 2px 14px !important; font-size: 13px; color: var(--d-mut, #6f6b66) } .bsum-paysub b { font-weight: 600 }
.bsum-strong { font-weight: 800; color: var(--d-bill, #2d3e76); margin-top: 4px }
.dpos-xrow > td { background: var(--d-bg, #f6f4ef) !important; cursor: default }
.dpos-xsum { max-width: 460px; margin-left: auto; padding: 6px 4px }

.adv-kpis.five { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) }
.adv-kpis.five .adv-k b { font-size: 24px }

/* Smooth scrolling (Lenis) on the website */
html.lenis, html.lenis body { height: auto }
.lenis.lenis-smooth { scroll-behavior: auto !important }
.lenis.lenis-smooth [data-lenis-prevent], .lenis.lenis-smooth [role="dialog"] { overscroll-behavior: contain }
.lenis.lenis-stopped { overflow: clip }

/* Admin page header: title on the left, actions + View Store + profile on the right (no separate Dashboard bar) */
.dpos-head-r { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-left: auto }
.dpos-head-r .dpos-view { white-space: nowrap; padding: 8px 14px; border: 1px solid var(--d-line, #dfdfec); border-radius: 999px; background: var(--d-card, #fff) }


```

### `pos.css`
```css
/* Dhanya POS (admin only). Every selector is scoped to .dpos; this file is imported only by the lazily loaded POS page,
   so public pages never load it. Print rules apply only while body.dpos-printing is set (during an invoice print). */
.dpos { --ink: #121214; --paper: #f3f1ec; --d-ink: #121214; --d-mut: #6f6b66; --d-line: #dfdfec; --d-bg: #f3f1ec; --d-card: #fff; --d-ok: #1c7a4b; --d-bad: #b3261e;
  min-height: 100vh; padding: 24px clamp(12px, 2.5vw, 32px) 60px; background: var(--d-bg); color: var(--d-ink); font-family: var(--sans); display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 24px; align-items: start }
.dpos *, .dpos *::before, .dpos *::after { box-sizing: border-box }
.dpos h1, .dpos h2, .dpos h3 { font-family: var(--sans); font-weight: 800; letter-spacing: -.01em; margin: 0 }
.dpos h1, .dpos h2, .dpos h3 { text-transform: none }
.dpos h1 { font-size: clamp(26px, 3vw, 34px) } .dpos h2 { font-size: 17px } .dpos h3 { font-size: 15px }
.dpos .sub { color: var(--d-mut); font-size: 14px; margin-top: 2px }
.dpos .muted { color: var(--d-mut) } .dpos .small { font-size: 12px }

/* sidebar */
.dpos-side { position: sticky; top: 24px; background: var(--d-card); border-radius: 22px; padding: 14px; display: grid; gap: 4px; max-height: calc(100vh - 48px); overflow: auto }
.dpos-brand { display: flex; align-items: center; gap: 10px; padding: 8px 10px 14px; border-bottom: 1px solid var(--d-line); margin-bottom: 6px }
.dpos-brand b { font-size: 15px; letter-spacing: .16em; text-transform: uppercase } .dpos-brand i { font-style: normal; font-size: 10px; letter-spacing: .2em; color: var(--d-mut) }
.dpos-grp { font-size: 10px; letter-spacing: .24em; color: #aaa59d; font-weight: 800; padding: 14px 12px 4px }
.dpos-nav { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; font-size: 14px; font-weight: 700; color: #55524d; text-align: left; width: 100%; transition: background .15s }
.dpos-nav:hover { background: #f4f2ee } .dpos-nav.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-nav svg { flex: none }

/* top bar */
.dpos-top { display: flex; align-items: center; gap: 16px; background: var(--d-card); border-radius: 18px; padding: 10px 14px; border: 1px solid var(--d-line) }
.dpos-top-t { font-weight: 800; font-size: 17px; margin-right: auto; padding-left: 6px }
.dpos-view { font-size: 14px; font-weight: 600; color: #55524d } .dpos-view:hover { color: var(--d-ink) }
.dpos-av { width: 38px; height: 38px; border-radius: 50%; background: var(--d-acc, #1c284f); color: #fff; display: grid; place-items: center; font-weight: 800 }

/* existing admin content (products, storefront images, enquiries, sample data, settings) inherits the same look */
.dpos .adm, .dpos .settings-form { display: grid; gap: 16px }
.dpos .adm-help { max-width: none; margin: 0; color: var(--d-mut); font-size: 14px }
.dpos .adm-split > aside, .dpos .adm-split > div, .dpos .adm-slots > *, .dpos .adm-enq li, .dpos .adm-counts li { border-radius: 20px }
.dpos .adm-enq li { background: #fff; border: 1px solid var(--d-line) }
.dpos .adm-counts li { background: #fff; border: 1px solid var(--d-line) } .dpos .adm-counts strong { color: var(--d-ink); font-family: var(--sans); font-weight: 800 }
.dpos .btn { border-radius: 999px; padding: 12px 20px; font-size: 12px; font-weight: 800; letter-spacing: .12em; border: 1px solid var(--d-ink); color: var(--d-ink); background: #fff }
.dpos .btn:hover:not(:disabled) { background: var(--d-acc, #1c284f); color: #fff }
.dpos .btn.solid, .dpos .btn.dark.solid { background: var(--d-acc, #1c284f); color: #fff }
.dpos .field span { font-size: 11px; letter-spacing: .14em; font-weight: 800; color: var(--d-mut); opacity: 1 }
.dpos .field input, .dpos .field textarea, .dpos .field select { border-radius: 14px; border: 1px solid var(--d-line) }
.dpos .tbl { margin: 0 } .dpos .tbl th { font-size: 10px; letter-spacing: .16em; font-weight: 800; color: var(--d-mut); opacity: 1 } .dpos .tbl th, .dpos .tbl td { border-bottom: 1px solid #e5e4f0 }
.dpos .err { background: #fdecea; color: var(--d-bad); padding: 10px 14px; border-radius: 12px }
.dpos .link-u { text-decoration: underline }
.dpos .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px }
.dpos .muted { opacity: 1 }

/* cards, forms */
.dpos-main { display: grid; gap: 18px; min-width: 0 }
.dpos-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap }
.dpos-card { background: var(--d-card); border-radius: 22px; padding: 20px 22px; border: 1px solid var(--d-line) }
.dpos-card > h2 { display: flex; align-items: center; gap: 10px; margin-bottom: 14px }
.dpos label.f { display: grid; gap: 6px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; font-weight: 800; color: var(--d-mut) }
.dpos input, .dpos select, .dpos textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--d-line); border-radius: 14px; background: #fff; color: var(--d-ink); font: inherit; font-size: 14px; letter-spacing: 0; text-transform: none; font-weight: 500 }
.dpos input:focus, .dpos select:focus { outline: 2px solid var(--d-ink); outline-offset: 1px }
.dpos input[type=checkbox], .dpos input[type=radio] { width: auto }
.dpos-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) }
.dpos-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 999px; background: var(--d-acc, #1c284f); color: #fff; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; border: 1px solid var(--d-ink); transition: opacity .15s }
.dpos-btn:hover:not(:disabled) { opacity: .85 } .dpos-btn:disabled { opacity: .4; cursor: not-allowed }
.dpos-btn.ghost { background: #fff; color: var(--d-ink); border-color: var(--d-line) } .dpos-btn.ghost:hover:not(:disabled) { border-color: var(--d-ink); opacity: 1 }
.dpos-btn.danger { background: #fff; color: var(--d-bad); border-color: rgba(179, 38, 30, .4) }
.dpos-btn.big { width: 100%; padding: 17px; font-size: 14px }
.dpos-btn.sm { padding: 7px 13px; font-size: 11px }
.dpos-err { background: #fdecea; color: var(--d-bad); padding: 10px 14px; border-radius: 12px; font-size: 14px }
.dpos-ok { background: #e6f4ec; color: var(--d-ok); padding: 10px 14px; border-radius: 12px; font-size: 14px }
.dpos-empty { padding: 34px 10px; text-align: center; color: var(--d-mut) }
.dpos-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; background: #eee; color: #555 }
.dpos-pill.ok { background: #e6f4ec; color: var(--d-ok) } .dpos-pill.bad { background: #fdecea; color: var(--d-bad) } .dpos-pill.warn { background: #e5e4f1; color: #8a5a00 }

/* tables */
.dpos-tw { overflow-x: auto }
.dpos table { width: 100%; border-collapse: collapse; font-size: 14px }
.dpos th { text-align: left; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--d-mut); font-weight: 800; padding: 12px 10px; border-bottom: 1px solid var(--d-line); white-space: nowrap }
.dpos td { padding: 12px 10px; border-bottom: 1px solid #e5e4f0; vertical-align: middle }
.dpos td.r, .dpos th.r { text-align: right } .dpos tr.click { cursor: pointer } .dpos tr.click:hover td { background: #faf8f4 }
.dpos tr.voided td { opacity: .5; text-decoration: line-through }
.dpos td input, .dpos td select { padding: 8px 10px; border-radius: 10px }

/* billing layout */
.dpos-bill { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr); gap: 18px; align-items: start }
.dpos-col { display: grid; gap: 18px; min-width: 0 }
.dpos-sticky { position: sticky; top: 96px }
.dpos-results { display: grid; gap: 8px; margin-top: 12px; max-height: 340px; overflow: auto }
.dpos-res { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--d-line); border-radius: 14px; text-align: left; width: 100%; background: #fff }
.dpos-res:hover:not(:disabled) { border-color: var(--d-ink) } .dpos-res:disabled { opacity: .45; cursor: not-allowed }
.dpos-res img { width: 42px; height: 42px; object-fit: cover; border-radius: 10px; background: #eee; flex: none }
.dpos-res span { display: grid; flex: 1; min-width: 0 } .dpos-res b { font-size: 14px } .dpos-res em { font-style: normal; font-size: 12px; color: var(--d-mut) }
.dpos-line { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; padding: 12px 0; border-bottom: 1px solid #e5e4f0 }
.dpos-line:last-child { border-bottom: 0 }
.dpos-qty { display: inline-flex; align-items: center; border: 1px solid var(--d-line); border-radius: 999px; overflow: hidden }
.dpos-qty button { width: 32px; height: 32px; font-size: 18px; line-height: 1 } .dpos-qty button:hover { background: #f4f2ee }
.dpos-qty input { width: 54px; text-align: center; border: 0; border-radius: 0; padding: 6px 0 }
.dpos-sum { display: grid; gap: 8px; font-size: 14px } .dpos-sum div { display: flex; justify-content: space-between; gap: 12px }
.dpos-sum .tot { font-size: 22px; font-weight: 800; padding-top: 10px; border-top: 1px solid var(--d-line) }
.dpos-seg { display: flex; gap: 6px; flex-wrap: wrap }
.dpos-seg button { padding: 10px 16px; border-radius: 999px; border: 1px solid var(--d-line); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; background: #fff }
.dpos-seg button.on { background: var(--d-acc, #1c284f); color: #fff; border-color: var(--d-ink) }

/* analytics */
.dpos-kpis { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) }
.dpos-kpi { background: #fff; border-radius: 20px; padding: 18px 20px; border: 1px solid var(--d-line); display: grid; gap: 8px }
.dpos-kpi span { font-size: 10px; letter-spacing: .2em; font-weight: 800; color: var(--d-mut); text-transform: uppercase } .dpos-kpi b { font-size: 30px; line-height: 1 }
.dpos-bars { display: flex; align-items: flex-end; gap: 6px; height: 150px; padding-top: 8px; overflow-x: auto }
.dpos-bar { flex: 1 0 22px; max-width: 54px; display: grid; align-items: end; height: 100%; text-align: center; font-size: 10px; color: var(--d-mut) }
.dpos-bar i { display: block; background: var(--d-acc, #1c284f); border-radius: 6px 6px 0 0; min-height: 3px }

/* invoice modal */
.dpos-modal { position: fixed; inset: 0; z-index: 400; background: rgba(10, 10, 12, .55); display: grid; place-items: start center; padding: 24px 12px; overflow: auto }
.dpos-sheet { background: #fff; border-radius: 20px; width: min(560px, 100%); padding: 22px }
.dpos-invoice { font-size: 13px; color: #111; display: grid; gap: 10px }
.dpos-invoice h2 { font-size: 20px; text-align: center; letter-spacing: .12em; text-transform: uppercase }
.dpos-invoice .c { text-align: center; color: #555; font-size: 12px }
.dpos-invoice table th, .dpos-invoice table td { padding: 6px 4px; font-size: 12px }
.dpos-invoice hr { border: 0; border-top: 1px dashed #bbb; width: 100% }
.dpos-void-stamp { text-align: center; font-weight: 800; color: var(--d-bad); letter-spacing: .3em; border: 2px solid var(--d-bad); padding: 6px; border-radius: 8px }

@media (max-width: 1099px) { .dpos-bill { grid-template-columns: 1fr } .dpos-sticky { position: static } }
@media (max-width: 899px) {
  .dpos { grid-template-columns: 1fr; padding-top: 14px }
  .dpos-side { position: static; max-height: none; display: flex; flex-wrap: wrap; gap: 6px; padding: 10px } .dpos-brand, .dpos-grp { width: 100%; padding: 6px 8px }
  .dpos-nav { width: auto; padding: 9px 12px; font-size: 13px }
}

@media print {
  body.dpos-printing * { visibility: hidden !important }
  body.dpos-printing .dpos-invoice, body.dpos-printing .dpos-invoice * { visibility: visible !important }
  body.dpos-printing .dpos-invoice { position: absolute; left: 0; top: 0; width: 80mm; max-width: 100%; padding: 4mm; margin: 0 }
}

```

### `pos2.css`
```css
/* Dhanya POS / admin extras (filters, analytics cards, inventory, taxonomy, reels). Admin only, scoped to .dpos, loaded with the admin shell. */

/* ---- period / chip filters ---- */
.dpos-pf { display: flex; gap: 10px; flex-wrap: wrap; align-items: center }
.dpos-pg { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; background: #fff; border: 1px solid var(--d-line); border-radius: 999px; padding: 5px 6px; box-shadow: 0 2px 10px rgba(0, 0, 0, .04) }
.dpos-pg .lab { font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 0 8px 0 10px; color: var(--d-ink) }
.dpos-pg button { padding: 8px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--d-ink) }
.dpos-pg button:hover { background: #f4f2ee } .dpos-pg button.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-pg.dates { padding: 5px 12px; gap: 12px } .dpos-pg.dates label { display: inline-flex; align-items: center; gap: 4px }
.dpos-pg.dates input { border: 0; padding: 6px 2px; width: auto; font-weight: 700; background: transparent; border-radius: 0 }
.dpos-bar-tools { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between }

/* ---- switches, toggles ---- */
.dpos-switch { position: relative; width: 50px; height: 28px; border-radius: 999px; background: #d9d6d0; flex: none; transition: background .15s }
.dpos-switch::after { content: ''; position: absolute; left: 3px; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .3); transition: transform .15s }
.dpos-switch.on { background: #12a36b } .dpos-switch.on::after { transform: translateX(22px) }
.dpos-two { display: grid; grid-template-columns: 1fr 1fr; background: #fff; border: 1px solid var(--d-line); border-radius: 999px; padding: 4px; gap: 4px }
.dpos-two button { padding: 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase } .dpos-two button.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-src { display: inline-flex; background: #fff; border: 1px solid var(--d-line); border-radius: 999px; padding: 4px; gap: 2px; justify-self: end }
.dpos-src button { padding: 8px 16px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 8px } .dpos-src button.on { background: var(--d-acc, #1c284f); color: #fff }
.dpos-src i { width: 8px; height: 8px; border-radius: 50%; background: #12a36b; display: inline-block }

/* ---- analytics cards / charts ---- */
.dpos-tabs { display: flex; gap: 22px; border-bottom: 1px solid var(--d-line); flex-wrap: wrap }
.dpos-tabs button { padding: 12px 2px; font-size: 14px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #77736d; border-bottom: 3px solid transparent; margin-bottom: -1px } .dpos-tabs button.on { color: var(--d-ink); border-color: var(--d-ink) }
.dpos-k4 { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)) }
.dpos-card2 { background: #fff; border: 1px solid var(--d-line); border-radius: 22px; padding: 18px 20px; display: grid; gap: 14px; align-content: space-between; min-height: 130px }
.dpos-card2 .t { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase }
.dpos-card2 .ic { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #efecf3; flex: none }
.dpos-card2 .v { font-size: 30px; font-weight: 800; line-height: 1.1; letter-spacing: -.01em; overflow-wrap: anywhere } .dpos-card2 .v.txt { font-size: 20px }
.dpos-card2 .s { font-size: 12px; color: var(--d-mut) }
.dpos-card2.net { background: linear-gradient(135deg, #0a9a68, #0d1f1a); color: #fff; border: 0 } .dpos-card2.net .ic { background: rgba(255, 255, 255, .18) } .dpos-card2.net .s { color: rgba(255, 255, 255, .85) }
.dpos-card2.gstc { border-color: #d9d4e8 } .dpos-card2.nong { border-color: #bfe8d8 } .dpos-card2.nong .v { color: #0a8a5c } .dpos-card2.exp { border-color: #efc3b3 } .dpos-card2.exp .v { color: #b3261e }
.dpos-formula { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; justify-content: space-between; background: #fff; border: 1px solid var(--d-line); border-radius: 16px; padding: 12px 16px; font-size: 14px }
.dpos-formula b.tag { background: #e8e6fb; color: #3453b8; border-radius: 8px; padding: 4px 10px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase }
.dpos-formula .np { color: #0a8a5c; font-weight: 800; font-family: ui-monospace, monospace }
.dpos-split { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(280px, 1fr); gap: 18px; align-items: start } @media (max-width: 1099px) { .dpos-split { grid-template-columns: 1fr } }
.dpos-ch { display: flex; align-items: flex-end; gap: 6px; height: 190px; padding-top: 22px }
.dpos-ch .c { flex: 1; min-width: 0; display: grid; grid-template-rows: 1fr auto; height: 100%; text-align: center; font-size: 11px; font-weight: 800; color: #444; gap: 8px; position: relative }
.dpos-ch .c .col { display: flex; align-items: flex-end; justify-content: center; position: relative }
.dpos-ch .c .col i { display: block; width: min(30px, 70%); border-radius: 8px 8px 3px 3px; background: var(--d-acc, #1c284f); min-height: 4px }
.dpos-ch .c .col em { position: absolute; top: -18px; font-style: normal; font-size: 10px; white-space: nowrap }
.dpos-ch.cap .c .col { background: #f3f3f5; border-radius: 999px; width: 26px; margin: 0 auto } .dpos-ch.cap .c .col i { width: 100%; border-radius: 999px }
.dpos-bars2 { display: grid; gap: 14px }
.dpos-b2 { display: grid; grid-template-columns: 74px 1fr 40px; gap: 12px; align-items: center; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase } .dpos-b2 .tr { height: 12px; border-radius: 99px; background: #eef0f3; overflow: hidden } .dpos-b2 .tr i { display: block; height: 100%; border-radius: 99px; background: var(--d-acc, #1c284f) } .dpos-b2 .n { text-align: right }
.dpos-rank { display: grid; gap: 16px } .dpos-rk { display: grid; grid-template-columns: 22px 1fr auto; gap: 12px; align-items: center } .dpos-rk .tr { height: 8px; border-radius: 99px; background: #eef0f3; margin-top: 6px; overflow: hidden } .dpos-rk .tr i { display: block; height: 100%; background: var(--d-acc, #1c284f); border-radius: 99px }

/* ---- modal extras ---- */
.dpos-sheet.wide { width: min(640px, 100%) } .dpos-sheet h2.mh { margin-bottom: 14px }
.dpos-mhead { background: var(--d-acc, #1c284f); color: #fff; margin: -22px -22px 18px; padding: 18px 22px; border-radius: 20px 20px 0 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px } .dpos-mhead small { opacity: .7; display: block; font-size: 12px; margin-top: 2px }
.dpos-mhead button { color: #fff; width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 255, 255, .15); font-size: 16px }
.dpos-box { background: #f6f4f0; border: 1px solid var(--d-line); border-radius: 16px; padding: 14px 16px }
.dpos-types { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px }
.dpos-types button { display: grid; gap: 4px; justify-items: center; padding: 14px 8px; border-radius: 16px; border: 1px solid var(--d-line); background: #fff; font-size: 13px; font-weight: 800 } .dpos-types button small { font-size: 10px; font-weight: 800; letter-spacing: .06em } .dpos-types button.on { background: #f1efe9; border-color: var(--d-ink); box-shadow: inset 0 0 0 1px var(--d-ink) }
```

(End of part 2 of 4.)
