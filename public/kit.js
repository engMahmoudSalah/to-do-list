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
  try { r = await fetch(path, opt); } catch { throw new Error("No connection. Check your internet and try again."); }
  let d = null;
  try { d = await r.json(); } catch { /* not json */ }
  if (!r.ok) { const e = new Error((d && d.error) || `Server error (${r.status}). Please try again.`); e.status = r.status; throw e; }
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
    h("div", { class: "row spread" }, h("h2", {}, title), h("button", { class: "btn ghost sm", "aria-label": "Close", onclick: close }, "✕")), content);
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
    const email = h("input", { type: "email", autocomplete: "email", required: true, placeholder: "you@example.com" });
    const name = h("input", { type: "text", autocomplete: "name", placeholder: "Your name", maxlength: 60 });
    const pw = h("input", { type: "password", autocomplete: mode === "login" ? "current-password" : "new-password", placeholder: mode === "login" ? "Password" : "At least 8 characters" });
    const err = h("div", { class: "err", role: "alert" });
    const btn = h("button", { class: "btn pri", type: "submit" }, mode === "login" ? "Log in" : "Create account");
    const form = h("form", { class: "stack", novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.textContent = "";
      if (!email.value.trim()) return (err.textContent = "Enter your email.");
      if (!pw.value) return (err.textContent = "Enter your password.");
      btn.disabled = true;
      try {
        const d = await api("/api/auth/" + (mode === "login" ? "login" : "register"), { email: email.value, password: pw.value, name: name.value });
        onAuthed(d.user);
      } catch (x) { err.textContent = x.message; } finally { btn.disabled = false; }
    } },
      mode === "signup" ? field("Name", name) : null, field("Email", email), field("Password", pw), err, btn);
    box.append(h("h2", {}, opts.title || (mode === "login" ? "Welcome back" : "Create your account")), opts.sub ? h("p", { class: "muted" }, opts.sub) : null, form,
      h("p", { class: "small muted" }, mode === "login" ? "New here? " : "Already have an account? ",
        h("a", { href: "#", onclick: (e) => { e.preventDefault(); mode = mode === "login" ? "signup" : "login"; render(); } }, mode === "login" ? "Create an account" : "Log in")));
  };
  render(); return box;
}
export function plansView(plans, current) {
  return h("div", { class: "grid" }, plans.map((p) => h("div", { class: "card plan stack" + (p.id === current ? " cur" : ""), style: "" },
    h("div", { class: "row spread" }, h("h3", {}, p.name), p.id === current ? h("span", { class: "badge acc" }, "Your plan") : null),
    h("div", { class: "stat" }, p.price), h("ul", { class: "muted", style: "margin:0;padding-inline-start:18px" }, p.features.map((f) => h("li", {}, f))),
    p.id === current ? null : h("button", { class: "btn", disabled: true, title: "Payments are not active yet" }, "Coming soon"))));
}
export function adminView(extraTitle, renderApp) {
  const root = h("div", { class: "stack" });
  const load = async () => {
    let d; try { d = await api("/api/admin/overview"); } catch (e) {
      root.innerHTML = ""; root.append(h("div", { class: "card stack" }, h("h2", {}, "Admin"), h("p", { class: "muted" }, e.status === 403 ? "You are not an admin. If you own this site, enter the admin key to claim access." : e.message),
        e.status === 403 ? claimForm(load) : null)); return;
    }
    root.innerHTML = "";
    const st = (n, l) => h("div", { class: "card" }, h("div", { class: "stat" }, n), h("div", { class: "muted small" }, l));
    root.append(h("h1", {}, "Admin dashboard"), h("div", { class: "grid" }, st(d.users, "Users"), st(d.new7, "New (7 days)"), st(d.active7, "Active (7 days)"), st(d.pro, "Pro (draft)"), st(d.suspended, "Suspended")));
    if (renderApp) root.append(renderApp(d.app));
    const rows = d.recent.map((u) => {
      const sel = (key, opts) => h("select", { "aria-label": key, style: "width:auto;min-height:32px;padding:3px 8px", onchange: (e) => guard(async () => { await api("/api/admin/user", { id: u.id, [key]: e.target.value }); toast("Updated"); load(); }) }, opts.map((o) => h("option", { value: o, selected: u[key] === o }, o)));
      return h("tr", {}, h("td", {}, h("b", {}, u.name), h("div", { class: "small muted" }, u.email)), h("td", {}, sel("role", ["user", "admin"])), h("td", {}, sel("plan", ["free", "pro"])), h("td", {}, sel("status", ["active", "suspended"])), h("td", { class: "small muted" }, fmtDate(u.created)));
    });
    root.append(h("div", { class: "card stack" }, h("h2", {}, "Users"), h("div", { class: "tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, ["User", "Role", "Plan", "Status", "Joined"].map((x) => h("th", {}, x)))), h("tbody", {}, rows)))));
    root.append(h("div", { class: "card stack" }, h("h2", {}, "Audit log"), h("div", { class: "tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, ["When", "Who", "Action", "Detail"].map((x) => h("th", {}, x)))),
      h("tbody", {}, d.audit.map((a) => h("tr", {}, h("td", { class: "small muted" }, fmtTime(a.ts)), h("td", { class: "small" }, a.email || "-"), h("td", {}, h("span", { class: "badge" }, a.action)), h("td", { class: "small muted" }, a.detail || ""))))))));
  };
  load(); return root;
}
function claimForm(done) {
  const k = h("input", { type: "password", placeholder: "Admin key", autocomplete: "off" });
  return h("form", { class: "row", onsubmit: (e) => { e.preventDefault(); guard(async () => { await api("/api/admin/claim", { key: k.value }); toast("Admin access granted"); done(); }); } }, k, h("button", { class: "btn pri" }, "Claim"));
}
import { SITES } from "/sites.js";
export function siteFooter() {
  const here = location.hostname;
  const hue = (i) => (i * 47) % 360;
  return h("footer", { class: "sitefoot", "aria-label": "More projects" },
    h("div", { class: "small muted" }, "More from Mahmoud Salah"),
    h("div", { class: "sitegrid" }, SITES.map(([name, glyph, url], i) => {
      const cur = new URL(url).hostname === here;
      return h("a", { href: url, class: "siteico" + (cur ? " cur" : ""), title: name, "aria-label": name + (cur ? " (this site)" : ""), "aria-current": cur ? "page" : null, style: `--hu:${hue(i)}` }, h("span", { class: "g" }, glyph), h("span", { class: "n" }, name));
    })));
}
