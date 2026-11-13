# ADMIN UI ATTACHMENT — PART 4 OF 4
(Companion to ADMIN_UI_PROMPT_FOR_DHANYA.md. Do NOT start work until you have received all 4 parts. Parts are in order; a code block that continues in the next part is closed and reopened — join those pieces into one file/section when you copy.)

```css
.cpk-cancel { padding: 13px 26px; border-radius: 14px; border: 1px solid #d9d9cc; background: #fff; font-weight: 700 } .cpk-ok { padding: 13px 40px; border-radius: 14px; background: var(--d-acc, #1c284f); color: #fff; font-weight: 800 } .cpk-ok:disabled { opacity: .35 }

/* Measurements page */
.ms { display: grid; gap: 16px; max-width: 1280px; margin: 0 auto } .ms-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap } .ms-top h2 { margin: 0; font-size: 28px } .ms-top-a { display: flex; gap: 12px; flex-wrap: wrap; align-items: center }
.ms-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px } @media (max-width: 800px) { .ms-tiles { grid-template-columns: repeat(2, 1fr) } }
.ms-tile { text-align: left; padding: 16px 20px; border-radius: 18px; background: #fff; border: 2px solid transparent; box-shadow: 0 6px 20px -14px rgba(0, 0, 0, .35); display: grid; gap: 6px } .ms-tile small { font: 800 11px 'Poppins', sans-serif; letter-spacing: .14em; color: #55524d } .ms-tile b { font-size: 30px } .ms-tile.warn b { color: #d97706 } .ms-tile.ok b { color: #16a34a } .ms-tile.bad b { color: #dc2626 } .ms-tile.on { border-color: var(--d-acc, #1c284f) }
.ms-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px } @media (max-width: 800px) { .ms-filters { grid-template-columns: 1fr 1fr } }
.ms-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px } .ms-card { border-radius: 22px; background: #fff; border: 1px solid #e7e4de; overflow: hidden }
.ms-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 18px 24px; flex-wrap: wrap } .ms-who b { font-size: 18px; margin-right: 10px } .ms-who small { display: block; color: #77746d; margin-top: 4px }
.ms-inv { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #eef0f9; color: var(--d-acc, #1c284f); font: 800 12px 'Poppins', sans-serif; letter-spacing: .03em }
.ms-act { display: flex; align-items: center; gap: 10px } .ms-st { padding: 9px 16px; border-radius: 999px; font: 800 12px 'Poppins', sans-serif; letter-spacing: .06em; text-transform: uppercase; border: 1px solid } .ms-st.warn { background: #fff7e0; color: #b45309; border-color: #f4d58b } .ms-st.ok { background: #e3f4e8; color: #15803d; border-color: #b6e1c3 } .ms-st.bad { background: #fde8e8; color: #b91c1c; border-color: #f3b8b8 }
.ms-chev { width: 38px; height: 38px; border-radius: 10px; font-size: 20px; color: #55524d }
.ms-body { padding: 0 24px 22px; display: grid; gap: 14px; background: #faf8f6; border-top: 1px solid #eee } .ms-addr { margin: 14px 0 0; color: #6d6a64; font-size: 14px }
.ms-line { padding: 18px 20px; border-radius: 16px; background: #fff; border: 1px solid #e7e4de; display: grid; gap: 14px } .ms-line-h { display: flex; justify-content: space-between; font-size: 18px }
.ms-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px } .ms-spec small { display: block; font: 700 11px 'Poppins', sans-serif; letter-spacing: .1em; color: #8a867f } .ms-spec b { display: flex; align-items: center; gap: 8px; font-size: 16px } .ms-ic svg { width: 30px; height: 22px; color: var(--d-acc, #1c284f) }
.ms-cm { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px } .ms-cm > div { padding: 12px 16px; border-radius: 14px; background: #eef0f9; border: 1px solid #d6dbee } .ms-cm small { display: block; font: 700 11px 'Poppins', sans-serif; letter-spacing: .1em; color: #6b7390 } .ms-cm b { font-size: 22px }
.ms-rem small { font: 800 12px 'Poppins', sans-serif; letter-spacing: .1em } .ms-rem ul { margin: 6px 0 0; padding-left: 18px; line-height: 1.7 }

/* ======== Admin scale and proportions (final): the exact type sizes of the reference admin, roomy padding ======== */
.dpos { --z: .9; zoom: var(--z); min-height: calc(100vh / var(--z)); width: 100%; max-width: 1760px; margin-left: auto; margin-right: auto; gap: 22px; padding: 18px clamp(10px, 1.4vw, 26px) 16px; font-size: 14.5px; line-height: 1.4 }
@media (min-width: 900px) { .dpos { grid-template-columns: 262px minmax(0, 1fr) } }
.dpos-side { max-height: calc((100vh - 36px) / var(--z)); padding: 12px; gap: 3px; top: 18px }
.dpos-main { gap: 18px; min-height: calc(100vh / var(--z) - 36px) }
.dpos-brand img { max-width: 150px } .dpos-brand { padding: 4px 8px 10px }
.dpos-nav { padding: 13px 16px; gap: 14px; border-radius: 14px; font-size: 15px; font-weight: 500; line-height: 1.25 }
.dpos-nav.on { font-weight: 600 }
.dpos-grp, .dpos-side [class*="grp"] { font-size: 10.5px }
.dpos-top-t { font-size: 17px }
.dpos-head h1 { font-size: 27px; line-height: 1.1; margin: 0 } .dpos-head .sub { font-size: 14px; margin-top: 3px }
.dpos .dpos-head h2, .dpos-main > .dpos-card > h2 { font-size: 17px; margin: 0 0 12px }
.dpos .dpos-card { padding: 20px 24px; border-radius: 22px }
.dpos table { font-size: 14px }
.dpos th { font-size: 10.5px; padding: 13px 16px }
.dpos td { padding: 15px 16px }
.dpos input:not([type=checkbox]):not([type=radio]), .dpos select, .dpos textarea { font-size: 14.5px; padding: 12px 15px; border-radius: 12px }
.dpos td input, .dpos td select { padding: 8px 11px }
.dpos label.f, .dpos .cp-l, .dpos .pe-l { font-size: 11.5px; letter-spacing: .1em }
.dpos label.f { gap: 7px }
.dpos-btn { font-size: 13.5px; padding: 10px 17px }
.dpos-tabs { gap: 26px } .dpos-tabs button { font-size: 13px; padding: 13px 3px }
.dpos .dpos-card2 { padding: 18px 22px; gap: 8px; border-radius: 20px } .dpos .dpos-card2 .t { font-size: 11px } .dpos .dpos-card2 .v { font-size: 27px } .dpos .dpos-card2 .v.txt { font-size: 18px } .dpos .dpos-card2 .s { font-size: 12px }
.dpos .cost-card { padding: 20px 24px } .dpos .cost-card b { font-size: 30px }
.dpos-k4 { gap: 14px }
.dpos-foot { font-size: 11.5px; padding-top: 14px; padding-bottom: 14px }
.dpos-pills button, .dpos-two button, .adv-modes button { font-size: 12px }
.dpos-ledger, .dpos-lrow { font-size: 14.5px }
.dpos-cta { font-size: 14.5px; padding: 15px }
@media (max-width: 899px) { .dpos { zoom: 1; min-height: 100vh; grid-template-columns: 1fr; font-size: 14px; gap: 12px; padding: 12px 12px 96px } .dpos-side { max-height: none; position: static } .dpos-main { min-height: 0; gap: 14px } .dpos-head h1 { font-size: 22px } .dpos-foot { justify-content: center; text-align: center; margin: 14px 0 0 } }
.cp, .ms { max-width: none; margin: 0 }
.cp-l { display: block } .cp-l > input, .cp-l > select { display: block; width: 100%; margin-top: 6px } .cp-l em { margin-left: 4px }
.inv-filters select { width: auto; min-width: 210px }
.an-head { margin-bottom: 0 } .an-period { padding: 4px 6px 4px 8px }
.an-bar { margin: 0 }
.dpos-pills button, .adv-modes button { white-space: nowrap; padding-left: 6px; padding-right: 6px; font-size: 12px; letter-spacing: .06em }

/* Add Product: media gallery, variant rows */
.pe-mg { display: flex; justify-content: space-between; align-items: center; margin-top: 10px } .pe-up { font-weight: 800; font-size: 16px; padding: 4px 6px }
.pe-gal { display: flex; flex-wrap: wrap; gap: 12px }
.pe-tile { position: relative; width: 104px; height: 104px; border-radius: 14px; overflow: hidden; background: #f3f1ec; border: 1px solid #e4e1db; display: grid; place-items: center } .pe-tile img { width: 100%; height: 100%; object-fit: cover; display: block }
.pe-tile.add { border: 1.5px dashed #cfcac2; background: #fafafa; font-size: 28px; color: #8a867f; cursor: pointer }
.pe-primary { position: absolute; top: 0; left: 0; right: 0; padding: 3px 0; background: rgba(20, 20, 20, .82); color: #fff; font: 800 10px 'Poppins', sans-serif; letter-spacing: .08em; text-align: center }
.pe-tile > button:not(.add) { position: absolute; top: 4px; right: 4px; width: 26px; height: 26px; border-radius: 50%; background: rgba(255, 255, 255, .92); font-size: 13px }
.pe-vh { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px }
.pe-vhead, .pe-vrow { display: grid; grid-template-columns: 1.2fr 1.2fr .9fr .9fr .8fr 40px; gap: 10px; align-items: center }
.pe-vhead { padding: 0 14px; font: 800 12px 'Poppins', sans-serif; letter-spacing: .1em; color: #8a867f }
.pe-vrow { padding: 10px 14px; border-radius: 16px; background: #fff; box-shadow: 0 6px 18px -12px rgba(0, 0, 0, .3) } .pe-vrow input { width: 100% }
.pe-vdel { width: 36px; height: 36px; border-radius: 10px; color: #8a867f; font-size: 17px } .pe-vdel:disabled { opacity: .3 }
@media (max-width: 700px) { .pe-vhead { display: none } .pe-vrow { grid-template-columns: 1fr 1fr } }

/* Online orders as cards */
.oo-count { margin: 4px 2px; color: #6d6a64; font-size: 16px }
.oo-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px }
.oo-card { background: #fff; border-radius: 18px; padding: 16px 20px 14px; border: 1px solid rgba(0, 0, 0, .05); box-shadow: 0 8px 22px -18px rgba(0, 0, 0, .35) }
.oo-top { display: flex; justify-content: space-between; align-items: center; gap: 12px } .oo-id { display: flex; align-items: center; gap: 10px; flex-wrap: wrap } .oo-id b { font-size: 19px }
.oo-tag { padding: 3px 12px; border-radius: 999px; border: 1px solid #9fe3c4; background: #effcf6; color: #0c8a5a; font: 800 12px 'Poppins', sans-serif; letter-spacing: .04em }
.oo-amt { display: flex; align-items: center; gap: 10px } .oo-amt b { font-size: 19px }
.oo-name { margin: 6px 0 0; font-size: 19px; font-weight: 700 } .oo-meta { margin: 2px 0 0; color: #8a867f; font-size: 15.5px }
.oo-foot { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee }
.oo-st { padding: 7px 14px; border-radius: 10px; border: 1px solid #cfd6e6; background: #f3f5fb; color: #2d3e76; font: 800 13px 'Poppins', sans-serif; letter-spacing: .05em; text-transform: uppercase; width: auto }
.oo-st.st-shipped, .oo-st.st-delivered { background: #e9fbf2; border-color: #a6e6c7; color: #0c8a5a } .oo-st.st-cancelled { background: #fdecec; border-color: #f3b8b8; color: #b91c1c } .oo-st.st-packed { background: #fff7e0; border-color: #f4d58b; color: #a16207 }
.inv-edited { margin: -6px 0 8px; font: 700 10.5px Arial, sans-serif; letter-spacing: .12em; color: #b45309 }
/* wide admin windows (Edit / Add product, Edit invoice, Return items) */
.dpos-sheet.wide { width: min(1000px, 96vw); max-width: none }
.dpos-sheet.pe-wide { width: min(1160px, 96vw); max-width: none }
.dpos-head h1 { font-size: 24px }
.dpos-btn.sm, .dpos-head .dpos-btn { font-size: 11.5px; padding: 8px 13px; letter-spacing: .05em; white-space: nowrap }

/* Stitching pages */
.sd { display: grid; gap: 14px; max-width: none }
.sd-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px } @media (max-width: 899px) { .sd-two { grid-template-columns: 1fr } }
.sd-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px } .sd-list li button { width: 100%; display: grid; grid-template-columns: 150px minmax(0, 1fr) auto; gap: 12px; align-items: center; text-align: left; padding: 11px 14px; border-radius: 14px; background: #faf8f6; border: 1px solid #eee } .sd-list li.late button { background: #fff6f6; border-color: #f3c9c9 }
.sd-list li button:hover { border-color: var(--d-acc, #1c284f) } .sd-w { display: grid; min-width: 0 } .sd-w b, .sd-w small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .sd-w small { color: #8a867f } .sd-n { font: 700 12px ui-monospace, Consolas, monospace; color: #55524d; text-align: right } .sd-n i { display: block; font-style: normal; color: #b45309; font: 800 10px 'Poppins', sans-serif; letter-spacing: .08em }
@media (max-width: 640px) { .sd-list li button { grid-template-columns: 1fr; gap: 4px } .sd-n { text-align: left } }
.sd-due { font-weight: 700 } .sd-due.late { color: #b91c1c } .sd-due.now { color: #b45309 } .sd-adv { margin-left: 8px; padding: 2px 8px; border-radius: 6px; background: #fff3d6; color: #b45309; font: 800 10px 'Poppins', sans-serif; letter-spacing: .08em } .sd-bal { color: #b45309 }
.sr-rank { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px } .sr-rank li { display: grid; gap: 6px } .sr-rank li > div { display: flex; justify-content: space-between; gap: 10px } .sr-rank li span { color: #6d6a64 }
.sr-rank li > i { display: block; height: 8px; border-radius: 999px; background: var(--d-acc, #1c284f); opacity: .85 } .sr-rank.st li.warn > i { background: #f59e0b } .sr-rank.st li.ok > i { background: #16a34a } .sr-rank.st li.bad > i { background: #dc2626 }
.sr-days { display: flex; align-items: flex-end; gap: 6px; height: 190px; overflow-x: auto; padding-bottom: 4px } .sr-days > div { flex: 1 0 34px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px } .sr-days i { display: block; width: 100%; max-width: 38px; border-radius: 8px 8px 0 0; background: var(--d-acc, #1c284f) } .sr-days span { font-size: 10.5px; color: #8a867f }
@media (max-width: 899px) {
  .dpos-foot { position: static; box-shadow: none; margin: 14px 0 0 }
  .an-head { display: block } .an-period { border-radius: 18px; width: 100%; padding: 4px } .an-period .dpos-pf, .an-period > * { max-width: 100% }
  .ms-top, .ms-top-a { width: 100% } .ms-top-a { justify-content: flex-start }
  .oh-chips, .oh-chips > div { width: 100% }
}

/* Compact filters: tabs + period on one row; channel and payment bars side by side; dates only behind "Custom" */
.an-top { display: flex; justify-content: space-between; align-items: center; gap: 10px 18px; flex-wrap: wrap; border-bottom: 1px solid var(--d-line, #e5e4e0) } .an-top .dpos-tabs { border-bottom: 0 }
.an-bars { display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch } .an-bars .an-chan { flex: 1 1 520px } .an-bars .an-pay { flex: 1 1 460px }
.dpos-pg .dates { display: inline-flex; align-items: center; gap: 12px; padding: 0 8px 0 10px; margin-left: 4px; border-left: 1px solid var(--d-line, #e5e4e0) } .dpos-pg .dates label { display: inline-flex; align-items: center } .dpos-pg .dates input { border: 0; padding: 4px 2px; width: auto; font-weight: 700; background: transparent; font-size: 13.5px }
.an-top .dpos-pg { box-shadow: none }
.an-bar { gap: 2px; padding: 5px } .an-bar button { padding: 8px 13px } .an-bar > b { padding: 0 10px 0 8px } .an-gst { margin-left: auto }
.an-bars .an-chan { flex: 1.1 1 560px; flex-wrap: nowrap } .an-bars .an-pay { flex: 1 1 470px; flex-wrap: nowrap }
.an-gst .dpos-pg { padding: 3px } .an-gst .dpos-pg button { padding: 7px 11px }
.an-all { display:flex; flex-wrap:wrap; align-items:center; gap:6px 18px } .an-all .an-grp { display:flex; flex-wrap:wrap; align-items:center; gap:2px } .an-all .an-gst { margin-left:0 } .an-all .an-pay { margin-left:auto } .an-all .an-pay > b { padding:0 10px 0 8px }
@media (max-width:899px){ .an-all .an-pay { margin-left:0 } }
@media (min-width:900px){ .an-all { gap:4px 12px; flex-wrap:nowrap } .an-all button { padding:8px 9px } .an-all .an-gst .dpos-pg button { padding:7px 9px } .an-all .an-pay > b { padding:0 6px } }
@media (min-width:900px) and (max-width:1500px){ .an-all { flex-wrap:wrap } }

/* ---- admin content pages: fill the width, shorter inputs, no tall empty boxes ---- */
.adm { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 14px 16px; align-items: start }
.adm > p, .adm > .dpos-bar-tools, .adm > .adm-enq, .adm > .err { grid-column: 1 / -1 }
.adm .adm-block, .adm .adm-card, .adm .adm-panel { margin-top: 0; padding: 18px 22px; border-radius: 18px }
.adm .adm-block .f, .adm .adm-block .field { display: grid; gap: 6px; margin-top: 10px } .adm .adm-block input, .adm .adm-block textarea { width: 100%; max-width: none; padding: 9px 14px; border-radius: 12px }
.adm .adm-block textarea { min-height: 84px }
.adm-picks { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); gap: 8px }
.adm-picks .adm-pick { margin: 0 }
.adm-enq { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(min(100%, 430px), 1fr)); gap: 12px; list-style: none; padding: 0; margin: 0 }
.adm-enq > li { padding: 14px 18px; border-radius: 16px; display: grid; gap: 4px; align-content: start } .adm-enq > li p { margin: 0 }
.adm-enq select { width: auto; max-width: 170px; padding: 7px 12px; margin-top: 6px } .adm-enq .adm-del { justify-self: start }
.dpos-bar-tools input[type=search] { min-width: 220px }

/* inventory cards: every photo the same size, nothing clipped */
.inv-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); align-items: stretch }
.inv-card { min-width: 0; height: 100% } .inv-body { min-width: 0 }
.inv-photo { aspect-ratio: 3 / 4; height: auto } .inv-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover }
.inv-photo > span:first-child { position: absolute; inset: 0 }
.inv-badge, .inv-ic { z-index: 2 } .inv-ic button { width: 36px; height: 36px }
.inv-pr { display: flex; gap: 16px; margin-top: 6px; font-size: 13px; color: #6d6a64 } .inv-pr span { display: grid } .inv-pr b { color: #1a1a1a; font-size: 15px }
.inv-nm strong { white-space: nowrap }
.sg { margin-top: 18px; border-top: 1px solid rgba(0,0,0,.08); padding-top: 14px } .sg > input { width: 100%; max-width: 420px; margin-bottom: 12px }
.sg-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px } @media (max-width: 700px) { .sg-cols { grid-template-columns: 1fr } }
.sg-cols > div { border: 1px solid rgba(0,0,0,.1); border-radius: 14px; background: #faf9f6; overflow: hidden } .sg-h { margin: 0; padding: 10px 14px; font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #6d6a64; border-bottom: 1px solid rgba(0,0,0,.08) }
.sg-list { list-style: none; margin: 0; padding: 0; max-height: 300px; overflow: auto } .sg-none { padding: 40px 14px; text-align: center }
.sg-row { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-bottom: 1px solid rgba(0,0,0,.06) } .sg-row img, .sg-ph { width: 44px; height: 52px; object-fit: cover; border-radius: 8px; background: #e8e6e0; flex: none }
.sg-row > span { flex: 1; min-width: 0; display: grid } .sg-row b { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis } .sg-row small { color: #6d6a64 } .sg-row button { width: 32px; height: 32px; border-radius: 8px; font-size: 18px; color: #6d6a64 } .sg-row button:disabled { opacity: .3 }

/* inventory cards: nothing clipped, calmer type */
.inv-body { padding: 14px 16px 16px; gap: 3px }
.inv-nm { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 8px } .inv-nm b { min-width: 0; font-size: 15.5px } .inv-nm strong { font-size: 15.5px; white-space: nowrap }
.inv-body > small { font-size: 13.5px }
.inv-pr { gap: 22px; margin-top: 4px; font-size: 12px } .inv-pr b { font-size: 14px }
.inv-foot { flex-wrap: wrap; gap: 8px 12px; margin-top: 10px; font-size: 12.5px }
.inv-units { padding: 9px 14px; font-size: 14px; white-space: nowrap } .inv-foot > span { flex: 1 1 90px; min-width: 0 }
.inv-badge { font-size: 10.5px; padding: 5px 9px }

/* full names, no "…" */
.inv-nm b, .sg-row b { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere }
.inv-nm { align-items: start }
.pe-sug { padding: 0 clamp(14px, 2vw, 28px) 24px }


/* single-line cells in tables read as one family: same size, weights 500/600/700, accent only on the amount */
.dpos-ord td { font-size: 14px; line-height: 1.35; vertical-align: middle }
.dpos-ord td.oid { font-size: 13.5px; font-weight: 600 }
.dpos-ord td b { font-size: 14px; font-weight: 600 }
.dpos-ord td .small { font-size: 12px; font-weight: 400 }
.dpos-ord td.due { font-size: 14px; font-weight: 700; color: var(--d-acc, #1c284f) }
.dpos-ord td:nth-child(4) { font-weight: 500 }

/* Coupons: equal columns, light small-caps labels, soft grey fields, tiny superscript counts */
.cp-two { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) } @media (max-width: 1000px) { .cp-two { grid-template-columns: 1fr } }
.cp-card { padding: clamp(22px, 2.4vw, 34px); border-radius: 26px; gap: 16px }
.cp-card h3 { font-size: 24px; font-weight: 700 }
.cp-l { font: 500 11.5px 'Poppins', sans-serif; letter-spacing: .12em; color: #3a3730 } .cp-l em { color: var(--d-acc, #1c284f); margin-left: 4px }
.cp-l input, .cp-code input, .cp-search { background: #efeef2 }
.cp-code { background: #efeef2 }
.cp-type { background: #f4f3f6; padding: 5px; border: 1px solid #e6e4ea } .cp-type button { background: #fff; border-radius: 10px; padding: 10px 18px; font-weight: 700 } .cp-type button.on { background: var(--d-acc, #1c284f); color: #fff }
.cp-filters small { font-size: 9px; vertical-align: super; margin-left: 3px; opacity: .7 }
.cp-sw { background: #f4f3f6 }
.cp-go { border-radius: 14px; padding: 20px; letter-spacing: .06em }

/* Coupon rows: code + status, then the offer, then the "used" line, then the action buttons together, all left-aligned in one column */
.cp-list li { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "offer" "used" "act"; gap: 4px 0; align-items: start; justify-items: start }
.cp-list li .cp-r1 { grid-area: head }
.cp-list li .cp-d { grid-area: offer; margin: 0; padding: 0; background: none; border-radius: 0; font-size: 20px; display: block; text-align: left } .cp-list li .cp-d small { font-size: 14px }
.cp-list li .cp-u { grid-area: used; margin: 0; line-height: 1.4; text-align: left }
.cp-list li .cp-act { grid-area: act; grid-column: auto; grid-row: auto; margin: 8px 0 0; flex-wrap: wrap; justify-content: flex-start }

/* Desktop admin is drawn at 90% so it looks right at the browser's own 100% zoom (the portal-level barcode pop-ups follow it; phones stay at 100%) */
@media (min-width: 900px) { .bc-portal { zoom: .9 } }
```


(End of part 4 of 4. All parts received — now apply them as the prompt says.)
