# To-Do List

Task manager with categories, priorities and end-to-end encrypted cloud sync.

**Live:** https://to-do-list.mahmodsalah.workers.dev

## Features

- Create, edit, complete and organise tasks with categories and priorities
- Optional cloud sync: tasks are encrypted in the browser (AES-GCM) before upload, so the server only stores ciphertext
- Works without an account: the sync code is the only key
- Responsive, keyboard friendly interface

## Tech stack

React, TypeScript, Vite, Tailwind CSS

## Hosting

Cloudflare Workers (static assets) + a shared Workers/KV API for encrypted sync. No paid services.

## Run locally

```bash
npm install
npm run dev
```

Build with `npm run build`, type-check with `npx tsc --noEmit`.

## Notes

src/cloudSync.ts and src/components/SyncPanel.tsx hold the sync client.

## Author

Mahmoud Salah, https://github.com/engMahmoudSalah
