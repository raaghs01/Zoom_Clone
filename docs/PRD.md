# Product Requirements Document (PRD)
## Video Conferencing Platform — Zoom Clone

**Project type:** SDE Fullstack Assignment
**Author:** (you)
**Status:** Ready for build
**Deadline:** 1 day from assignment receipt

---

## 1. Overview

Build a functional video-conferencing web application that replicates the **Zoom Workplace web app** (`app.zoom.us`) — its design, user experience, and core meeting workflows. Users can create instant meetings, join meetings, schedule meetings, manage participants, and move through a clean, professional interface that visually and functionally resembles modern Zoom.

**This is a management-and-workflow clone, not a real-time media product.** WebRTC / live audio-video is explicitly **out of scope** for this phase. The "meeting room" is a faithful UI recreation of the Zoom in-meeting screen (participant tiles, control bar, host controls) backed by real meeting/participant data — but it does not transmit live media.

---

## 2. Goals & Non-Goals

### Goals
- Recreate the Zoom Workplace web-app shell (left nav rail, top bar, content card) with high visual fidelity.
- Implement the four core workflows: **Dashboard**, **Instant Meeting**, **Join Meeting**, **Schedule Meeting**.
- Persist all data in SQLite with a well-designed, properly related schema.
- Provide JWT authentication (login/signup) plus a seeded default user for instant demo access.
- Implement host controls (mute / mute-all / remove participant) as the in-room bonus.
- Ship clean, modular, readable code with consistent API response envelopes and error handling.
- Deploy both frontend and backend, and provide a public GitHub repo with a thorough README.

### Non-Goals (out of scope)
- Real-time WebRTC audio/video streaming or screen share.
- Real chat messaging, reactions, whiteboard, recordings, or AI features (these appear in Zoom's UI but are not required; render as non-functional placeholders only where needed for visual fidelity).
- Email delivery of invites (invite links are generated and copyable, not emailed).
- Calendar integrations, billing / "Upgrade to Pro" flows.

---

## 3. Tech Stack (locked)

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript, `src/` layout) |
| Styling | Tailwind CSS + shadcn/ui primitives |
| Frontend libs | axios, react-hot-toast, lucide-react, zustand (auth state), clsx + tailwind-merge |
| Backend | Python + FastAPI |
| ORM / validation | SQLAlchemy 2.x + Pydantic v2 |
| Database | SQLite |
| Auth | JWT (access token), bcrypt password hashing |

The frontend is a **standalone SPA** that calls the FastAPI backend over HTTP (`/api/v1/...`). Next.js route handlers are **not** used as the backend.

---

## 4. User Roles

| Role | Description |
|---|---|
| Authenticated user | Signs up / logs in. Can host meetings, schedule, join, and see their dashboard. A seeded default user (`demo@zoom.dev` / `Demo1234`) exists so the app is usable instantly, satisfying the assignment's "assume a default user is logged in." |
| Host | The user who created a meeting. Has host controls inside the room. |
| Guest participant | Joins a meeting by ID + display name without an account. Stored as a participant with a null `user_id`. |

---

## 5. Core Features & Requirements

### 5.1 Landing Dashboard (`/`)
Recreates the Zoom Workplace home screen.

**Requirements**
- App shell: left nav rail (Home, Meetings, Chat, More; gear/Settings pinned bottom), top bar (Zoom Workplace wordmark, back/forward/history controls, centered search pill, "Upgrade to Pro" button, user avatar).
- Centered live clock (`HH:MM AM/PM`) and date (`Friday, July 10`) that update every second.
- Three action tiles, centered:
  - **New meeting** — orange rounded-square video-camera icon, with a ▾ dropdown (options: "Use my Personal Meeting ID (PMI)", show PMI, Copy ID, Copy Invitation).
  - **Join** — blue plus icon.
  - **Schedule** — blue calendar icon.
- **Upcoming meetings** section — scheduled meetings that haven't ended, soonest first.
- **Recent meetings** section — instant/past meetings, most recent first.
- Empty states ("No upcoming meetings") matching Zoom.

### 5.2 Instant Meeting Creation
**Requirements**
- Clicking **New meeting** creates a meeting instantly via `POST /meetings/instant`.
- Backend generates a unique **Zoom-style meeting code** (format `xxx-xxxx-xxxx`, digits) and a shareable **invite link** (`{FRONTEND_URL}/join?code={meeting_code}`).
- The creator is recorded as **host** (a participant row with role=host).
- User is redirected to the meeting room (`/meeting/{code}`).

### 5.3 Join Meeting (`/join`)
**Requirements**
- "Join Meeting" screen with an input for **Meeting ID or invite link** and a **display name** field (required — guests must enter a name before joining).
- Accept either a raw meeting code or a full invite link (parse the code out of the link).
- **Validate meeting existence** via `GET /meetings/{code}`; show a toast error if not found or inactive.
- On success, create a participant (role=participant) and redirect to `/meeting/{code}`.
- **Join** button disabled until both fields are filled (mirrors Zoom).

### 5.4 Schedule Meetings (`/schedule`)
**Requirements**
- Form fields: **Topic/Title** (required), **Description** (optional, "+ Add Description" reveal), **When** (date picker + time + AM/PM), **Duration** (hours + minutes), auto-generated Meeting ID (Generate Automatically vs Personal Meeting ID radio), optional **Passcode**, **Waiting Room** toggle.
- On save (`POST /meetings/schedule`): store meeting with `status=scheduled`, `scheduled_at`, `duration_min`; auto-generate meeting code + invite link.
- Redirect to Meetings tab; the new meeting appears under **Upcoming**.
- **Save** / **Cancel** buttons.

### 5.5 Meetings Tab (`/meetings`)
**Requirements**
- Two-pane layout: left = list with an "Upcoming" toggle and meeting cards (the user's PMI card pinned at top, styled blue); right = detail pane for the selected meeting.
- Detail pane: title, meeting ID, **Start** (host → room), **Copy Invitation**, **Edit** buttons, "Show Meeting Invitation".
- "No upcoming meetings" empty state; "Add a calendar" footer link (non-functional placeholder).

### 5.6 In-Meeting Room (`/meeting/[code]`)
Recreates Zoom's in-meeting screen (UI only, no live media).

**Requirements**
- Pre-join modal: "Do you want people to see you in the meeting?" → "Use microphone and camera" / "Continue without…". (Purely cosmetic; sets a local mic/cam toggle state.)
- Dark meeting stage showing participant tiles: avatar with initial on a colored square, name label bottom-left with a mute indicator.
- Bottom control bar: Mute/Unmute, Video, Participants, Chat, React, Share, Host tools, Zoom AI, More, and a red **End** button. Non-host-critical buttons may be visual-only; Mute/Video toggle local state.
- **Participants panel** (right drawer): "Participants (N)", each row with mute/video state.
- **Host controls (bonus):** if the current user is the host — **Mute All**, **Mute** a specific participant, **Remove** a participant. These call the backend and update participant state.
- **End** (host) ends the meeting (`is_active=false`) and returns to dashboard; **Leave** (participant) sets `left_at` and returns.

### 5.7 Authentication (bonus, included)
**Requirements**
- `/login` and `/signup` pages styled to match the app.
- Signup: full name, username, email, password (validated: ≥6 chars, 1 uppercase, 1 number).
- Login issues a JWT stored client-side; axios attaches it as a bearer token.
- Protected routes redirect to `/login` when unauthenticated. Seeded default user allows instant login.

---

## 6. Data Model (SQLite)

Three tables. See `DATABASE.md` for full DDL, columns, and rationale.

- **users** — id, full_name, username (unique), email (unique), password (bcrypt hash), created_at.
- **meetings** — id, meeting_code (unique), title, description, host_id → users, status (`instant` | `scheduled`), scheduled_at (nullable), duration_min (nullable), passcode (nullable), waiting_room (bool), is_active (bool), created_at.
- **participants** — id, meeting_id → meetings, user_id → users (nullable, for guests), display_name, role (`host` | `participant`), is_muted (bool), is_removed (bool), joined_at, left_at (nullable).

Relationships: a user hosts many meetings; a meeting has many participants; a participant optionally links to a user.

---

## 7. API Surface (summary)

Full contract in `API_SPEC.md`. All responses use the envelope `{ statusCode, data, message, success }`. Base path `/api/v1`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account, return user + token |
| POST | `/auth/login` | Authenticate, return user + token |
| GET | `/auth/me` | Current user (JWT) |
| POST | `/meetings/instant` | Create instant meeting (JWT) |
| POST | `/meetings/schedule` | Create scheduled meeting (JWT) |
| GET | `/meetings` | List my meetings (upcoming + recent) (JWT) |
| GET | `/meetings/{code}` | Get meeting by code (validate existence) |
| PATCH | `/meetings/{code}` | Edit a scheduled meeting (JWT, host) |
| POST | `/meetings/{code}/end` | End meeting (JWT, host) |
| POST | `/meetings/{code}/join` | Join meeting (creates participant) |
| GET | `/meetings/{code}/participants` | List participants |
| POST | `/meetings/{code}/participants/{id}/mute` | Mute one (JWT, host) |
| POST | `/meetings/{code}/participants/mute-all` | Mute all (JWT, host) |
| POST | `/meetings/{code}/participants/{id}/remove` | Remove one (JWT, host) |

---

## 8. UX / Visual Spec

Full detail in `UI_SPEC.md`. Key tokens:

- **Zoom blue** `#0E71EB` (primary buttons, Join/Schedule tiles, links)
- **New-meeting orange** `#FF7A00`
- **Meeting stage dark** `#1A1A1A`
- **App background** light grey `#E5E6EA`; content cards white, rounded, subtle shadow
- **Avatar green** `#3B7A57`
- Font: system UI / Inter-like sans; clock is large and light-weight.
- Unify **everything** under the modern PWA-shell look (home, meetings, join, room). Do **not** replicate the legacy `zoom.us` scheduling chrome — render the schedule form inside the same shell for consistency.

---

## 9. Acceptance Criteria

- [ ] All four core features work end-to-end against the real backend.
- [ ] Dashboard visually resembles Zoom Workplace (shell, tiles, clock, sections).
- [ ] Instant meeting generates a unique code + invite link and redirects to the room.
- [ ] Join validates existence, requires a display name, and rejects bad codes.
- [ ] Scheduled meetings persist and appear under Upcoming.
- [ ] SQLite schema has proper FKs and relationships; DB is seeded with sample data.
- [ ] API responses use the consistent envelope; errors return the envelope with `success:false`.
- [ ] Auth (login/signup) works; default seeded user can log in instantly.
- [ ] Host controls (mute / mute-all / remove) function in the room.
- [ ] README covers setup, stack, schema, and assumptions.
- [ ] Both apps deployed; public GitHub repo submitted.

---

## 10. Deliverables

1. Public GitHub repository (backend + frontend, or a monorepo with `/server` and `/client`).
2. Deployed frontend (Vercel) and backend (Render / Railway).
3. README with setup instructions, tech stack, schema overview, and assumptions.
4. Seed script producing a default user and sample meetings.

---

## 11. Assumptions

- Real-time media is out of scope; the room is a UI recreation backed by real meeting data.
- A default seeded user satisfies "assume a default user is logged in," while full auth is also provided.
- Guests join by display name without an account (participant row with null user_id).
- Invite links point at the frontend `/join?code=...`; no email is sent.
- "Chat", "React", "Share", "Zoom AI", "Whiteboard", "Recordings" are visual placeholders only.
