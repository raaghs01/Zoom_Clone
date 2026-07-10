# Database Design
## Zoom Clone — SQLite Schema

Three tables model the whole domain: **users**, **meetings**, **participants**. SQLite via SQLAlchemy 2.x. This document is the source of truth for the schema; the schema is a graded artifact, so keep relationships explicit.

## Entity-relationship summary

```
users (1) ────< (many) meetings          a user hosts many meetings
meetings (1) ──< (many) participants      a meeting has many participants
users (1) ────< (many) participants       a user may appear as a participant (nullable; guests have no user)
```

## Tables

### users
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| full_name | TEXT | NOT NULL |
| username | TEXT | NOT NULL, UNIQUE, indexed |
| email | TEXT | NOT NULL, UNIQUE, indexed |
| password | TEXT | NOT NULL (bcrypt hash) |
| created_at | DATETIME | default now (UTC) |

### meetings
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| meeting_code | TEXT | NOT NULL, UNIQUE, indexed — format `xxx-xxxx-xxxx` |
| title | TEXT | NOT NULL, default "Instant Meeting" |
| description | TEXT | default "" |
| host_id | INTEGER | FK → users.id, NOT NULL |
| status | TEXT | NOT NULL — `instant` \| `scheduled` |
| scheduled_at | DATETIME | NULLABLE (set for scheduled) |
| duration_min | INTEGER | NULLABLE (set for scheduled) |
| passcode | TEXT | NULLABLE |
| waiting_room | BOOLEAN | default false |
| is_active | BOOLEAN | default true (host End sets false) |
| created_at | DATETIME | default now (UTC) |

### participants
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| meeting_id | INTEGER | FK → meetings.id, NOT NULL |
| user_id | INTEGER | FK → users.id, NULLABLE (guests) |
| display_name | TEXT | NOT NULL |
| role | TEXT | NOT NULL — `host` \| `participant` |
| is_muted | BOOLEAN | default false |
| is_removed | BOOLEAN | default false |
| joined_at | DATETIME | default now (UTC) |
| left_at | DATETIME | NULLABLE |

## Relationships (SQLAlchemy)

- `User.hosted_meetings` ↔ `Meeting.host` (one-to-many, cascade delete meetings with user).
- `Meeting.participants` ↔ `Participant.meeting` (one-to-many, cascade delete participants with meeting).
- `User.participations` ↔ `Participant.user` (one-to-many, nullable).

## Design rationale

- **Separate `participants` table** (rather than a JSON column or a users↔meetings M2M) so guests without accounts can join, per-participant state (`is_muted`, `is_removed`, `left_at`) can be tracked, and host controls have concrete rows to act on.
- **`host_id` on meetings** gives a fast owner lookup for host-authorization checks; the host also gets a `participants` row (role=host) so the participants panel and mute-all logic treat everyone uniformly.
- **`status` enum** cleanly separates instant vs scheduled without a nullable-field guessing game; `scheduled_at` / `duration_min` are only populated for scheduled.
- **`meeting_code` unique + indexed** because it's the primary lookup key for join/validate and appears in invite links.
- **Soft signals** (`is_active`, `is_removed`, `left_at`) rather than hard deletes, so history/recent-meetings remain queryable.

## Seed data (seed.py)

- One default user: `Demo User` / `demo` / `demo@zoom.dev` / `Demo1234` (hashed).
- The default user's PMI-style meeting (a persistent instant meeting) e.g. code `732-863-5057`.
- 2–3 scheduled meetings in the near future (varied titles/durations) so **Upcoming** is populated.
- 1–2 past/instant meetings so **Recent** is populated.
- A couple of participant rows on one meeting so the participants panel + host controls are demoable.

Seed must be idempotent (check-then-insert) so re-running doesn't duplicate.
