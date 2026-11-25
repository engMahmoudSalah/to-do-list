# Orbit Tasks

Team task manager: workspaces, invites with roles, kanban boards, list and calendar views, recurring tasks, reminders, comments, in-app inbox, plans (Free live, Pro draft) and an admin dashboard with audit log.

Live: https://to-do-list.mahmodsalah.workers.dev

## Stack
Cloudflare Worker + SQLite Durable Object + static assets. No build step. PBKDF2 passwords, HttpOnly SameSite sessions, per-IP rate limits, origin checks.

## Deploy
`npx wrangler deploy` (also what Cloudflare git builds run). Admin access: the account that submits the admin key at `#/admin` becomes admin (only the key's SHA-256 is in the code).
