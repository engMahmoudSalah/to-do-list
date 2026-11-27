import { BaseHub, makeWorker, bad, clean, rid, now } from "./core.js";

const LIMITS = { free: { ws: 3, tasks: 100, members: 5 }, pro: { ws: 20, tasks: 2000, members: 50 } };
const PRIOS = ["low", "normal", "high", "urgent"];
const RECUR = ["", "daily", "weekdays", "weekly", "monthly"];

function nextDue(due, rec) {
  const d = new Date(due);
  if (rec === "daily") d.setUTCDate(d.getUTCDate() + 1);
  else if (rec === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else if (rec === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else if (rec === "weekdays") { do d.setUTCDate(d.getUTCDate() + 1); while ([0, 6].includes(d.getUTCDay())); }
  return d.getTime();
}

export class Hub extends BaseHub {
  schemaSQL() {
    return `CREATE TABLE IF NOT EXISTS ws(id TEXT PRIMARY KEY, name TEXT NOT NULL, owner TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS members(ws TEXT NOT NULL, uid TEXT NOT NULL, role TEXT NOT NULL, joined INTEGER NOT NULL, PRIMARY KEY(ws,uid));
CREATE TABLE IF NOT EXISTS invites(token TEXT PRIMARY KEY, ws TEXT NOT NULL, role TEXT NOT NULL, email TEXT, exp INTEGER NOT NULL, uses INTEGER NOT NULL DEFAULT 0, max_uses INTEGER NOT NULL DEFAULT 1, created_by TEXT);
CREATE TABLE IF NOT EXISTS boards(id TEXT PRIMARY KEY, ws TEXT NOT NULL, name TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS cols(id TEXT PRIMARY KEY, board TEXT NOT NULL, name TEXT NOT NULL, pos INTEGER NOT NULL, done INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, ws TEXT NOT NULL, board TEXT NOT NULL, col TEXT NOT NULL, title TEXT NOT NULL, descr TEXT NOT NULL DEFAULT '', assignee TEXT, prio TEXT NOT NULL DEFAULT 'normal', due INTEGER, recur TEXT NOT NULL DEFAULT '', remind INTEGER, reminded INTEGER NOT NULL DEFAULT 0, done INTEGER NOT NULL DEFAULT 0, labels TEXT NOT NULL DEFAULT '', pos REAL NOT NULL DEFAULT 0, created_by TEXT, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS tasks_ws ON tasks(ws);
CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY, task TEXT NOT NULL, uid TEXT NOT NULL, body TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, uid TEXT NOT NULL, text TEXT NOT NULL, link TEXT, ts INTEGER NOT NULL, read INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS activity(id INTEGER PRIMARY KEY AUTOINCREMENT, ws TEXT NOT NULL, uid TEXT, text TEXT NOT NULL, ts INTEGER NOT NULL)`;
  }
  adminHash() { return "3954f4c578cae100a111e4a8e3f3a02ed85d1f71944dacd76fb23b0eea2779e0"; }
  lim(u) { return LIMITS[u.plan] || LIMITS.free; }
  role(ws, u) { const m = this.one("SELECT role FROM members WHERE ws=? AND uid=?", ws, u.id); if (!m) bad("Workspace not found.", 404); return m.role; }
  canEdit(r) { return r === "owner" || r === "admin" || r === "member"; }
  act(ws, uid, text) { this.run("INSERT INTO activity(ws,uid,text,ts) VALUES(?,?,?,?)", ws, uid, text, now()); }
  notify(uid, text, link) { if (uid) this.run("INSERT INTO notes(id,uid,text,link,ts) VALUES(?,?,?,?,?)", rid(6), uid, text.slice(0, 200), link || null, now()); }
  mkBoard(ws, name) {
    const id = rid(6); this.run("INSERT INTO boards(id,ws,name,created) VALUES(?,?,?,?)", id, ws, name, now());
    [["To do", 0], ["In progress", 0], ["Review", 0], ["Done", 1]].forEach(([n, d], i) => this.run("INSERT INTO cols(id,board,name,pos,done) VALUES(?,?,?,?,?)", rid(6), id, n, i, d));
    return id;
  }
  async rearm() {
    const r = this.one("SELECT MIN(remind) t FROM tasks WHERE remind IS NOT NULL AND reminded=0 AND done=0");
    if (r && r.t) await this.ctx.storage.setAlarm(Math.max(r.t, now() + 1000));
  }
  async alarm() {
    const due = this.q("SELECT id,title,ws,assignee,created_by FROM tasks WHERE remind IS NOT NULL AND remind<=? AND reminded=0 AND done=0", now());
    for (const t of due) {
      this.run("UPDATE tasks SET reminded=1 WHERE id=?", t.id);
      this.notify(t.assignee || t.created_by, `Reminder: ${t.title}`, `#/w/${t.ws}`);
    }
    await this.rearm();
  }
  members(ws) { return this.q("SELECT m.uid id,m.role,u.name,u.email FROM members m JOIN users u ON u.id=m.uid WHERE m.ws=? ORDER BY m.joined", ws); }
  adminStats() {
    return { workspaces: this.one("SELECT COUNT(*) n FROM ws").n, tasks: this.one("SELECT COUNT(*) n FROM tasks").n, done: this.one("SELECT COUNT(*) n FROM tasks WHERE done=1").n, invites: this.one("SELECT COUNT(*) n FROM invites").n };
  }
  taskOut(t) { return { ...t, labels: t.labels ? t.labels.split(",") : [] }; }
  readTask(c, id) {
    const u = this.need(c); const t = this.one("SELECT * FROM tasks WHERE id=?", id);
    if (!t) bad("Task not found.", 404); const r = this.role(t.ws, u); return { t, u, r };
  }
  usage(u) { const l = this.lim(u); return [["Workspaces", this.one("SELECT COUNT(*) n FROM ws WHERE owner=?", u.id).n, l.ws]]; }
  beforeDelete(u) {
    for (const w of this.q("SELECT id FROM ws WHERE owner=?", u.id)) {
      const next = this.one("SELECT uid FROM members WHERE ws=? AND uid<>? ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'member' THEN 1 ELSE 2 END, joined LIMIT 1", w.id, u.id);
      if (!next) continue;
      this.run("UPDATE ws SET owner=? WHERE id=?", next.uid, w.id); this.run("UPDATE members SET role='owner' WHERE ws=? AND uid=?", w.id, next.uid);
      this.run("INSERT INTO activity(ws,uid,text,ts) VALUES(?,?,?,?)", w.id, next.uid, "became the owner because the previous owner deleted their account", now());
    }
  }
  purgeUsers(ids) { const n = ids.map(() => "?").join(","); const W = `SELECT id FROM ws WHERE owner IN (${n})`;
    this.run(`DELETE FROM comments WHERE uid IN (${n}) OR task IN (SELECT id FROM tasks WHERE ws IN (${W}))`, ...ids, ...ids);
    for (const t of ["tasks", "boards", "members", "invites", "activity"]) this.run(`DELETE FROM ${t} WHERE ws IN (${W})`, ...ids);
    this.run(`DELETE FROM cols WHERE board NOT IN (SELECT id FROM boards)`); this.run(`DELETE FROM members WHERE uid IN (${n})`, ...ids); this.run(`DELETE FROM notes WHERE uid IN (${n})`, ...ids); this.run(`DELETE FROM ws WHERE owner IN (${n})`, ...ids); }
  exportData(u) {
    return { memberships: this.q("SELECT ws,role,joined FROM members WHERE uid=?", u.id), notifications: this.q("SELECT text,ts FROM notes WHERE uid=? ORDER BY ts DESC LIMIT 500", u.id), comments: this.q("SELECT task,body,ts FROM comments WHERE uid=? ORDER BY ts DESC LIMIT 1000", u.id), tasks_assigned: this.q("SELECT t.id,t.title,t.descr,t.prio FROM tasks t JOIN members m ON m.ws=t.ws WHERE m.uid=? AND t.assignee=? LIMIT 2000", u.id, u.id) };
  }
  async app(c) {
    const { path, method, body } = c; let m;
    if (path === "/api/plans" && method === "GET") return { plans: [
      { id: "free", name: "Free", price: "$0", features: ["3 workspaces", "100 tasks per workspace", "5 members per workspace", "Boards, calendar, reminders"] },
      { id: "pro", name: "Pro", price: "$6/mo", features: ["20 workspaces", "2,000 tasks per workspace", "50 members", "Priority support"] }] };
    const u = this.need(c);
    if (path === "/api/workspaces" && method === "GET") {
      return { workspaces: this.q("SELECT w.id,w.name,m.role,(SELECT COUNT(*) FROM tasks t WHERE t.ws=w.id) tasks,(SELECT COUNT(*) FROM tasks t WHERE t.ws=w.id AND t.done=0) open,(SELECT COUNT(*) FROM members x WHERE x.ws=w.id) members FROM ws w JOIN members m ON m.ws=w.id AND m.uid=? ORDER BY w.created", u.id), limits: this.lim(u) };
    }
    if (path === "/api/workspaces" && method === "POST") {
      const name = clean(body.name, 60); if (name.length < 2) bad("Give the workspace a name.");
      if (this.one("SELECT COUNT(*) n FROM ws WHERE owner=?", u.id).n >= this.lim(u).ws) bad(`Your ${u.plan} plan allows ${this.lim(u).ws} workspaces. Pro plans are coming soon.`, 402);
      const id = rid(6); this.run("INSERT INTO ws(id,name,owner,created) VALUES(?,?,?,?)", id, name, u.id, now());
      this.run("INSERT INTO members(ws,uid,role,joined) VALUES(?,?,?,?)", id, u.id, "owner", now());
      this.mkBoard(id, "Main board"); this.audit(u.id, "ws_create", name); this.act(id, u.id, "created the workspace");
      return { id };
    }
    if ((m = path.match(/^\/api\/join\/([a-f0-9]+)$/))) {
      const inv = this.one("SELECT * FROM invites WHERE token=?", m[1]);
      if (!inv || inv.exp < now() || inv.uses >= inv.max_uses) bad("This invite link is invalid or has expired.", 410);
      const w = this.one("SELECT * FROM ws WHERE id=?", inv.ws);
      if (method === "GET") return { workspace: w.name, role: inv.role, already: !!this.one("SELECT 1 x FROM members WHERE ws=? AND uid=?", w.id, u.id) };
      if (inv.email && inv.email !== u.email) bad("This invite was sent to a different email address.", 403);
      if (this.one("SELECT 1 x FROM members WHERE ws=? AND uid=?", w.id, u.id)) return { id: w.id };
      const owner = this.one("SELECT plan FROM users WHERE id=?", w.owner);
      if (this.members(w.id).length >= (LIMITS[owner.plan] || LIMITS.free).members) bad("This workspace has reached its member limit.", 402);
      this.run("INSERT INTO members(ws,uid,role,joined) VALUES(?,?,?,?)", w.id, u.id, inv.role, now());
      this.run("UPDATE invites SET uses=uses+1 WHERE token=?", inv.token);
      this.act(w.id, u.id, "joined the workspace"); this.notify(w.owner, `${u.name} joined ${w.name}`, `#/w/${w.id}/members`); this.audit(u.id, "ws_join", w.name);
      return { id: w.id };
    }
    if (path === "/api/notes" && method === "GET") return { notes: this.q("SELECT * FROM notes WHERE uid=? ORDER BY ts DESC LIMIT 60", u.id), unread: this.one("SELECT COUNT(*) n FROM notes WHERE uid=? AND read=0", u.id).n };
    if (path === "/api/notes/read" && method === "POST") { this.run("UPDATE notes SET read=1 WHERE uid=?", u.id); return { ok: true }; }
    if (path === "/api/mytasks" && method === "GET") return { tasks: this.q("SELECT t.*,w.name wsname FROM tasks t JOIN ws w ON w.id=t.ws JOIN members m ON m.ws=t.ws AND m.uid=? WHERE t.assignee=? AND t.done=0 ORDER BY t.due IS NULL, t.due LIMIT 100", u.id, u.id).map((t) => this.taskOut(t)) };

    if ((m = path.match(/^\/api\/w\/([a-f0-9]+)(\/.*)?$/))) {
      const ws = m[1], sub = m[2] || "", r = this.role(ws, u), W = this.one("SELECT * FROM ws WHERE id=?", ws);
      const edit = () => { if (!this.canEdit(r)) bad("You have view-only access in this workspace.", 403); };
      const adm = () => { if (r !== "owner" && r !== "admin") bad("Only workspace admins can do that.", 403); };
      if (sub === "" && method === "GET") {
        const boards = this.q("SELECT * FROM boards WHERE ws=? ORDER BY created", ws);
        const cols = this.q("SELECT c.* FROM cols c JOIN boards b ON b.id=c.board WHERE b.ws=? ORDER BY c.pos", ws);
        const tasks = this.q("SELECT * FROM tasks WHERE ws=? ORDER BY pos, created", ws).map((t) => this.taskOut(t));
        return { workspace: { id: ws, name: W.name, role: r, owner: W.owner }, boards, cols, tasks, members: this.members(ws), activity: this.q("SELECT a.text,a.ts,u.name FROM activity a LEFT JOIN users u ON u.id=a.uid WHERE a.ws=? ORDER BY a.id DESC LIMIT 25", ws) };
      }
      if (sub === "" && method === "POST") { adm(); const name = clean(body.name, 60); if (name.length < 2) bad("Give the workspace a name."); this.run("UPDATE ws SET name=? WHERE id=?", name, ws); return { ok: true }; }
      if (sub === "" && method === "DELETE") {
        if (r !== "owner") bad("Only the owner can delete a workspace.", 403);
        for (const t of ["tasks", "boards", "invites", "members", "activity"]) this.run(`DELETE FROM ${t} WHERE ws=?`, ws);
        this.run("DELETE FROM cols WHERE board NOT IN (SELECT id FROM boards)"); this.run("DELETE FROM comments WHERE task NOT IN (SELECT id FROM tasks)"); this.run("DELETE FROM ws WHERE id=?", ws);
        this.audit(u.id, "ws_delete", W.name); return { ok: true };
      }
      if (sub === "/boards" && method === "POST") { edit(); const name = clean(body.name, 60); if (name.length < 2) bad("Give the board a name."); if (this.one("SELECT COUNT(*) n FROM boards WHERE ws=?", ws).n >= 10) bad("Up to 10 boards per workspace."); return { id: this.mkBoard(ws, name) }; }
      if ((m = sub.match(/^\/boards\/([a-f0-9]+)$/)) && method === "DELETE") {
        adm(); if (this.one("SELECT COUNT(*) n FROM boards WHERE ws=?", ws).n <= 1) bad("A workspace needs at least one board.");
        this.run("DELETE FROM tasks WHERE board=?", m[1]); this.run("DELETE FROM cols WHERE board=?", m[1]); this.run("DELETE FROM boards WHERE id=? AND ws=?", m[1], ws); return { ok: true };
      }
      if (sub === "/tasks" && method === "POST") {
        edit();
        const lim = this.lim(this.one("SELECT plan FROM users WHERE id=?", W.owner)).tasks;
        if (this.one("SELECT COUNT(*) n FROM tasks WHERE ws=?", ws).n >= lim) bad(`This workspace reached its ${lim}-task limit on the free plan. Pro plans are coming soon.`, 402);
        const title = clean(body.title, 140); if (!title) bad("Give the task a title.");
        const col = this.one("SELECT c.*,b.ws FROM cols c JOIN boards b ON b.id=c.board WHERE c.id=?", String(body.col)); if (!col || col.ws !== ws) bad("Pick a column.");
        const t = this.fields(body, ws, {}); const id = rid(7);
        this.run("INSERT INTO tasks(id,ws,board,col,title,descr,assignee,prio,due,recur,remind,done,labels,pos,created_by,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", id, ws, col.board, col.id, title, t.descr, t.assignee, t.prio, t.due, t.recur, t.remind, col.done, t.labels, now(), u.id, now(), now());
        this.act(ws, u.id, `added "${title}"`); if (t.assignee && t.assignee !== u.id) this.notify(t.assignee, `${u.name} assigned you: ${title}`, `#/w/${ws}`);
        await this.rearm(); return { id };
      }
      if ((m = sub.match(/^\/tasks\/([a-f0-9]+)$/))) {
        const T = this.one("SELECT * FROM tasks WHERE id=? AND ws=?", m[1], ws); if (!T) bad("Task not found.", 404);
        if (method === "GET") return { task: this.taskOut(T), comments: this.q("SELECT c.id,c.body,c.ts,u.name FROM comments c JOIN users u ON u.id=c.uid WHERE c.task=? ORDER BY c.ts", T.id) };
        edit();
        if (method === "DELETE") { this.run("DELETE FROM tasks WHERE id=?", T.id); this.run("DELETE FROM comments WHERE task=?", T.id); this.act(ws, u.id, `deleted "${T.title}"`); return { ok: true }; }
        if (method === "POST") {
          const t = this.fields(body, ws, T); const title = body.title !== undefined ? clean(body.title, 140) : T.title; if (!title) bad("Give the task a title.");
          let col = T.col, board = T.board, done = T.done;
          if (body.col && body.col !== T.col) { const cc = this.one("SELECT c.*,b.ws FROM cols c JOIN boards b ON b.id=c.board WHERE c.id=?", String(body.col)); if (!cc || cc.ws !== ws) bad("Pick a column."); col = cc.id; board = cc.board; done = cc.done; }
          if (body.done !== undefined) done = body.done ? 1 : 0;
          const pos = typeof body.pos === "number" ? body.pos : T.pos;
          let due = t.due, reminded = T.reminded;
          if (t.remind !== T.remind) reminded = 0;
          // recurring: completing rolls it forward instead of closing
          if (done && !T.done && T.recur && T.due) {
            due = nextDue(T.due, T.recur); done = 0;
            const cols = this.q("SELECT id FROM cols WHERE board=? ORDER BY pos", board);
            col = cols[0].id; reminded = 0; if (t.remind) t.remind = t.remind + (due - T.due);
            this.act(ws, u.id, `completed "${title}" (repeats, next ${new Date(due).toISOString().slice(0, 10)})`);
          } else if (done !== T.done) this.act(ws, u.id, `${done ? "completed" : "reopened"} "${title}"`);
          if (body.assignee && body.assignee !== T.assignee && body.assignee !== u.id) this.notify(body.assignee, `${u.name} assigned you: ${title}`, `#/w/${ws}`);
          this.run("UPDATE tasks SET title=?,descr=?,assignee=?,prio=?,due=?,recur=?,remind=?,reminded=?,labels=?,col=?,board=?,done=?,pos=?,updated=? WHERE id=?", title, t.descr, t.assignee, t.prio, due, t.recur, t.remind, reminded, t.labels, col, board, done, pos, now(), T.id);
          await this.rearm(); return { ok: true };
        }
      }
      if ((m = sub.match(/^\/tasks\/([a-f0-9]+)\/comments$/)) && method === "POST") {
        const T = this.one("SELECT * FROM tasks WHERE id=? AND ws=?", m[1], ws); if (!T) bad("Task not found.", 404);
        edit(); const text = clean(body.body, 1000); if (!text) bad("Write a comment first.");
        this.limit("cm:" + u.id, 30, 600e3);
        this.run("INSERT INTO comments(id,task,uid,body,ts) VALUES(?,?,?,?,?)", rid(6), T.id, u.id, text, now());
        for (const to of new Set([T.assignee, T.created_by])) if (to && to !== u.id) this.notify(to, `${u.name} commented on ${T.title}`, `#/w/${ws}`);
        return { ok: true };
      }
      if (sub === "/activity" && method === "GET") { adm(); this.limit("act:" + u.id, 20, 3600e3); return { activity: this.q("SELECT a.ts,a.text,u.name FROM activity a LEFT JOIN users u ON u.id=a.uid WHERE a.ws=? ORDER BY a.ts DESC LIMIT 2000", ws) }; }
      if (sub === "/invites" && method === "GET") { adm(); return { invites: this.q("SELECT token,role,email,exp,uses,max_uses FROM invites WHERE ws=? AND exp>? AND uses<max_uses ORDER BY exp DESC", ws, now()) }; }
      if (sub === "/invites" && method === "POST") {
        adm(); const role = ["admin", "member", "viewer"].includes(body.role) ? body.role : "member"; const email = clean(body.email, 200).toLowerCase();
        this.limit("inv:" + u.id, 30, 3600e3);
        const token = rid(16); this.run("INSERT INTO invites(token,ws,role,email,exp,max_uses,created_by) VALUES(?,?,?,?,?,?,?)", token, ws, role, email || null, now() + 7 * 864e5, email ? 1 : 10, u.id);
        this.audit(u.id, "invite_create", `${W.name} ${role}`); return { token };
      }
      if ((m = sub.match(/^\/invites\/([a-f0-9]+)$/)) && method === "DELETE") { adm(); this.run("DELETE FROM invites WHERE token=? AND ws=?", m[1], ws); return { ok: true }; }
      if ((m = sub.match(/^\/members\/([a-f0-9]+)$/))) {
        adm(); const mm = this.one("SELECT * FROM members WHERE ws=? AND uid=?", ws, m[1]); if (!mm) bad("Member not found.", 404);
        if (mm.role === "owner") bad("The owner can't be changed.");
        if (method === "DELETE") { this.run("DELETE FROM members WHERE ws=? AND uid=?", ws, m[1]); this.run("UPDATE tasks SET assignee=NULL WHERE ws=? AND assignee=?", ws, m[1]); this.act(ws, u.id, "removed a member"); return { ok: true }; }
        if (method === "POST" && ["admin", "member", "viewer"].includes(body.role)) { this.run("UPDATE members SET role=? WHERE ws=? AND uid=?", body.role, ws, m[1]); return { ok: true }; }
      }
      if (sub === "/leave" && method === "POST") { if (r === "owner") bad("The owner can't leave. Delete the workspace instead."); this.run("DELETE FROM members WHERE ws=? AND uid=?", ws, u.id); this.run("UPDATE tasks SET assignee=NULL WHERE ws=? AND assignee=?", ws, u.id); return { ok: true }; }
      if (sub === "/export" && method === "GET") return { workspace: W.name, tasks: this.q("SELECT title,descr,prio,due,recur,done,labels FROM tasks WHERE ws=?", ws) };
    }
    return null;
  }
  fields(b, ws, old) {
    const o = {};
    o.descr = b.descr !== undefined ? clean(b.descr, 4000) : old.descr || "";
    o.prio = b.prio !== undefined ? (PRIOS.includes(b.prio) ? b.prio : "normal") : old.prio || "normal";
    o.recur = b.recur !== undefined ? (RECUR.includes(b.recur) ? b.recur : "") : old.recur || "";
    o.due = b.due !== undefined ? (b.due ? Number(b.due) || null : null) : old.due ?? null;
    o.remind = b.remind !== undefined ? (b.remind ? Number(b.remind) || null : null) : old.remind ?? null;
    if (o.recur && !o.due) bad("Set a due date for a repeating task.");
    o.labels = b.labels !== undefined ? (Array.isArray(b.labels) ? b.labels : String(b.labels).split(",")).map((x) => clean(x, 20).replace(/,/g, "")).filter(Boolean).slice(0, 6).join(",") : old.labels || "";
    if (b.assignee !== undefined) {
      if (b.assignee && !this.one("SELECT 1 x FROM members WHERE ws=? AND uid=?", ws, b.assignee)) bad("Assignee must be a workspace member.");
      o.assignee = b.assignee || null;
    } else o.assignee = old.assignee ?? null;
    return o;
  }
}
export default makeWorker("HUB");
