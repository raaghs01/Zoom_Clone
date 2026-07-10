# Build Plan
## Zoom Clone — Ordered Task Breakdown

Two phases, backend first. Each task is small and verifiable. Check things off as you go. Verify the backend with curl before starting the frontend so the API contract is real.

## Phase 0 — Repo setup
- [ ] Create monorepo: `/server`, `/client`, `/docs` (this docs folder), root `README.md`, root `.gitignore`.
- [ ] Add `CLAUDE.md` at repo root.

## Phase 1 — Backend (FastAPI)

### 1.1 Scaffold
- [ ] `server/requirements.txt` (fastapi, uvicorn[standard], sqlalchemy, pydantic, pydantic-settings, python-jose[cryptography], passlib[bcrypt], python-multipart, email-validator).
- [ ] `server/.env.example` (PORT, CORS_ORIGIN, DATABASE_URL, ACCESS_TOKEN_SECRET, FRONTEND_URL, default-user vars).
- [ ] Folder tree per `CLAUDE.md`.

### 1.2 Core
- [ ] `config.py` — pydantic-settings `Settings`.
- [ ] `db/database.py` — engine, SessionLocal, Base, `get_db()`, `connect_db()`.
- [ ] `utils/api_error.py`, `utils/api_response.py`, `utils/security.py` (bcrypt + JWT), `utils/constants.py` (ParticipantRole, MeetingStatus).
- [ ] `middlewares/error_handler.py` — `register_error_handlers(app)` (ApiError, RequestValidationError→422 {field,message}, HTTPException, generic 500).
- [ ] `middlewares/auth.py` — `verify_jwt` dependency.

### 1.3 Models
- [ ] `models/user.py`, `models/meeting.py`, `models/participant.py` with relationships (see DATABASE.md).
- [ ] `models/__init__.py` importing all three.

### 1.4 Validators (Pydantic)
- [ ] `validators/auth.py` — RegisterInput, LoginInput, UserOut, AuthOut (with the exact validation rules).
- [ ] `validators/meeting.py` — InstantMeetingInput, ScheduleMeetingInput, JoinMeetingInput, MeetingOut (+ host), ParticipantOut, MeetingListOut.

### 1.5 Controllers
- [ ] `controllers/auth_controller.py` — register, login (raise ApiError on conflict/bad creds).
- [ ] `controllers/meeting_controller.py` — create_instant, schedule, list_my_meetings (upcoming/recent/pmi), get_by_code, edit, end, join, list_participants, mute_one, mute_all, remove_one. Include a unique `meeting_code` generator (`xxx-xxxx-xxxx`) and invite-link builder. Host-only checks raise 403.

### 1.6 Routes
- [ ] `routes/auth_routes.py` — /auth/register, /auth/login, /auth/me.
- [ ] `routes/meeting_routes.py` — all meeting + participant endpoints (literal routes before parameterized; mute-all before /{id}).

### 1.7 App + seed
- [ ] `main.py` — app factory, CORS (allow FRONTEND_URL), mount routers under `/api/v1`, `register_error_handlers`, startup event: `connect_db()` then seed.
- [ ] `seed.py` — idempotent default user + PMI meeting + sample upcoming/recent + a few participants.

### 1.8 Verify
- [ ] `uvicorn app.main:app --reload`; curl register/login, instant, schedule, list, join, participants, mute-all. Confirm the envelope shape and error cases (404 bad code, 401 no token, 403 non-host, 422 validation).

## Phase 2 — Frontend (Next.js 14)

### 2.1 Scaffold
- [ ] `create-next-app` in `/client` (TS, App Router, Tailwind, `src/`).
- [ ] Install axios, react-hot-toast, lucide-react, zustand, clsx, tailwind-merge; init shadcn/ui.
- [ ] `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`.
- [ ] `lib/utils.ts` (cn), `lib/axios.ts` (instance + bearer interceptor), `store/auth.ts` (zustand).
- [ ] Design tokens into `tailwind.config` / globals (the UI_SPEC colors).

### 2.2 Shell & layout
- [ ] `components/layout/Sidebar.tsx`, `TopBar.tsx`; `app/layout.tsx` composes AppShell + `<Toaster/>`.
- [ ] shadcn primitives used: button, input, card, dropdown-menu, avatar, dialog, checkbox, select.

### 2.3 Dashboard (`app/page.tsx`)
- [ ] Live clock + date; three action tiles (`components/meeting/ActionTiles.tsx`) with the New-meeting dropdown.
- [ ] Upcoming + Recent sections fed by `GET /meetings`.
- [ ] New meeting → `POST /meetings/instant` → redirect to `/meeting/{code}`.

### 2.4 Auth
- [ ] `(auth)/login/page.tsx`, `(auth)/signup/page.tsx` (course-style form pattern + toast).
- [ ] Store token in zustand + localStorage; axios attaches it; unauth redirects to /login. Prefill demo creds hint.

### 2.5 Join (`app/join/page.tsx`)
- [ ] Meeting ID/link input + required Your Name; validate via `GET /meetings/{code}`; `POST /join`; disabled Join until filled; redirect to room. Support `?code=` query prefill (from invite links).

### 2.6 Schedule (`app/schedule/page.tsx`)
- [ ] Full form per UI_SPEC; `POST /meetings/schedule`; toast + redirect to /meetings.

### 2.7 Meetings (`app/meetings/page.tsx`)
- [ ] Two-pane; PMI card pinned blue; list upcoming; detail pane with Start/Copy Invitation/Edit; copy → clipboard + toast.

### 2.8 Meeting room (`app/meeting/[code]/page.tsx`)
- [ ] Pre-join modal; dark stage with participant tiles; bottom control bar; Participants drawer.
- [ ] Poll/refresh `GET /participants`; host controls (mute / mute-all / remove) wired to backend; End/Leave.

### 2.9 Polish
- [ ] Responsive (bonus): rail collapses, tiles stack, room grid adapts.
- [ ] Loading states on all primary buttons; empty states; 404 handling for bad meeting codes.

## Phase 3 — Docs & deploy
- [ ] Root README: overview, stack, setup (server + client), env vars, schema diagram/summary, assumptions, screenshots.
- [ ] Deploy backend (Render/Railway) — set env vars, use a persistent SQLite path or note ephemerality.
- [ ] Deploy frontend (Vercel) — set `NEXT_PUBLIC_API_URL` to the deployed backend; set backend `FRONTEND_URL`/CORS to the Vercel URL.
- [ ] Push to public GitHub; submit repo + deployed links.

## Definition of done
Matches the PRD §9 acceptance criteria. Core flows work against the deployed backend; schema seeded; envelope + error handling consistent; README complete.
