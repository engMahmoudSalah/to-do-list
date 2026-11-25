// Shared visual effects: canvas particles, wireframe 3D shapes, scroll reveal, tilt. Free, no assets, respects reduced motion.
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const col = (el, v) => getComputedStyle(el).getPropertyValue(v).trim() || "#7c3aed";
function loop(canvas, draw) {
  const ctx = canvas.getContext("2d"); let vis = true, raf = 0, w = 0, h = 0, t0 = performance.now();
  const fit = () => { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); w = Math.max(1, r.width); h = Math.max(1, r.height); canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  fit(); const ro = new ResizeObserver(() => { fit(); if (reduced()) draw(ctx, w, h, 0); }); ro.observe(canvas);
  const frame = (t) => { if (!canvas.isConnected) { ro.disconnect(); return; } if (vis && !document.hidden) { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, (t - t0) / 1000); } raf = requestAnimationFrame(frame); };
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; }).observe(canvas);
  if (reduced()) draw(ctx, w, h, 0); else raf = requestAnimationFrame(frame);
}
export function particles(canvas, n = 46) {
  const pts = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00006, vy: (Math.random() - .5) * .00006 }));
  loop(canvas, (c, w, h) => {
    const k = col(canvas, "--accent"); c.fillStyle = k; c.strokeStyle = k;
    for (const p of pts) { p.x = (p.x + p.vx * 16 + 1) % 1; p.y = (p.y + p.vy * 16 + 1) % 1; }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]; c.globalAlpha = .55; c.beginPath(); c.arc(a.x * w, a.y * h, 2, 0, 7); c.fill();
      for (let j = i + 1; j < pts.length; j++) { const b = pts[j], d = Math.hypot((a.x - b.x) * w, (a.y - b.y) * h); if (d < 120) { c.globalAlpha = (1 - d / 120) * .3; c.lineWidth = 1; c.beginPath(); c.moveTo(a.x * w, a.y * h); c.lineTo(b.x * w, b.y * h); c.stroke(); } }
    }
    c.globalAlpha = 1;
  });
}
const SHAPES = (() => {
  const p = (1 + Math.sqrt(5)) / 2; const iv = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
  const auto = (v, max) => { const e = []; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (Math.hypot(...v[i].map((x, k) => x - v[j][k])) < max) e.push([i, j]); return e; };
  const ico = { v: iv, e: auto(iv, 2.1) };
  const cube = { v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], e: [] }; cube.e = auto(cube.v, 2.1);
  const house = { v: [[-1, -.2, -.8], [1, -.2, -.8], [1, -1.1, -.8], [-1, -1.1, -.8], [-1, -.2, .8], [1, -.2, .8], [1, -1.1, .8], [-1, -1.1, .8], [0, .9, -.8], [0, .9, .8]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [0, 8], [1, 8], [4, 9], [5, 9], [8, 9]] };
  const ring = { v: [], e: [] }; const N = 24; for (let r = 0; r < 3; r++) for (let i = 0; i < N; i++) { const a = (i / N) * 6.2832, R = 1 + r * .0; ring.v.push(r === 0 ? [Math.cos(a), Math.sin(a), 0] : r === 1 ? [Math.cos(a), 0, Math.sin(a)] : [0, Math.cos(a), Math.sin(a)]); ring.e.push([r * N + i, r * N + ((i + 1) % N)]); }
  return { ico, cube, house, ring };
})();
export function wire(canvas, shape = "ico") {
  const S = SHAPES[shape];
  loop(canvas, (c, w, h, t) => {
    const k = col(canvas, "--accent"), s = Math.min(w, h) * .21, ay = t * .5, ax = .5 + Math.sin(t * .4) * .3; c.strokeStyle = k; c.fillStyle = k; c.lineWidth = 1.6;
    const P = S.v.map(([x, y, z]) => { let X = x * Math.cos(ay) + z * Math.sin(ay), Z = -x * Math.sin(ay) + z * Math.cos(ay), Y = y * Math.cos(ax) - Z * Math.sin(ax); Z = y * Math.sin(ax) + Z * Math.cos(ax); const f = 3.2 / (3.2 - Z * .5); return [w / 2 + X * s * f, h / 2 + Y * s * f, Z]; });
    for (const [i, j] of S.e) { c.globalAlpha = .35 + ((P[i][2] + P[j][2]) / 2 + 1.5) * .18; c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[j][0], P[j][1]); c.stroke(); }
    c.globalAlpha = .9; for (const q of P) { c.beginPath(); c.arc(q[0], q[1], 2.4, 0, 7); c.fill(); } c.globalAlpha = 1;
  });
}
export function reveal(root = document) {
  const els = [...root.querySelectorAll(".reveal")]; if (reduced() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach((e, i) => { e.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms"; io.observe(e); });
}
export function tilt(el) {
  if (reduced()) return;
  el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`; });
  el.addEventListener("pointerleave", () => (el.style.transform = ""));
}
// hero with a canvas layer: art(kind) -> element to place behind/beside the content
export function canvasEl(kind, shape) { const c = document.createElement("canvas"); c.className = "fxc fx-" + kind; c.setAttribute("aria-hidden", "true"); queueMicrotask(() => requestAnimationFrame(() => (kind === "wire" ? wire(c, shape) : particles(c)))); return c; }

// ---- Auto-enhancement for every page: header badges, empty-state art, stat count-up, scroll progress, page transitions, ambient background ----
const G = {
  board: "M10 14h12v36H10zM26 14h12v24H26zM42 14h12v30H42z", calendar: "M10 16h44v36H10zM10 26h44M20 10v10M44 10v10M20 36h6M32 36h6M44 36h4M20 44h6M32 44h6",
  inbox: "M8 36l8-20h32l8 20v14H8zM8 36h16l4 6h8l4-6h16", link: "M26 38l12-12M22 30l-6 6a8 8 0 0012 12l6-6M42 34l6-6a8 8 0 00-12-12l-6 6",
  home: "M8 32L32 10l24 22M14 28v26h36V28M26 54V38h12v16", ticket: "M8 18h48v10a5 5 0 000 10v10H8V38a5 5 0 000-10zM40 18v6M40 30v4M40 40v8",
  shield: "M32 8l20 8v16c0 14-9 22-20 26C21 54 12 46 12 32V16zM24 32l6 6 10-12", rocket: "M32 8c10 6 14 18 10 32H22C18 26 22 14 32 8zM22 40l-8 8M42 40l8 8M28 48v8M36 48v8M32 26v.1",
  user: "M32 30a10 10 0 100-20 10 10 0 000 20zM12 56c0-12 8-18 20-18s20 6 20 18", heart: "M32 54S8 40 8 24a12 12 0 0124-4 12 12 0 0124 4c0 16-24 30-24 30z",
  search: "M28 46a18 18 0 100-36 18 18 0 000 36zM42 42l14 14", box: "M10 24l22-12 22 12v22L32 58 10 46zM10 24l22 12 22-12M32 36v22",
};
export const medallion = (glyph, size = 96) => `<span class="medal" style="width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 64 64" class="mg"><circle class="mr" cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 6" opacity=".55"/><g class="gl" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 12) scale(.62)"><path d="${G[glyph] || G.box}"/></g></svg></span>`;
function routeGlyph(txt) {
  const p = (location.hash + " " + location.pathname).toLowerCase(); const pick = [[/admin/, "shield"], [/plans/, "rocket"], [/account/, "user"], [/login/, "user"], [/lookup|search/, "search"], [/ticket|\/t\/|checkin/, "ticket"], [/by-mahmoud/, "link"], [/fav/, "heart"], [/calendar/, "calendar"], [/inbox|inq|mine\b.*inq/, "inbox"], [/board|\/b\/|ws|dash|mine/, "board"], [/\/l\//, "home"], [/\/s\//, "link"]];
  for (const [r, g] of pick) if (r.test(p)) return g;
  const host = location.hostname; return host.startsWith("stools") ? "link" : host.startsWith("real") ? "home" : host.startsWith("event") ? "ticket" : "board";
}
const WIREFOR = { admin: "cube", plans: "ring", account: "ico" };
let scheduled = false;
function enhance() {
  scheduled = false; const main = document.querySelector("main"); if (!main) return;
  const key = routeGlyph(); const hash = location.hash;
  const h1 = main.querySelector("h1");
  if (h1 && !h1.dataset.fx && !h1.closest(".hero,.hero2,.evhero,.landing,.auth,.modal")) {
    h1.dataset.fx = "1"; h1.style.display = "flex"; h1.style.alignItems = "center"; h1.style.gap = "12px";
    const w = Object.keys(WIREFOR).find((k) => hash.includes(k)); const slot = document.createElement("span"); slot.className = "hbadge";
    if (w) { slot.className += " hwire"; const c = document.createElement("canvas"); c.className = "fxc"; c.setAttribute("aria-hidden", "true"); slot.append(c); h1.prepend(slot); requestAnimationFrame(() => wire(c, WIREFOR[w])); }
    else { slot.innerHTML = medallion(key, 44); h1.prepend(slot); }
  }
  main.querySelectorAll(".empty").forEach((e) => { if (e.dataset.fx) return; e.dataset.fx = "1"; const t = (e.textContent || "").toLowerCase(); const g = /match|search|no results|مطابق/.test(t) ? "search" : /ticket/.test(t) ? "ticket" : /event|stash|link|collection/.test(t) ? key : key === "shield" ? "box" : key; const d = document.createElement("div"); d.className = "emptyart floaty"; d.innerHTML = medallion(g, 96); e.prepend(d); e.style.textAlign = "center"; });
  main.querySelectorAll(".stat").forEach((e) => {
    if (e.dataset.fx) return; e.dataset.fx = "1"; const m = /^(\d[\d,]*)$/.exec(e.textContent.trim()); if (!m || reduced()) return; const end = +m[1].replace(/,/g, ""); if (!end || end > 1e7) return;
    const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 800); e.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString("en-US"); if (k < 1 && e.isConnected) requestAnimationFrame(step); else e.textContent = String(m[1]); }; e.textContent = "0"; requestAnimationFrame(step);
  });
  const cards = [...main.querySelectorAll(".plan,.card.tier,.stat")].map((e) => e.closest(".card") || e); cards.forEach((c) => { if (!c.dataset.fx2) { c.dataset.fx2 = "1"; c.classList.add("reveal"); tilt(c); } });
  reveal(main);
}
function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(enhance); } }
export function install() {
  if (window.__fxInstalled) return; window.__fxInstalled = true;
  const bar = document.createElement("div"); bar.className = "scrollbar"; bar.setAttribute("aria-hidden", "true"); document.body.append(bar);
  const upd = () => { const d = document.documentElement; const m = d.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(1, scrollY / m) : 0})`; }; addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd);
  const bg = document.createElement("canvas"); bg.className = "ambient"; bg.setAttribute("aria-hidden", "true"); document.body.prepend(bg); particles(bg, 28);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); schedule();
}
install();
