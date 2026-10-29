import { useEffect, useRef } from 'react';
import { useFinePointer, useReduced } from '../lib/hooks';

// Homepage depth effects, without React re-renders:
// 1. Cards tilt in 3D toward the pointer with a soft light glare (mouse/trackpad only).
// 2. Silk ribbon, diamond and sparkle ornaments float behind the sections and drift at their own speed while scrolling.
const TILT = '.nt-photo, .nk-card, .nr-card, .ns-item, .ni-tile:not(.is-empty), .ne-arch, .ny-photo, .nq-card';
const BIG = 700; // wide panels tilt less

// A length of silk ribbon: three flowing strands with a soft fill between them.
const Silk = () => (
  <svg viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
    <path d="M4 84C40 30 74 110 108 58S168 18 196 44" />
    <path d="M4 96C42 44 78 120 110 70S170 30 196 58" opacity=".7" />
    <path d="M4 108C44 58 82 128 112 82S172 42 196 72" opacity=".45" />
    <path d="M4 84C40 30 74 110 108 58S168 18 196 44L196 72C172 42 140 36 112 82S44 58 4 108Z" fill="currentColor" fillOpacity=".06" stroke="none" />
  </svg>
);
const Ring = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth=".7">
    <path d="M32 4 60 32 32 60 4 32Z" /><path d="M32 16 48 32 32 48 16 32Z" opacity=".7" /><path d="M32 26 38 32 32 38 26 32Z" fill="currentColor" fillOpacity=".4" />
  </svg>
);

// [kind, top %, left or right, size px, parallax speed, extra class]
const ORNAMENTS = [
  ['silk', 9, 'r:-4%', 300, 0.22, ''], ['ring', 14, 'l:5%', 90, -0.12, 'spin'], ['spark', 17, 'l:46%', 14, 0.3, ''],
  ['silk', 24, 'l:-6%', 260, 0.16, 'flip'], ['ring', 31, 'r:7%', 120, -0.18, 'spin rev'], ['spark', 36, 'r:30%', 10, 0.4, ''],
  ['silk', 44, 'r:-5%', 340, 0.2, ''], ['spark', 49, 'l:12%', 16, 0.34, ''], ['ring', 55, 'l:3%', 100, -0.1, 'spin'],
  ['silk', 63, 'l:-5%', 280, 0.18, 'flip'], ['spark', 68, 'r:18%', 12, 0.38, ''], ['ring', 74, 'r:4%', 130, -0.16, 'spin rev'],
  ['silk', 82, 'r:-6%', 300, 0.2, ''], ['spark', 88, 'l:24%', 14, 0.3, ''], ['ring', 93, 'l:6%', 80, -0.12, 'spin'],
];

export default function HomeFx() {
  const fine = useFinePointer(), reduced = useReduced();
  const layer = useRef();

  // ---- 3D tilt + glare (event delegation, so cards that load later work too) ----
  useEffect(() => {
    if (!fine || reduced) return;
    const live = new Map(); // element -> { x, y, tx, ty, g }
    let raf = 0;
    const loop = () => {
      raf = 0;
      for (const [el, s] of live) {
        s.x += (s.tx - s.x) * 0.14; s.y += (s.ty - s.y) * 0.14; s.g += ((s.on ? 1 : 0) - s.g) * 0.14;
        const max = el.offsetWidth > BIG ? 3 : 9;
        const deg = Math.hypot(s.x, s.y) * max;
        el.style.rotate = deg > 0.01 ? `${(-s.y).toFixed(4)} ${s.x.toFixed(4)} 0 ${deg.toFixed(3)}deg` : '';
        el.style.translate = s.g > 0.01 ? `0 ${(-8 * s.g).toFixed(2)}px` : '';
        el.style.setProperty('--go', s.g.toFixed(3));
        if (!s.on && Math.abs(s.x) < 0.002 && Math.abs(s.y) < 0.002 && s.g < 0.01) { el.style.rotate = ''; el.style.translate = ''; el.classList.remove('fx-on'); live.delete(el) }
      }
      if (live.size) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop) };
    let current = null;
    const leave = el => { const s = live.get(el); if (s) { s.tx = 0; s.ty = 0; s.on = false; kick() } };
    const onMove = e => {
      const el = e.target.closest?.(TILT);
      if (current && current !== el) leave(current);
      current = el;
      if (!el || !el.closest('.home')) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      if (!el.querySelector(':scope > .fx-glare')) { const g = document.createElement('span'); g.className = 'fx-glare'; g.setAttribute('aria-hidden', 'true'); el.appendChild(g) }
      el.classList.add('fx-on');
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      const s = live.get(el) || { x: 0, y: 0, g: 0 };
      s.tx = (px - 0.5) * 2; s.ty = (py - 0.5) * 2; s.on = true; live.set(el, s); kick();
    };
    const onOut = e => { if (current && !e.relatedTarget?.closest?.(TILT)) { leave(current); current = null } };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerout', onOut);
      cancelAnimationFrame(raf);
      for (const el of live.keys()) { el.style.rotate = ''; el.style.translate = ''; el.classList.remove('fx-on') }
    };
  }, [fine, reduced]);

  // ---- parallax ornaments ----
  useEffect(() => {
    const root = layer.current; if (!root || reduced) return;
    const items = [...root.children];
    let tops = [], raf = 0;
    const measure = () => { tops = items.map(el => el.offsetTop + el.offsetHeight / 2) };
    const paint = () => {
      raf = 0;
      const base = root.getBoundingClientRect().top + scrollY, mid = scrollY + innerHeight / 2;
      items.forEach((el, i) => {
        const d = mid - (base + tops[i]);
        if (Math.abs(d) > innerHeight * 1.6) return;
        el.style.translate = `0 ${(d * +el.dataset.speed).toFixed(1)}px`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) };
    measure(); paint();
    const ro = new ResizeObserver(() => { measure(); onScroll() }); ro.observe(root);
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); ro.disconnect(); cancelAnimationFrame(raf) };
  }, [reduced]);

  return (
    <div className="fx-orn" ref={layer} aria-hidden="true">
      {ORNAMENTS.map(([kind, top, side, size, speed, cls], i) => {
        const [k, v] = side.split(':');
        return (
          <span key={i} className={`fx-${kind} ${cls}`} data-speed={speed}
            style={{ top: `${top}%`, [k === 'l' ? 'left' : 'right']: v, width: size, height: kind === 'silk' ? size * 0.6 : size }}>
            {kind === 'silk' ? <Silk /> : kind === 'ring' ? <Ring /> : null}
          </span>
        );
      })}
    </div>
  );
}
