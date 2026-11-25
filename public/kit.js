let DICT = {};
export const setDict = (d) => { DICT = d; };
export const t = (k) => DICT[k] || k;
export const dir = (d) => { document.documentElement.dir = d; };
export const $ = (s, r = document) => r.querySelector(s);
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "value") e.value = v;
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
export async function api(path, body, method) {
  const opt = { method: method || (body ? "POST" : "GET"), headers: {}, credentials: "same-origin" };
  if (body) { opt.headers["content-type"] = "application/json"; opt.body = JSON.stringify(body); }
  let r;
  try { r = await fetch(path, opt); } catch { throw new Error(t("No connection. Check your internet and try again.")); }
  let d = null;
  try { d = await r.json(); } catch { /* not json */ }
  if (!r.ok) { const e = new Error(t((d && d.error) || `Server error (${r.status}). Please try again.`)); e.status = r.status; throw e; }
  return d;
}
export function toast(msg, err) {
  const t = h("div", { class: "toast" + (err ? " err" : ""), role: "status" }, msg);
  document.body.append(t); setTimeout(() => t.remove(), 3500);
}
export async function guard(fn, btn) {
  if (btn) btn.disabled = true;
  try { return await fn(); } catch (e) { toast(e.message, true); } finally { if (btn) btn.disabled = false; }
}
export function modal(title, content, opts = {}) {
  const bg = h("div", { class: "modal-bg", onclick: (e) => e.target === bg && close() });
  const close = () => { bg.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e) => e.key === "Escape" && close();
  document.addEventListener("keydown", esc);
  const m = h("div", { class: "modal" + (opts.wide ? " wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
    h("div", { class: "row spread" }, h("h2", {}, title), h("button", { class: "btn ghost sm", "aria-label": t("Close"), onclick: close }, "✕")), content);
  bg.append(m); document.body.append(bg);
  const f = m.querySelector("input,textarea,select"); if (f) f.focus();
  return { close, el: m };
}
export const fmtDate = (t) => t ? new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
export const fmtTime = (t) => t ? new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
export function ago(t) {
  const s = Math.max(1, (Date.now() - t) / 1000);
  if (s < 90) return "just now"; if (s < 5400) return Math.round(s / 60) + " min ago";
  if (s < 129600) return Math.round(s / 3600) + " h ago"; return Math.round(s / 86400) + " d ago";
}
export function initTheme() {
  const set = (t) => { document.documentElement.dataset.theme = t; localStorage.setItem("theme", t); };
  set(localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  return () => set(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}
// field helper
export function field(label, input, hint) {
  const id = "f" + Math.random().toString(36).slice(2, 8); input.id = id;
  return h("div", {}, h("label", { for: id }, label), input, hint ? h("div", { class: "small muted" }, hint) : null);
}
export function authForm(onAuthed, opts = {}) {
  let mode = "login";
  const box = h("div", { class: "card auth stack" });
  const render = () => {
    box.innerHTML = "";
    const email = h("input", { type: "email", autocomplete: "email", required: true, placeholder: t("you@example.com") });
    const name = h("input", { type: "text", autocomplete: "name", placeholder: t("Your name"), maxlength: 60 });
    const pw = h("input", { type: "password", autocomplete: mode === "login" ? "current-password" : "new-password", placeholder: mode === "login" ? t("Password") : t("At least 8 characters") });
    const err = h("div", { class: "err", role: "alert" });
    const btn = h("button", { class: "btn pri", type: "submit" }, mode === "login" ? t("Log in") : t("Create account"));
    const form = h("form", { class: "stack", novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.textContent = "";
      if (!email.value.trim()) return (err.textContent = t("Enter your email."));
      if (!pw.value) return (err.textContent = t("Enter your password."));
      btn.disabled = true;
      try {
        const d = await api("/api/auth/" + (mode === "login" ? "login" : "register"), { email: email.value, password: pw.value, name: name.value });
        onAuthed(d.user);
      } catch (x) { err.textContent = x.message; } finally { btn.disabled = false; }
    } },
      mode === "signup" ? field(t("Name"), name) : null, field(t("Email"), email), field(t("Password"), pw), err, btn);
    box.append(h("h2", {}, opts.title || (mode === "login" ? t("Welcome back") : t("Create your account"))), opts.sub ? h("p", { class: "muted" }, opts.sub) : null, form,
      h("p", { class: "small muted" }, mode === "login" ? t("New here? ") : t("Already have an account? "),
        h("a", { href: "#", onclick: (e) => { e.preventDefault(); mode = mode === "login" ? "signup" : "login"; render(); } }, mode === "login" ? t("Create an account") : t("Log in"))));
  };
  render(); return box;
}
export function plansView(plans, current) {
  return h("div", { class: "grid" }, plans.map((p) => h("div", { class: "card plan stack" + (p.id === current ? " cur" : ""), style: "" },
    h("div", { class: "row spread" }, h("h3", {}, p.name), p.id === current ? h("span", { class: "badge acc" }, t("Your plan")) : null),
    h("div", { class: "stat" }, p.price), h("ul", { class: "muted", style: "margin:0;padding-inline-start:18px" }, p.features.map((f) => h("li", {}, f))),
    p.id === current ? null : h("button", { class: "btn", disabled: true, title: t("Payments are not active yet") }, t("Coming soon")))));
}
export function adminView(extraTitle, renderApp) {
  const root = h("div", { class: "stack" });
  const load = async () => {
    let d; try { d = await api("/api/admin/overview"); } catch (e) {
      root.innerHTML = ""; root.append(h("div", { class: "card stack" }, h("h2", {}, t("Admin")), h("p", { class: "muted" }, e.status === 403 ? t("You are not an admin. If you own this site, enter the admin key to claim access.") : e.message),
        e.status === 403 ? claimForm(load) : null)); return;
    }
    root.innerHTML = "";
    const st = (n, l) => h("div", { class: "card" }, h("div", { class: "stat" }, n), h("div", { class: "muted small" }, l));
    root.append(h("h1", {}, t("Admin dashboard")), h("div", { class: "grid" }, st(d.users, t("Users")), st(d.new7, t("New (7 days)")), st(d.active7, t("Active (7 days)")), st(d.pro, t("Pro (draft)")), st(d.suspended, t("Suspended"))));
    if (renderApp) root.append(renderApp(d.app));
    const rows = d.recent.map((u) => {
      const sel = (key, opts) => h("select", { "aria-label": key, style: "width:auto;min-height:32px;padding:3px 8px", onchange: (e) => guard(async () => { await api("/api/admin/user", { id: u.id, [key]: e.target.value }); toast(t("Updated")); load(); }) }, opts.map((o) => h("option", { value: o, selected: u[key] === o }, o)));
      return h("tr", {}, h("td", {}, h("b", {}, u.name), h("div", { class: "small muted" }, u.email)), h("td", {}, sel("role", ["user", "admin"])), h("td", {}, sel("plan", ["free", "pro"])), h("td", {}, sel("status", ["active", "suspended"])), h("td", { class: "small muted" }, fmtDate(u.created)));
    });
    root.append(h("div", { class: "card stack" }, h("h2", {}, t("Users")), h("div", { class: "tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, [t("User"), t("Role"), t("Plan"), t("Status"), t("Joined")].map((x) => h("th", {}, x)))), h("tbody", {}, rows)))));
    root.append(h("div", { class: "card stack" }, h("h2", {}, t("Audit log")), h("div", { class: "tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, [t("When"), t("Who"), t("Action"), t("Detail")].map((x) => h("th", {}, x)))),
      h("tbody", {}, d.audit.map((a) => h("tr", {}, h("td", { class: "small muted" }, fmtTime(a.ts)), h("td", { class: "small" }, a.email || "-"), h("td", {}, h("span", { class: "badge" }, a.action)), h("td", { class: "small muted" }, a.detail || ""))))))));
  };
  load(); return root;
}
function claimForm(done) {
  const k = h("input", { type: "password", placeholder: t("Admin key"), autocomplete: "off" });
  return h("form", { class: "row", onsubmit: (e) => { e.preventDefault(); guard(async () => { await api("/api/admin/claim", { key: k.value }); toast(t("Admin access granted")); done(); dispatchEvent(new Event("adminclaimed")); }); } }, k, h("button", { class: "btn pri" }, t("Claim")));
}
import { SITES } from "/sites.js";
const SVG = (kids) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kids}</svg>`;
const ICONS = {
  linkedin: SVG('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'),
  github: SVG('<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>'),
  globe: SVG('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
};
export function siteFooter() {
  const link = (href, icon, label) => h("a", { class: "fico", href, target: "_blank", rel: "noopener noreferrer", title: label, "aria-label": label, html: ICONS[icon] });
  return h("footer", { class: "sitefoot", "aria-label": "Footer" }, h("div", { class: "row spread" },
    h("div", { class: "row" }, link("https://www.linkedin.com/in/mahmod-salah", "linkedin", "LinkedIn"), link("https://github.com/engMahmoudSalah", "github", "GitHub"), link("https://md.mahmodsalah.workers.dev/", "globe", "Portfolio")),
    h("div", { class: "small muted" }, h("a", { href: "/by-mahmoud" }, t("By Mahmoud")), " · \u00a9 Mahmoud Salah")));
}
export function byMahmoudView() {
  document.title = "By Mahmoud";
  const here = location.hostname;
  return h("div", { class: "stack" }, h("div", {}, h("h1", {}, t("By Mahmoud")), h("p", { class: "muted" }, t("Every project I have built, live and free to try."))),
    h("div", { class: "grid" }, SITES.map(([name, glyph, url, desc]) => {
      const cur = new URL(url).hostname === here;
      return h("a", { class: "card stack bycard" + (cur ? " cur" : ""), href: url, "aria-current": cur ? "page" : null, style: "text-decoration:none;color:inherit;gap:8px" },
        h("div", { class: "row", style: "flex-wrap:nowrap" }, h("div", { class: "fav", style: "font-size:1.3rem", "aria-hidden": "true" }, glyph), h("div", { class: "grow" }, h("b", {}, name), cur ? h("span", { class: "badge acc", style: "margin-inline-start:8px" }, t("You are here")) : null)),
        h("div", { class: "muted small" }, desc), h("div", { class: "small", style: "color:var(--accent);font-weight:700;word-break:break-all" }, new URL(url).hostname));
    })));
}
