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

// ---- Per-site enhancement (header badges, empty states, stat count-up) driven by a site theme ----
function routeGlyph(txt) {
  const p = (location.hash + " " + location.pathname).toLowerCase(); const pick = [[/admin/, "shield"], [/plans/, "rocket"], [/account/, "user"], [/login/, "user"], [/lookup|search/, "search"], [/ticket|\/t\/|checkin/, "ticket"], [/by-mahmoud/, "link"], [/fav/, "heart"], [/calendar/, "calendar"], [/inbox|inq|mine\b.*inq/, "inbox"], [/board|\/b\/|ws|dash|mine/, "board"], [/\/l\//, "home"], [/\/s\//, "link"]];
  for (const [r, g] of pick) if (r.test(p)) return g;
  const host = location.hostname; return host.startsWith("stools") ? "link" : host.startsWith("real") ? "home" : host.startsWith("event") ? "ticket" : "board";
}
let scheduled = false; let THEME = {};
function enhance() {
  scheduled = false; const main = document.querySelector("main"); if (!main) return;
  const key = routeGlyph(); const T = THEME;
  const h1 = main.querySelector("h1");
  if (T.badge && h1 && !h1.dataset.fx && !h1.closest(".hero,.hero2,.evhero,.landing,.auth,.modal")) {
    h1.dataset.fx = "1"; h1.style.display = "flex"; h1.style.alignItems = "center"; h1.style.gap = "12px";
    const slot = document.createElement("span"); slot.className = "hbadge"; slot.innerHTML = T.badge(key, 44); h1.prepend(slot);
  }
  if (T.empty) main.querySelectorAll(".empty").forEach((e) => { if (e.dataset.fx) return; e.dataset.fx = "1"; const t = (e.textContent || "").toLowerCase(); const d = document.createElement("div"); d.className = "emptyart"; d.innerHTML = T.empty(/match|search|no results|\u0645\u0637\u0627\u0628\u0642/.test(t) ? "search" : key); e.prepend(d); e.style.textAlign = "center"; });
  main.querySelectorAll(".stat").forEach((e) => {
    if (e.dataset.fx) return; e.dataset.fx = "1"; const m = /^(\d[\d,]*)$/.exec(e.textContent.trim()); if (!m || reduced()) return; const end = +m[1].replace(/,/g, ""); if (!end || end > 1e7) return;
    const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 800); e.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString("en-US"); if (k < 1 && e.isConnected) requestAnimationFrame(step); else e.textContent = String(m[1]); }; e.textContent = "0"; requestAnimationFrame(step);
  });
  main.querySelectorAll(".plan,.card.tier,.stat").forEach((e) => { const c = e.closest(".card") || e; if (!c.dataset.fx2) { c.dataset.fx2 = "1"; c.classList.add("reveal"); if (T.tilt) tilt(c); } });
  reveal(main);
}
function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(enhance); } }
// theme: { badge(key,size)->html, empty(key)->html, tilt:bool, bar:bool }. Each site supplies its own so no visuals repeat across sites.
export function install(theme = {}) {
  THEME = theme; if (window.__fxInstalled) return; window.__fxInstalled = true;
  if (theme.bar) { const bar = document.createElement("div"); bar.className = "scrollbar"; bar.setAttribute("aria-hidden", "true"); document.body.append(bar); const upd = () => { const d = document.documentElement; const m = d.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(1, scrollY / m) : 0})`; }; addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); schedule();
}
