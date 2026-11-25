import { DurableObject } from "cloudflare:workers";

export const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
export const rid = (n = 12) => hex(crypto.getRandomValues(new Uint8Array(n)));
export const now = () => Date.now();

export async function hashPw(pw, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return b64(salt) + "$" + b64(bits);
}
export async function verifyPw(pw, stored) {
  const [salt] = stored.split("$");
  const h = await hashPw(pw, salt);
  if (h.length !== stored.length) return false;
  let d = 0;
  for (let i = 0; i < h.length; i++) d |= h.charCodeAt(i) ^ stored.charCodeAt(i);
  return d === 0;
}
export async function sha256(s) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (m, s = 400) => { throw new HttpError(s, m); };
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export const clean = (s, max = 200) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
export const isEmail = (s) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(s);

const CORE = `
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pw TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', plan TEXT NOT NULL DEFAULT 'free', status TEXT NOT NULL DEFAULT 'active', created INTEGER NOT NULL, last_login INTEGER);
CREATE TABLE IF NOT EXISTS sessions(h TEXT PRIMARY KEY, uid TEXT NOT NULL, exp INTEGER NOT NULL, created INTEGER NOT NULL, ua TEXT);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, uid TEXT, action TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS rl(k TEXT PRIMARY KEY, win INTEGER NOT NULL, n INTEGER NOT NULL);
`;

export class BaseHub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.env = env;
    this.sql.exec(CORE);
    if (this.schemaSQL) for (const s of this.schemaSQL().split(";\n")) if (s.trim()) { try { this.sql.exec(s); } catch (e) { if (!/duplicate column/i.test(String(e))) throw e; } }
  }
  q(sql, ...a) { return [...this.sql.exec(sql, ...a)]; }
  one(sql, ...a) { return this.q(sql, ...a)[0]; }
  run(sql, ...a) { this.sql.exec(sql, ...a); }
  audit(uid, action, detail) { this.run("INSERT INTO audit(ts,uid,action,detail) VALUES(?,?,?,?)", now(), uid || null, action, detail ? String(detail).slice(0, 300) : null); }
  limit(key, max, windowMs) {
    const t = now(); const w = Math.floor(t / windowMs);
    const r = this.one("SELECT win,n FROM rl WHERE k=?", key);
    if (!r || r.win !== w) { this.run("INSERT OR REPLACE INTO rl(k,win,n) VALUES(?,?,1)", key, w); return; }
    if (r.n >= max) bad("Too many attempts. Please wait a few minutes and try again.", 429);
    this.run("UPDATE rl SET n=n+1 WHERE k=?", key);
  }
  publicUser(u) { return { id: u.id, email: u.email, name: u.name, role: u.role, plan: u.plan, created: u.created }; }

  async fetch(req) {
    const url = new URL(req.url);
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        const origin = req.headers.get("origin");
        if (origin && new URL(origin).host !== url.host) bad("Cross-site request blocked.", 403);
      }
      let body = {};
      if (req.method !== "GET" && req.method !== "HEAD") {
        const txt = await req.text();
        if (txt.length > 400000) bad("Request too large.", 413);
        if (txt) { try { body = JSON.parse(txt); } catch { bad("Invalid request body."); } }
      }
      const ip = req.headers.get("cf-connecting-ip") || "0";
      const cookie = req.headers.get("cookie") || "";
      const m = cookie.match(/(?:^|;\s*)sid=([a-f0-9]{48})/);
      let user = null, sid = null;
      if (m) {
        sid = m[1];
        const s = this.one("SELECT uid,exp FROM sessions WHERE h=?", await sha256(sid));
        if (s && s.exp > now()) {
          user = this.one("SELECT * FROM users WHERE id=?", s.uid);
          if (user && user.status !== "active") user = null;
        }
      }
      const ctx = { req, url, body, ip, user, sid, path: url.pathname, method: req.method };
      const r = (await this.core(ctx)) ?? (await this.app(ctx));
      if (r === null || r === undefined) bad("Not found.", 404);
      if (r instanceof Response) return r;
      return json(r);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(String(e && e.stack || e));
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  }
  need(c) { if (!c.user) bad("Please log in to continue.", 401); return c.user; }
  needAdmin(c) { const u = this.need(c); if (u.role !== "admin") bad("Admins only.", 403); return u; }

  async startSession(uid, ua) {
    const sid = rid(24);
    this.run("INSERT INTO sessions(h,uid,exp,created,ua) VALUES(?,?,?,?,?)", await sha256(sid), uid, now() + 30 * 864e5, now(), clean(ua, 120));
    this.run("DELETE FROM sessions WHERE exp<?", now());
    return `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
  }
  async core(c) {
    const { path, method, body } = c;
    if (!path.startsWith("/api/")) return null;
    if (path === "/api/auth/register" && method === "POST") {
      this.limit("reg:" + c.ip, 8, 3600e3);
      const email = clean(body.email, 200).toLowerCase(), name = clean(body.name, 60), pw = String(body.password || "");
      if (!isEmail(email)) bad("Enter a valid email address.");
      if (name.length < 2) bad("Enter your name (at least 2 characters).");
      if (pw.length < 8 || pw.length > 200) bad("Password must be at least 8 characters.");
      if (this.one("SELECT 1 x FROM users WHERE email=?", email)) bad("That email already has an account. Try logging in.", 409);
      const id = rid(8);
      this.run("INSERT INTO users(id,email,name,pw,created,last_login) VALUES(?,?,?,?,?,?)", id, email, name, await hashPw(pw), now(), now());
      this.audit(id, "register", email);
      if (this.onRegister) this.onRegister(id);
      const cookie = await this.startSession(id, c.req.headers.get("user-agent"));
      return json({ user: this.publicUser(this.one("SELECT * FROM users WHERE id=?", id)) }, 200, { "set-cookie": cookie });
    }
    if (path === "/api/auth/login" && method === "POST") {
      this.limit("login:" + c.ip, 15, 600e3);
      const email = clean(body.email, 200).toLowerCase();
      this.limit("loginE:" + email, 10, 600e3);
      const u = this.one("SELECT * FROM users WHERE email=?", email);
      if (!u || !(await verifyPw(String(body.password || ""), u.pw))) { this.audit(u?.id, "login_fail", email); bad("Wrong email or password.", 401); }
      if (u.status !== "active") bad("This account is suspended.", 403);
      this.run("UPDATE users SET last_login=? WHERE id=?", now(), u.id);
      this.audit(u.id, "login");
      const cookie = await this.startSession(u.id, c.req.headers.get("user-agent"));
      return json({ user: this.publicUser(u) }, 200, { "set-cookie": cookie });
    }
    if (path === "/api/auth/logout" && method === "POST") {
      if (c.sid) this.run("DELETE FROM sessions WHERE h=?", await sha256(c.sid));
      return json({ ok: true }, 200, { "set-cookie": "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
    }
    if (path === "/api/auth/me" && method === "GET") return { user: c.user ? this.publicUser(c.user) : null };
    if (path === "/api/auth/profile" && method === "POST") {
      const u = this.need(c); const name = clean(body.name, 60);
      if (name.length < 2) bad("Enter your name (at least 2 characters).");
      this.run("UPDATE users SET name=? WHERE id=?", name, u.id);
      return { user: this.publicUser({ ...u, name }) };
    }
    if (path === "/api/auth/password" && method === "POST") {
      const u = this.need(c); this.limit("pw:" + u.id, 8, 600e3);
      if (!(await verifyPw(String(body.current || ""), u.pw))) bad("Current password is wrong.", 401);
      const np = String(body.password || ""); if (np.length < 8) bad("New password must be at least 8 characters.");
      this.run("UPDATE users SET pw=? WHERE id=?", await hashPw(np), u.id);
      this.run("DELETE FROM sessions WHERE uid=? AND h<>?", u.id, await sha256(c.sid || ""));
      this.audit(u.id, "password_change");
      return { ok: true };
    }
    if (path === "/api/admin/claim" && method === "POST") {
      const u = this.need(c); this.limit("claim:" + c.ip, 5, 3600e3);
      const hh = this.adminHash ? this.adminHash() : null;
      if (!hh || (await sha256(String(body.key || ""))) !== hh) bad("Invalid admin key.", 403);
      this.run("UPDATE users SET role='admin' WHERE id=?", u.id);
      this.audit(u.id, "admin_claim");
      return { ok: true };
    }
    if (path === "/api/admin/overview" && method === "GET") {
      this.needAdmin(c);
      const d = (t) => now() - t * 864e5;
      return {
        users: this.one("SELECT COUNT(*) n FROM users").n,
        pro: this.one("SELECT COUNT(*) n FROM users WHERE plan='pro'").n,
        new7: this.one("SELECT COUNT(*) n FROM users WHERE created>?", d(7)).n,
        active7: this.one("SELECT COUNT(*) n FROM users WHERE last_login>?", d(7)).n,
        suspended: this.one("SELECT COUNT(*) n FROM users WHERE status<>'active'").n,
        app: this.adminStats ? this.adminStats() : {},
        recent: this.q("SELECT id,email,name,role,plan,status,created,last_login FROM users ORDER BY created DESC LIMIT 100"),
        audit: this.q("SELECT a.ts,a.action,a.detail,u.email FROM audit a LEFT JOIN users u ON u.id=a.uid ORDER BY a.id DESC LIMIT 100"),
      };
    }
    if (path === "/api/admin/user" && method === "POST") {
      const me = this.needAdmin(c);
      const t = this.one("SELECT * FROM users WHERE id=?", String(body.id));
      if (!t) bad("User not found.", 404);
      if (t.id === me.id && (body.status === "suspended" || body.role === "user")) bad("You can't lock yourself out.");
      if (["user", "admin"].includes(body.role)) this.run("UPDATE users SET role=? WHERE id=?", body.role, t.id);
      if (["free", "pro"].includes(body.plan)) this.run("UPDATE users SET plan=? WHERE id=?", body.plan, t.id);
      if (["active", "suspended"].includes(body.status)) { this.run("UPDATE users SET status=? WHERE id=?", body.status, t.id); if (body.status !== "active") this.run("DELETE FROM sessions WHERE uid=?", t.id); }
      this.audit(me.id, "admin_user_update", `${t.email} ${JSON.stringify({ role: body.role, plan: body.plan, status: body.status })}`);
      return { ok: true };
    }
    return null;
  }
}

export function makeWorker(bindingName) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/") || (env.HUB_PATHS && env.HUB_PATHS.some((p) => url.pathname.startsWith(p)))) {
        const stub = env[bindingName].get(env[bindingName].idFromName("main"));
        return stub.fetch(request);
      }
      return env.ASSETS.fetch(request);
    },
  };
}
