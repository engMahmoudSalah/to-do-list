// Shared English/Arabic layer. Exact strings and patterns are translated in the DOM, confirm() and alert(). A topbar button toggles the language.
let D = {}, R = [];
export const isAr = () => document.documentElement.lang === "ar";
export function tr(s) {
  if (typeof s !== "string" || !s) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
  if (!core || !/[A-Za-z]/.test(core)) return s;
  const hit = D[core]; if (hit) return lead + hit + trail;
  for (const [re, fn] of R) { const m = core.match(re); if (m) return lead + fn(m, tr) + trail; }
  if (core.includes(" · ")) { const p = core.split(" · "), o = p.map((x) => tr(x)); if (o.some((x, i) => x !== p[i])) return lead + o.join(" · ") + trail; }
  return s;
}
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
function node(n) {
  if (n.nodeType === 3) { const p = n.parentNode; if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return; const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
  if (n.nodeType !== 1) return;
  if (n.nodeName === "INPUT" && /^(button|submit)$/.test(n.type)) { const v = tr(n.value); if (v !== n.value) n.value = v; }
  for (const a of ATTRS) if (n.hasAttribute(a)) { const v = tr(n.getAttribute(a)); if (v !== n.getAttribute(a)) n.setAttribute(a, v); }
  for (const c of n.childNodes) node(c);
}
function langBtn() {
  const bar = document.querySelector(".topbar .in"); if (!bar || bar.querySelector(".langbtn")) return;
  const b = document.createElement("button"); b.className = "btn sm langbtn"; b.type = "button";
  b.textContent = isAr() ? "EN" : "عربي"; b.setAttribute("aria-label", isAr() ? "English" : "العربية"); b.lang = isAr() ? "en" : "ar";
  b.onclick = () => { localStorage.setItem("lang", isAr() ? "en" : "ar"); location.reload(); };
  const t = [...bar.children].find((c) => /theme|dark|الوضع/i.test(c.getAttribute("aria-label") || "")); bar.insertBefore(b, t || null);
}
export function setup(dict, rules, root = document.body) {
  D = dict; R = rules || [];
  let l = localStorage.getItem("lang"); if (!l) l = /^ar/i.test(navigator.language || "") ? "ar" : "en";
  document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  let q = false; const run = () => { if (q) return; q = true; queueMicrotask(() => { q = false; if (isAr()) node(root); langBtn(); }); };
  if (isAr()) { const oc = window.confirm.bind(window); window.confirm = (m) => oc(tr(m)); const oa = window.alert.bind(window); window.alert = (m) => oa(tr(m)); }
  new MutationObserver(run).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  run();
}
