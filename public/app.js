import { canvasEl, reveal, tilt } from "/fx.js";
import { $, h, api, siteFooter, byMahmoudView, toast, guard, modal, fmtDate, fmtTime, ago, initTheme, field, authForm, plansView, adminView } from "/kit.js";
const toggleTheme = initTheme();
const S = { user: null, unread: 0 };
const app = $("#app");
const PR = { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" };
const RC = { "": "Does not repeat", daily: "Daily", weekdays: "Weekdays", weekly: "Weekly", monthly: "Monthly" };
const dayStr = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const localInput = (t) => (t ? new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "");
const parseLocal = (v) => (v ? new Date(v).getTime() : null);
const dueDate = (v) => (v ? new Date(v + "T12:00:00").getTime() : null);

function shell(content, active) {
  const nav = h("nav", { class: "nav", "aria-label": "Main" },
    [["#/", "Workspaces", "home"], ["#/my", "My tasks", "my"], ["#/notes", `Inbox${S.unread ? " (" + S.unread + ")" : ""}`, "notes"], ["#/plans", "Plans", "plans"], ["#/account", "Account", "account"]]
      .concat(S.user && S.user.role === "admin" ? [["#/admin", "Admin", "admin"]] : []).map(([href, t, k]) => h("a", { href, class: active === k ? "on" : "" }, t)));
  app.replaceChildren(h("header", { class: "topbar" }, h("div", { class: "in" }, h("a", { class: "brand", href: "#/" }, h("span", { class: "lg" }, "◎"), h("span", {}, "Orbit")), nav,
    h("button", { class: "btn sm", "aria-label": "Toggle dark mode", onclick: toggleTheme }, "◐"))), h("main", {}, content), siteFooter());
}
function landing() {
  const box = h("div", { class: "landing" });
  app.replaceChildren(h("header", { class: "topbar" }, h("div", { class: "in" }, h("a", { class: "brand", href: "#/" }, h("span", { class: "lg" }, "◎"), "Orbit"), h("div", { class: "grow" }), h("button", { class: "btn sm", "aria-label": "Toggle dark mode", onclick: toggleTheme }, "◐"))),
    h("main", {}, h("div", { class: "hero fxwrap" }, h("div", { class: "fxbg" }, canvasEl("p")), h("div", { class: "fxart floaty", style: "position:relative" }, canvasEl("wire", "ring")), h("h1", { style: "position:relative" }, "Tasks your whole team can keep up with"), h("p", { class: "muted", style: "max-width:560px;margin:0 auto 20px" }, "Workspaces, invites, kanban boards, repeating tasks, reminders and a calendar. Free for small teams.")),
      h("div", { class: "row", style: "justify-content:center;align-items:flex-start;gap:26px" },
        authForm((u) => { S.user = u; route(); }, { title: "Start with Orbit", sub: "Log in or create a free account." })),
      h("div", { class: "feat" }, [["Boards", "Drag tasks across columns. On a phone, use the move buttons."], ["Repeat and remind", "Daily, weekday, weekly or monthly tasks that roll forward when done."], ["Invite your team", "Share a link. Pick owner, admin, member or viewer."], ["Calendar", "See due dates by month and open a task with one tap."]].map(([a, b]) => h("div", { class: "card reveal tcard" }, h("h3", {}, a), h("p", { class: "muted" }, b))))), siteFooter());
  reveal(app); app.querySelectorAll(".tcard").forEach(tilt);
}
async function refreshUnread() { try { S.unread = (await api("/api/notes")).unread; } catch { /* ignore */ } }

async function home() {
  const d = await api("/api/workspaces"); await refreshUnread();
  const list = d.workspaces.length ? h("div", { class: "grid" }, d.workspaces.map((w) => h("a", { class: "card stack", href: `#/w/${w.id}`, style: "text-decoration:none;color:inherit" },
    h("div", { class: "row spread" }, h("h3", { style: "margin:0" }, w.name), h("span", { class: "badge" }, w.role)), h("div", { class: "muted small" }, `${w.open} open · ${w.tasks} total · ${w.members} member${w.members === 1 ? "" : "s"}`))))
    : h("div", { class: "card empty" }, h("h3", {}, "No workspaces yet"), h("p", {}, "A workspace is a space for one team or project. Create your first one."));
  shell(h("div", { class: "stack" }, h("div", { class: "row spread" }, h("h1", {}, `Hi ${S.user.name.split(" ")[0]}`), h("button", { class: "btn pri", onclick: newWs }, "+ New workspace")), list,
    h("p", { class: "small muted" }, `Plan: ${S.user.plan}. Up to ${d.limits.ws} workspaces.`)), "home");
}
function newWs() {
  const n = h("input", { placeholder: "e.g. Marketing team", maxlength: 60 });
  const m = modal("New workspace", h("form", { class: "stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { const r = await api("/api/workspaces", { name: n.value }); m.close(); location.hash = `#/w/${r.id}`; }); } }, field("Name", n), h("button", { class: "btn pri" }, "Create")));
}

let W = null; // current workspace data
let view = "board", boardId = null, filter = { q: "", who: "", mine: false };
async function workspace(id, sub) {
  if (!W || W.workspace.id !== id || sub === "reload") W = await api(`/api/w/${id}`);
  if (sub === "members") return membersView();
  view = sub === "list" ? "list" : sub === "calendar" ? "calendar" : "board";
  if (!boardId || !W.boards.find((b) => b.id === boardId)) boardId = W.boards[0].id;
  const canEdit = W.workspace.role !== "viewer";
  const tab = (k, t, href) => h("a", { class: "btn sm" + (view === k ? " pri" : ""), href }, t);
  const bsel = h("select", { "aria-label": "Board", style: "width:auto", onchange: (e) => { boardId = e.target.value; workspace(id, view); } }, W.boards.map((b) => h("option", { value: b.id, selected: b.id === boardId }, b.name)));
  const q = h("input", { type: "search", placeholder: "Search tasks", "aria-label": "Search tasks", value: filter.q, style: "width:170px", oninput: (e) => { filter.q = e.target.value; draw(); } });
  const mine = h("label", { class: "row small", style: "margin:0;gap:4px" }, h("input", { type: "checkbox", checked: filter.mine, style: "width:auto;min-height:0", onchange: (e) => { filter.mine = e.target.checked; draw(); } }), "Mine");
  const body = h("div", {});
  const draw = () => { body.replaceChildren(view === "board" ? boardView() : view === "list" ? listView() : calView()); };
  shell(h("div", { class: "stack" },
    h("div", { class: "row spread" }, h("div", {}, h("h1", { style: "margin:0" }, W.workspace.name), h("span", { class: "badge acc" }, W.workspace.role)), h("div", { class: "row" }, tab("members", "Team", `#/w/${id}/members`))),
    h("div", { class: "row" }, h("div", { class: "row" }, tab("board", "Board", `#/w/${id}`), tab("list", "List", `#/w/${id}/list`), tab("calendar", "Calendar", `#/w/${id}/calendar`)), bsel, q, mine, h("div", { class: "grow" }),
      canEdit ? h("button", { class: "btn pri", onclick: () => taskModal(null) }, "+ Task") : null), body), "home");
  draw();
}
function visible(t) {
  if (t.board !== boardId) return false;
  if (filter.mine && t.assignee !== S.user.id) return false;
  if (filter.q && !(t.title + " " + t.descr + " " + t.labels.join(" ")).toLowerCase().includes(filter.q.toLowerCase())) return false;
  return true;
}
const who = (id) => (W.members.find((m) => m.id === id) || {}).name;
function chips(t) {
  const out = [];
  if (t.prio !== "normal") out.push(h("span", { class: "badge " + (t.prio === "urgent" ? "bad" : t.prio === "high" ? "warn" : "") }, PR[t.prio]));
  if (t.due) { const late = !t.done && t.due + 864e5 < Date.now(); out.push(h("span", { class: "badge " + (late ? "bad" : "") }, (late ? "Overdue " : "") + fmtDate(t.due))); }
  if (t.recur) out.push(h("span", { class: "badge" }, "↻ " + RC[t.recur]));
  if (t.remind && !t.done) out.push(h("span", { class: "badge" }, "⏰"));
  t.labels.forEach((l) => out.push(h("span", { class: "badge acc" }, l)));
  if (t.assignee) out.push(h("span", { class: "badge" }, who(t.assignee) || "?"));
  return h("div", { class: "row", style: "gap:5px;margin-top:6px" }, out);
}
async function patch(t, data) { await api(`/api/w/${W.workspace.id}/tasks/${t.id}`, data); W = await api(`/api/w/${W.workspace.id}`); }
function boardView() {
  const canEdit = W.workspace.role !== "viewer";
  const cols = W.cols.filter((c) => c.board === boardId).sort((a, b) => a.pos - b.pos);
  const wrap = h("div", { class: "board" });
  cols.forEach((c, ci) => {
    const tasks = W.tasks.filter((t) => t.col === c.id && visible(t));
    const el = h("section", { class: "col", "aria-label": c.name,
      ondragover: (e) => { if (canEdit) { e.preventDefault(); el.classList.add("over"); } }, ondragleave: () => el.classList.remove("over"),
      ondrop: (e) => { e.preventDefault(); el.classList.remove("over"); const id = e.dataTransfer.getData("text/plain"); const t = W.tasks.find((x) => x.id === id); if (t && t.col !== c.id) guard(async () => { await patch(t, { col: c.id, pos: Date.now() }); boardRedraw(); }); } },
      h("h3", {}, h("span", {}, c.name), h("span", { class: "badge" }, tasks.length)),
      tasks.map((t) => h("div", { class: `tcard pr-${t.prio}${t.done ? " done" : ""}`, draggable: canEdit, tabindex: 0, role: "button", onkeydown: (e) => e.key === "Enter" && taskModal(t), ondragstart: (e) => { e.dataTransfer.setData("text/plain", t.id); }, onclick: (e) => { if (!e.target.closest("button,input")) taskModal(t); } },
        h("div", { class: "row", style: "align-items:flex-start;flex-wrap:nowrap" }, canEdit ? h("input", { type: "checkbox", class: "chk", checked: !!t.done, "aria-label": "Mark done", onchange: (e) => guard(async () => { await patch(t, { done: e.target.checked }); boardRedraw(); }) }) : null, h("div", { class: "tt grow" }, t.title)),
        chips(t),
        canEdit ? h("div", { class: "mv" }, ci > 0 ? h("button", { class: "btn sm ghost", "aria-label": "Move left", onclick: () => guard(async () => { await patch(t, { col: cols[ci - 1].id, pos: Date.now() }); boardRedraw(); }) }, "←") : null, ci < cols.length - 1 ? h("button", { class: "btn sm ghost", "aria-label": "Move right", onclick: () => guard(async () => { await patch(t, { col: cols[ci + 1].id, pos: Date.now() }); boardRedraw(); }) }, "→") : null) : null)),
      canEdit ? h("button", { class: "btn sm ghost", style: "width:100%", onclick: () => taskModal(null, c.id) }, "+ Add task") : null);
    wrap.append(el);
  });
  return wrap;
}
const boardRedraw = () => workspace(W.workspace.id, view);
function listView() {
  const rows = W.tasks.filter(visible).sort((a, b) => a.done - b.done || (a.due || 9e15) - (b.due || 9e15));
  if (!rows.length) return h("div", { class: "card empty" }, "No tasks match.");
  return h("div", { class: "card tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, ["", "Task", "Status", "Due", "Assignee"].map((x) => h("th", {}, x)))),
    h("tbody", {}, rows.map((t) => h("tr", { style: "cursor:pointer", onclick: (e) => { if (!e.target.closest("input")) taskModal(t); } },
      h("td", {}, h("input", { type: "checkbox", class: "chk", checked: !!t.done, "aria-label": "Mark done", disabled: W.workspace.role === "viewer", onchange: (e) => guard(async () => { await patch(t, { done: e.target.checked }); boardRedraw(); }) })),
      h("td", {}, h("div", { class: "tt" }, t.title), chips({ ...t, assignee: null, due: null })), h("td", {}, (W.cols.find((c) => c.id === t.col) || {}).name), h("td", {}, t.due ? fmtDate(t.due) : "-"), h("td", {}, who(t.assignee) || "-"))))));
}
let calMonth = new Date(); calMonth.setDate(1);
function calView() {
  const y = calMonth.getFullYear(), mo = calMonth.getMonth(), first = new Date(y, mo, 1), start = new Date(y, mo, 1 - first.getDay());
  const grid = h("div", { class: "cal" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => h("div", { class: "dh" }, d)));
  const byDay = {}; W.tasks.filter(visible).forEach((t) => { if (t.due) (byDay[dayStr(t.due)] ||= []).push(t); });
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = dayStr(d.getTime());
    grid.append(h("div", { class: "day" + (d.getMonth() !== mo ? " out" : "") + (k === dayStr(Date.now()) ? " today" : "") }, h("div", { class: "small", style: "font-weight:700" }, d.getDate()),
      (byDay[k] || []).slice(0, 3).map((t) => h("div", { class: "ev" + (t.done ? " dn" : ""), tabindex: 0, role: "button", onclick: () => taskModal(t), onkeydown: (e) => e.key === "Enter" && taskModal(t) }, t.title)), (byDay[k] || []).length > 3 ? h("div", { class: "small muted" }, `+${byDay[k].length - 3} more`) : null));
  }
  const go = (n) => { calMonth = new Date(y, mo + n, 1); boardRedraw(); };
  return h("div", { class: "stack" }, h("div", { class: "row spread" }, h("button", { class: "btn sm", onclick: () => go(-1) }, "← Prev"), h("h2", { style: "margin:0" }, calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })), h("button", { class: "btn sm", onclick: () => go(1) }, "Next →")), grid);
}
async function taskModal(t, colId) {
  const w = W.workspace.id, ro = W.workspace.role === "viewer";
  const colsHere = W.cols.filter((c) => c.board === (t ? t.board : boardId));
  const title = h("input", { value: t ? t.title : "", maxlength: 140, placeholder: "What needs to be done?", disabled: ro });
  const descr = h("textarea", { placeholder: "Details", disabled: ro }, t ? t.descr : "");
  const col = h("select", { disabled: ro }, colsHere.map((c) => h("option", { value: c.id, selected: t ? t.col === c.id : c.id === (colId || colsHere[0].id) }, c.name)));
  const asg = h("select", { disabled: ro }, h("option", { value: "" }, "Unassigned"), W.members.map((m) => h("option", { value: m.id, selected: t && t.assignee === m.id }, m.name)));
  const prio = h("select", { disabled: ro }, Object.entries(PR).map(([k, v]) => h("option", { value: k, selected: (t ? t.prio : "normal") === k }, v)));
  const due = h("input", { type: "date", value: t && t.due ? dayStr(t.due) : "", disabled: ro });
  const rec = h("select", { disabled: ro }, Object.entries(RC).map(([k, v]) => h("option", { value: k, selected: (t ? t.recur : "") === k }, v)));
  const rem = h("input", { type: "datetime-local", value: t ? localInput(t.remind) : "", disabled: ro });
  const lab = h("input", { value: t ? t.labels.join(", ") : "", placeholder: "design, urgent", disabled: ro });
  const cm = h("div", { class: "stack" });
  const form = h("form", { class: "stack", onsubmit: (e) => { e.preventDefault(); if (ro) return; guard(async () => {
    const data = { title: title.value, descr: descr.value, col: col.value, assignee: asg.value, prio: prio.value, due: dueDate(due.value), recur: rec.value, remind: parseLocal(rem.value), labels: lab.value };
    if (t) await api(`/api/w/${w}/tasks/${t.id}`, data); else await api(`/api/w/${w}/tasks`, data);
    m.close(); toast("Saved"); W = null; workspace(w, view === "board" ? "" : view);
  }); } }, field("Title", title), field("Description", descr),
    h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fit,minmax(150px,1fr))" }, field("Column", col), field("Assignee", asg), field("Priority", prio), field("Due date", due), field("Repeat", rec), field("Reminder", rem)), field("Labels", lab, "Comma separated"),
    ro ? h("p", { class: "muted small" }, "You have view-only access.") : h("div", { class: "row" }, h("button", { class: "btn pri" }, "Save"), t ? h("button", { type: "button", class: "btn danger", onclick: () => { if (confirm("Delete this task?")) guard(async () => { await api(`/api/w/${w}/tasks/${t.id}`, null, "DELETE"); m.close(); W = null; workspace(w, view === "board" ? "" : view); }); } }, "Delete") : null));
  const m = modal(t ? "Task" : "New task", h("div", { class: "stack" }, form, t ? cm : null), { wide: true });
  if (t) {
    const loadC = async () => { const d = await api(`/api/w/${w}/tasks/${t.id}`); cm.replaceChildren(...[h("h3", {}, "Comments"), d.comments.length ? d.comments.map((c) => h("div", { class: "card" }, h("b", {}, c.name), " ", h("span", { class: "small muted" }, ago(c.ts)), h("div", {}, c.body))) : h("p", { class: "muted small" }, "No comments yet."),
      ro ? null : (() => { const i = h("input", { placeholder: "Write a comment", maxlength: 1000 }); return h("form", { class: "row", onsubmit: (e) => { e.preventDefault(); if (!i.value.trim()) return; guard(async () => { await api(`/api/w/${w}/tasks/${t.id}/comments`, { body: i.value }); loadC(); }); } }, h("div", { class: "grow" }, i), h("button", { class: "btn" }, "Post")); })()].flat().filter(Boolean)); };
    loadC();
  }
}
async function membersView() {
  const w = W.workspace.id, adm = ["owner", "admin"].includes(W.workspace.role);
  const inv = adm ? (await api(`/api/w/${w}/invites`)).invites : [];
  const link = (t) => `${location.origin}/#/join/${t}`;
  const email = h("input", { type: "email", placeholder: "Optional: restrict to an email" }), role = h("select", {}, ["member", "admin", "viewer"].map((r) => h("option", { value: r }, r)));
  shell(h("div", { class: "stack" }, h("div", { class: "row spread" }, h("h1", { style: "margin:0" }, W.workspace.name + " team"), h("a", { class: "btn sm", href: `#/w/${w}` }, "← Back to board")),
    h("div", { class: "card tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, ["Member", "Role", ""].map((x) => h("th", {}, x)))), h("tbody", {}, W.members.map((m) => h("tr", {}, h("td", {}, h("b", {}, m.name), h("div", { class: "small muted" }, m.email)),
      h("td", {}, adm && m.role !== "owner" ? h("select", { style: "width:auto;min-height:32px", "aria-label": "Role", onchange: (e) => guard(async () => { await api(`/api/w/${w}/members/${m.id}`, { role: e.target.value }); toast("Role updated"); }) }, ["admin", "member", "viewer"].map((r) => h("option", { value: r, selected: m.role === r }, r))) : h("span", { class: "badge" }, m.role)),
      h("td", {}, adm && m.role !== "owner" ? h("button", { class: "btn sm danger", onclick: () => confirm("Remove this member?") && guard(async () => { await api(`/api/w/${w}/members/${m.id}`, null, "DELETE"); W = null; membersViewReload(w); }) }, "Remove") : null)))))),
    adm ? h("div", { class: "card stack" }, h("h2", {}, "Invite people"), h("form", { class: "row", onsubmit: (e) => { e.preventDefault(); guard(async () => { const r = await api(`/api/w/${w}/invites`, { email: email.value, role: role.value }); try { await navigator.clipboard.writeText(link(r.token)); toast("Invite link copied"); } catch { toast("Invite created"); } membersViewReload(w); }); } }, h("div", { class: "grow" }, email), role, h("button", { class: "btn pri" }, "Create invite link")),
      inv.length ? h("div", { class: "stack" }, inv.map((i) => h("div", { class: "row spread card" }, h("div", { class: "grow", style: "word-break:break-all" }, h("div", { class: "small" }, link(i.token)), h("div", { class: "small muted" }, `${i.role}${i.email ? " · " + i.email : ""} · expires ${fmtDate(i.exp)}`)), h("button", { class: "btn sm", onclick: async () => { try { await navigator.clipboard.writeText(link(i.token)); toast("Copied"); } catch { toast("Select the link and copy it", true); } } }, "Copy"), h("button", { class: "btn sm danger", onclick: () => guard(async () => { await api(`/api/w/${w}/invites/${i.token}`, null, "DELETE"); membersViewReload(w); }) }, "Revoke")))) : h("p", { class: "muted small" }, "No active invites. Links last 7 days.")) : null,
    h("div", { class: "card stack" }, h("h2", {}, "Activity"), W.activity.length ? W.activity.map((a) => h("div", { class: "small" }, h("b", {}, a.name || "Someone"), " ", a.text, " ", h("span", { class: "muted" }, ago(a.ts)))) : h("p", { class: "muted small" }, "Nothing yet.")),
    h("div", { class: "row" }, W.workspace.role === "owner" ? h("button", { class: "btn danger", onclick: () => prompt(`Type the workspace name to delete it:`) === W.workspace.name && guard(async () => { await api(`/api/w/${w}`, null, "DELETE"); W = null; location.hash = "#/"; }) }, "Delete workspace") : h("button", { class: "btn danger", onclick: () => confirm("Leave this workspace?") && guard(async () => { await api(`/api/w/${w}/leave`, {}); W = null; location.hash = "#/"; }) }, "Leave workspace"),
      adm ? h("button", { class: "btn", onclick: () => guard(async () => { const r = await api(`/api/w/${w}`, { name: prompt("New name", W.workspace.name) || W.workspace.name }); W = null; membersViewReload(w); }) }, "Rename") : null)), "home");
}
const membersViewReload = async (w) => { W = await api(`/api/w/${w}`); membersView(); };
async function myTasks() {
  const d = await api("/api/mytasks"); await refreshUnread();
  shell(h("div", { class: "stack" }, h("h1", {}, "My tasks"), d.tasks.length ? h("div", { class: "card tablewrap" }, h("table", {}, h("tbody", {}, d.tasks.map((t) => h("tr", { style: "cursor:pointer", onclick: () => (location.hash = `#/w/${t.ws}`) }, h("td", {}, h("div", { class: "tt" }, t.title), h("div", { class: "small muted" }, t.wsname)), h("td", {}, t.due ? fmtDate(t.due) : "-"), h("td", {}, h("span", { class: "badge" }, PR[t.prio]))))))) : h("div", { class: "card empty" }, "Nothing assigned to you. Nice.")), "my");
}
async function notes() {
  const d = await api("/api/notes"); await api("/api/notes/read", {}); S.unread = 0;
  shell(h("div", { class: "stack" }, h("h1", {}, "Inbox"), d.notes.length ? d.notes.map((n) => h("a", { class: "card", href: n.link || "#/", style: "text-decoration:none;color:inherit" }, h("div", {}, n.read ? "" : h("span", { class: "badge acc" }, "new"), " ", n.text), h("div", { class: "small muted" }, ago(n.ts)))) : h("div", { class: "card empty" }, "No notifications yet. Assignments, comments and reminders show up here.")), "notes");
}
async function plans() { const d = await api("/api/plans"); shell(h("div", { class: "stack" }, h("h1", {}, "Plans"), plansView(d.plans, S.user.plan), h("p", { class: "muted small" }, "Paid plans are not available yet. Everything on Free works today.")), "plans"); }
function account() {
  const name = h("input", { value: S.user.name, maxlength: 60 }), cur = h("input", { type: "password", autocomplete: "current-password" }), np = h("input", { type: "password", autocomplete: "new-password" });
  shell(h("div", { class: "stack", style: "max-width:520px" }, h("h1", {}, "Account"), h("div", { class: "muted" }, S.user.email + " · plan " + S.user.plan),
    h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { const r = await api("/api/auth/profile", { name: name.value }); S.user = r.user; toast("Saved"); }); } }, h("h2", {}, "Profile"), field("Name", name), h("button", { class: "btn pri" }, "Save")),
    h("form", { class: "card stack", onsubmit: (e) => { e.preventDefault(); guard(async () => { await api("/api/auth/password", { current: cur.value, password: np.value }); cur.value = np.value = ""; toast("Password changed"); }); } }, h("h2", {}, "Password"), field("Current password", cur), field("New password", np, "At least 8 characters"), h("button", { class: "btn" }, "Change password")),
    h("button", { class: "btn", onclick: () => guard(async () => { await api("/api/auth/logout", {}); S.user = null; W = null; route(); }) }, "Log out")), "account");
}
async function join(token) {
  const d = await api(`/api/join/${token}`).catch((e) => ({ error: e.message }));
  if (d.error) return shell(h("div", { class: "card empty" }, h("h2", {}, "Invite problem"), h("p", {}, d.error), h("a", { class: "btn", href: "#/" }, "Go home")), "home");
  shell(h("div", { class: "card stack auth" }, h("h2", {}, `Join ${d.workspace}`), h("p", { class: "muted" }, `You were invited as ${d.role}.`), h("button", { class: "btn pri", onclick: () => guard(async () => { const r = await api(`/api/join/${token}`, {}); W = null; location.hash = `#/w/${r.id}`; }) }, "Accept invite")), "home");
}
async function route() {
  if (location.pathname === "/by-mahmoud") { if (location.hash.length > 1) history.replaceState(null, "", "/" + location.hash); else return shell(byMahmoudView(), ""); }
  if (!S.user) {
    const j = location.hash.match(/^#\/join\//);
    if (j) { sessionStorage.setItem("after", location.hash); }
    return landing();
  }
  const after = sessionStorage.getItem("after"); if (after) { sessionStorage.removeItem("after"); location.hash = after; return; }
  const p = location.hash.replace(/^#/, "") || "/"; let m;
  try {
    if (p === "/") { W = null; return await home(); }
    if (p === "/my") return await myTasks();
    if (p === "/notes") return await notes();
    if (p === "/plans") return await plans();
    if (p === "/account") return account();
    if (p === "/admin") return shell(adminView("Orbit", (a) => h("div", { class: "grid" }, [["Workspaces", a.workspaces], ["Tasks", a.tasks], ["Completed", a.done], ["Invites", a.invites]].map(([l, n]) => h("div", { class: "card" }, h("div", { class: "stat" }, n), h("div", { class: "muted small" }, l))))), "admin");
    if ((m = p.match(/^\/join\/([a-f0-9]+)$/))) return await join(m[1]);
    if ((m = p.match(/^\/w\/([a-f0-9]+)(?:\/(\w+))?$/))) return await workspace(m[1], m[2] || "");
    location.hash = "#/";
  } catch (e) {
    if (e.status === 401) { S.user = null; return landing(); }
    shell(h("div", { class: "card empty" }, h("h2", {}, "Couldn't load this page"), h("p", {}, e.message), h("a", { class: "btn", href: "#/" }, "Go home")), "home");
  }
}
addEventListener("hashchange", route);
(async () => { try { S.user = (await api("/api/auth/me")).user; } catch { /* offline */ } route(); })();
