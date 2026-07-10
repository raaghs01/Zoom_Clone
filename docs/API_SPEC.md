# API Specification
## Zoom Clone — FastAPI Backend

Base URL (dev): `http://localhost:8000`
Base path: `/api/v1`
Auth: JWT bearer token in `Authorization: Bearer <token>` (or `auth-token` header).

## Response envelope

**Every** response — success or error — uses this shape.

Success:
```json
{
  "statusCode": 200,
  "data": { },
  "message": "Success",
  "success": true
}
```

Error:
```json
{
  "statusCode": 404,
  "data": null,
  "message": "Meeting not found",
  "success": false,
  "errors": []
}
```

Validation error (422): `errors` is an array of `{ "field": "title", "message": "Meeting title is required" }`.

---

## Auth

### POST `/api/v1/auth/register`
Body:
```json
{ "full_name": "Demo User", "username": "demo", "email": "demo@zoom.dev", "password": "Demo1234" }
```
Validation: full_name ≥2 chars; username 3–20 chars `[a-zA-Z0-9_.]`; valid email; password ≥6 chars, ≥1 uppercase, ≥1 number.
`201` → `data: { user: {...}, access_token: "..." }`. Conflict → `409`.

### POST `/api/v1/auth/login`
Body: `{ "email": "demo@zoom.dev", "password": "Demo1234" }`
`200` → `data: { user: {...}, access_token: "..." }`. Bad creds → `401`.

### GET `/api/v1/auth/me`  *(JWT)*
`200` → `data: { user }`. Missing/invalid token → `401`.

---

## Meetings

### POST `/api/v1/meetings/instant`  *(JWT)*
Body (optional): `{ "title": "Instant Meeting" }`
Creates a meeting with `status=instant`, generates unique `meeting_code` (`xxx-xxxx-xxxx`) and invite link, adds the creator as a host participant.
`201` → `data: { meeting }` (includes `meeting_code`, `invite_link`, `host`).

### POST `/api/v1/meetings/schedule`  *(JWT)*
Body:
```json
{
  "title": "Sprint Planning",
  "description": "Q3 kickoff",
  "scheduled_at": "2026-07-15T11:00:00",
  "duration_min": 40,
  "passcode": "T6WJnB",
  "waiting_room": false
}
```
Validation: title required; duration_min > 0; scheduled_at is a valid datetime.
`201` → `data: { meeting }` with `status=scheduled`.

### GET `/api/v1/meetings`  *(JWT)*
Returns the current user's meetings split for the dashboard.
`200` → `data: { upcoming: [meeting], recent: [meeting], pmi: {...} }`
- `upcoming`: scheduled, not ended, `scheduled_at` ≥ now, soonest first.
- `recent`: instant or past meetings hosted by the user, newest first.

### GET `/api/v1/meetings/{code}`
Validate meeting existence (used by Join). No auth required (guests need it).
`200` → `data: { meeting }`. Not found / inactive → `404`.

### PATCH `/api/v1/meetings/{code}`  *(JWT, host only)*
Body: any subset of `{ title, description, scheduled_at, duration_min, passcode, waiting_room }`.
`200` → `data: { meeting }`. Non-host → `403`.

### POST `/api/v1/meetings/{code}/end`  *(JWT, host only)*
Sets `is_active=false`.
`200` → `data: { meeting }`.

---

## Participants

### POST `/api/v1/meetings/{code}/join`
Body: `{ "display_name": "Alex" }` (required). If a JWT is present, links `user_id`; otherwise a guest.
Validates the meeting exists and is active. Creates a participant with role=participant.
`201` → `data: { participant, meeting }`. Not found/inactive → `404`.

### GET `/api/v1/meetings/{code}/participants`
`200` → `data: { participants: [ { id, display_name, role, is_muted, is_removed, joined_at } ] }`.

### POST `/api/v1/meetings/{code}/participants/{participant_id}/mute`  *(JWT, host)*
Toggles/sets `is_muted=true` for one participant.
`200` → `data: { participant }`.

### POST `/api/v1/meetings/{code}/participants/mute-all`  *(JWT, host)*
Sets `is_muted=true` for all non-host participants.
`200` → `data: { participants }`.

### POST `/api/v1/meetings/{code}/participants/{participant_id}/remove`  *(JWT, host)*
Sets `is_removed=true` and `left_at=now`.
`200` → `data: { participant }`.

---

## Object shapes

**user**
```json
{ "id": 1, "full_name": "Demo User", "username": "demo", "email": "demo@zoom.dev", "created_at": "..." }
```

**meeting**
```json
{
  "id": 1,
  "meeting_code": "732-863-5057",
  "title": "Instant Meeting",
  "description": "",
  "status": "instant",
  "scheduled_at": null,
  "duration_min": null,
  "passcode": null,
  "waiting_room": false,
  "is_active": true,
  "invite_link": "http://localhost:3000/join?code=732-863-5057",
  "created_at": "...",
  "host": { "id": 1, "full_name": "Demo User", "username": "demo" }
}
```

**participant**
```json
{
  "id": 1, "display_name": "Demo User", "role": "host",
  "is_muted": false, "is_removed": false,
  "joined_at": "...", "left_at": null
}
```

## Notes
- `meeting_code` display format is `xxx-xxxx-xxxx`; the `/join` endpoint accepts the code with or without dashes and can also parse it out of a full invite link.
- `invite_link` is computed from `FRONTEND_URL` + `/join?code=` + `meeting_code`.
- Host authorization: an endpoint marked *host only* checks that the JWT user is the meeting's `host_id`, else `403`.
