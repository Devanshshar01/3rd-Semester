<div align="center">
  <img src="https://raw.githubusercontent.com/Devanshshar01/3rd-Semester/main/public/studyspace-preview.svg" alt="A preview of studyspace: a calm, paper-toned learning dashboard with paths, daily tasks, and focus tools" width="100%" />
  <h1>studyspace</h1>
  <p><strong>A little room to learn, in your own way.</strong></p>
  <p>A private, offline-first workspace for learning paths, notes, next steps, practice, and focused study.</p>
  <p>
    <a href="https://github.com/Devanshshar01/3rd-Semester"><img alt="GitHub repository" src="https://img.shields.io/badge/GitHub-studyspace-365d48?style=flat-square&logo=github&logoColor=white"></a>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-vanilla-365d48?style=flat-square&logo=typescript&logoColor=white">
    <img alt="Offline first" src="https://img.shields.io/badge/works-offline-b87957?style=flat-square">
    <img alt="No runtime dependencies" src="https://img.shields.io/badge/runtime%20dependencies-none-727a67?style=flat-square">
  </p>
</div>

---

## Personal learning, with optional calls

Create learning paths, notes, tasks, practice questions, and study sessions. Personal study content remains stored in this browser. Clerk sign-in is used for protected account and call APIs; PostgreSQL stores profile/friend/room/call metadata, and LiveKit carries voice, video, and screen-share media.

## Start locally

**Requirements:** Node.js 20.19+ or 22.12+, npm, PostgreSQL, a Clerk application, and LiveKit Cloud or a LiveKit server.

1. Create a Clerk application and enable email and Google sign-in in its dashboard. Add `http://localhost:3000` to allowed origins/redirect URLs.
2. Create a PostgreSQL database, then apply `database/schema.sql` (for example, `psql "$env:DATABASE_URL" -f database/schema.sql` in PowerShell).
3. Copy `.env.example` to `.env` and replace the example values. Keep `CLERK_SECRET_KEY`, `DATABASE_URL`, and `LIVEKIT_API_SECRET` server-side; only the Clerk publishable key is exposed to the browser.
4. Install and run the combined API + Vite server:

```bash
npm install
npm run dev
```

The server runs on `http://localhost:3000`. Sign in using Clerk, open **Study call**, create a room, or join using its room ID. Browser permission is required to publish microphone/camera or share the screen.

## Configuration

- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: Clerk server verification and profile lookup.
- `VITE_CLERK_PUBLISHABLE_KEY`: public Clerk key used by Clerk.js. Must match the server's Clerk instance.
- `DATABASE_URL`: PostgreSQL connection string. Production connections use TLS certificate verification.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`: LiveKit endpoint and **server-only** credentials.
- `PORT`, `NODE_ENV`: HTTP port and environment mode.

Google OAuth and email/password or email-code methods are configured in Clerk, not implemented as a custom identity system. LiveKit tokens are minted on the server for authorized room members and expire after 15 minutes. HTTPS/WSS is required in production. The included initial SQL schema is for a fresh database; use versioned migrations for later schema changes.

## API foundation

All `/api` routes require Clerk sessions. The server exposes `/api/me`, `/api/users/:userId`, friend/request routes, room/member routes, LiveKit token issuance, and call create/read/update/history routes. Errors use `{ "error": { "code", "message", "details" } }`. The schema includes profile, friendship, request, group, room, membership, notification, call, and call-participant metadata. Media is never written to PostgreSQL.

## Build and verify

```bash
npm run typecheck
npm run build
npm start
```

## Privacy & current scope

- Existing study content remains local-only; authentication does not yet synchronize notes, learning paths, or tasks into PostgreSQL.
- Room membership is managed by the protected API; this first UI provides room creation/joining and call controls, while invite/friend-management screens are not included.
- Presence is reported as offline in the friends response until a real-time presence integration is added; PostgreSQL is not used as a heartbeat store.
- PostgreSQL/Clerk/LiveKit are external services and require valid credentials and schema setup before account and call flows can run.
- Vite and vanilla TypeScript remain the UI; Express hosts the API, Clerk handles identity, PostgreSQL stores app metadata, and LiveKit handles media.

---

<div align="center">
  <sub>Made for learning at your own pace. Your space, your way.</sub>
</div>
