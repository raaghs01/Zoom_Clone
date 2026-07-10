# UI Specification
## Zoom Clone — Visual & Interaction Spec

Recreate the **modern Zoom Workplace web app** (`app.zoom.us`). Unify every screen under this one shell — do **not** replicate the legacy `zoom.us` scheduling chrome seen in some reference screenshots; render the schedule form inside the same shell for a coherent app.

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--zoom-blue` | `#0E71EB` | primary buttons, Join/Schedule tiles, links, active states |
| `--zoom-blue-dark` | `#0B5CFF` | hover / pressed |
| `--orange` | `#FF7A00` | New-meeting tile |
| `--meeting-dark` | `#1A1A1A` | in-meeting stage background |
| `--app-bg` | `#E5E6EA` | app background behind the white card |
| `--card` | `#FFFFFF` | content surfaces |
| `--avatar-green` | `#3B7A57` | user avatar |
| `--text` | `#1A1A1A` | primary text |
| `--text-muted` | `#6B7280` | secondary text, labels |
| radius | `12–16px` on cards/tiles, `8px` on inputs/buttons | |
| shadow | soft, low-opacity on cards and active nav tile | |

Font: Inter / system UI sans. The dashboard clock is large (~64px) and light-weight.

## Global shell

Present on all app screens (not on login/signup).

- **Left nav rail** (~88px wide, white): stacked icon+label items — **Home**, **Meetings**, **Chat**, **More** (three-dot). Active item is a white rounded tile with soft shadow and blue-tinted icon. **Settings** gear pinned at the bottom.
- **Top bar** (white, thin): "zoom **Workplace**" wordmark (left); back / forward / history circular controls; centered **search pill** ("Search  Ctrl+K", muted); right side **Upgrade to Pro** (outlined pill) and a **green circular avatar** with the user's initial.
- **Content card**: white, rounded, sits on the grey app bg with margin around it.

## Screens

### Dashboard (`/`)
- Vertically centered stack: big **clock** `11:06 PM`, muted **date** `Friday, July 10` beneath.
- Row of three **action tiles**, centered, each = rounded-square icon (56–64px) above a label:
  - **New meeting** — orange square, white video-camera icon; label has a ▾ caret. Clicking the caret opens a menu: "Use my Personal Meeting ID (PMI)" (checkbox), the PMI number row with a `>` submenu (Copy ID / Copy Invitation / PMI Settings). Clicking the tile itself creates an instant meeting.
  - **Join** — blue square, white plus icon.
  - **Schedule** — blue square, white calendar icon (shows a date number like 19).
- Below tiles: **Upcoming meetings** and **Recent meetings** sections (cards or a simple list). Empty state text matches Zoom ("No upcoming meetings").

### Meetings (`/meetings`)
- Two panes inside the card.
- **Left pane:** a refresh icon + an **Upcoming** pill toggle; then meeting cards. The user's **PMI card is pinned at top, filled Zoom-blue**, showing the number big and "My Personal Meeting ID (PMI)" beneath. Other upcoming meetings listed below. "No upcoming meetings" empty state. Footer: **Add a calendar** link (blue, non-functional).
- **Right pane:** selected meeting detail — large title, the meeting ID, buttons **Start** (blue, filled), **Copy Invitation** (outlined, with copy icon), **Edit** (outlined, pencil). A "Show Meeting Invitation" blue link below.

### Join (`/join`)
- Centered: **Join Meeting** heading (bold, ~32px).
- Input: "Meeting ID or Personal Link Name" (with a dropdown caret on the right).
- **Add a required "Your Name" input** (display name) beneath — needed for guests.
- Buttons: **Cancel** (outlined) and **Join** (filled blue, **disabled until both fields filled**).
- Accept a raw code or a full invite link.

### Schedule (`/schedule`)
Rendered inside the shell (not the legacy chrome). Left could show a light section label; main column holds the form:
- **Topic** (required, text) with a "+ Add Description" reveal (textarea).
- **When**: date picker + time input + AM/PM select.
- **Duration**: hours select + minutes select.
- **Meeting ID**: radio "Generate Automatically" (default) / "Personal Meeting ID".
- **Security**: Passcode checkbox + text (prefilled random), **Waiting Room** checkbox.
- **Save** (filled blue) / **Cancel** (outlined). On save → toast + redirect to Meetings, appears under Upcoming.

### In-Meeting Room (`/meeting/[code]`)
- **Pre-join modal** (white, centered, on dark): illustration, "Do you want people to see you in the meeting?", subtext, **Use microphone and camera** (filled blue) and **Continue without microphone and camera** (blue link). Cosmetic — sets local mic/cam booleans.
- **Stage**: dark `#1A1A1A`. Participant tiles are large rounded rectangles; each shows an avatar square with the initial (colored) centered, and a **name label bottom-left** with a small mute icon. Single participant fills the stage; multiple → grid.
- **Top strip** (dark): "zoom Workplace" mark, a security shield, **View** control, meeting badge.
- **Bottom control bar** (dark): icon+label buttons — **Mute/Unmute**, **Video**, **Participants** (with count), **Chat**, **React**, **Share**, **Host tools**, **Zoom AI**, **More**, and a red **End** button on the far right. Mute and Video toggle local state; others may be visual-only.
- **Participants panel** (right drawer, opens from Participants): header "Participants (N)" with a close X; each row = avatar, name (host shows "(Host, me)"), mute + video state icons. Footer buttons: **Invite**, **Mute All**, **More**. Host sees **Mute All** and per-row **Mute/Remove** actions; these hit the backend.
- **Leave/End** returns to dashboard.

### Auth (`/login`, `/signup`)
- Centered card on the grey bg, Zoom wordmark at top.
- Login: email, password, **Sign In** (filled blue), link to signup.
- Signup: full name, username, email, password (with the validation rules), **Sign Up**, link to login.
- Inline validation + toast on error/success.

## Interaction notes

- Clock updates every second (`setInterval`), formatted 12-hour with AM/PM.
- Copy actions (Copy ID / Copy Invitation / invite link) use the clipboard API + a success toast.
- All primary actions show a loading state on their button while the request is in flight.
- Toasts (react-hot-toast) for every create/join/error.
- Buttons follow Zoom's shape: solid blue for primary, outlined grey for secondary, red for destructive (End/Remove).
