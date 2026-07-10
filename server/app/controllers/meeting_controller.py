import random
import re
from datetime import datetime
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import settings
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.user import User
from app.utils.api_error import ApiError
from app.utils.api_response import ApiResponse
from app.utils.constants import MeetingStatus, ParticipantRole
from app.validators.meeting import (
    InstantMeetingInput,
    JoinMeetingInput,
    MeetingHostOut,
    MeetingListOut,
    MeetingOut,
    ParticipantOut,
    ScheduleMeetingInput,
    UpdateMeetingInput,
)


def _generate_meeting_code() -> str:
    def group(n: int) -> str:
        return "".join(str(random.randint(0, 9)) for _ in range(n))

    return f"{group(3)}-{group(3)}-{group(4)}"


def _generate_unique_meeting_code(db: Session) -> str:
    code = _generate_meeting_code()
    while db.query(Meeting).filter(Meeting.meeting_code == code).first():
        code = _generate_meeting_code()
    return code


def _build_invite_link(meeting_code: str) -> str:
    return f"{settings.frontend_url}/join?code={meeting_code}"


def _meeting_to_out(meeting: Meeting) -> MeetingOut:
    return MeetingOut(
        id=meeting.id,
        meeting_code=meeting.meeting_code,
        title=meeting.title,
        description=meeting.description,
        status=meeting.status,
        scheduled_at=meeting.scheduled_at,
        duration_min=meeting.duration_min,
        passcode=meeting.passcode,
        waiting_room=meeting.waiting_room,
        is_active=meeting.is_active,
        invite_link=_build_invite_link(meeting.meeting_code),
        created_at=meeting.created_at,
        host=MeetingHostOut.model_validate(meeting.host),
    )


def _normalize_meeting_code(raw: str) -> str:
    raw = raw.strip()
    if "code=" in raw:
        raw = raw.split("code=", 1)[1]
    raw = raw.split("&")[0]

    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}"
    return raw


def _get_meeting_or_404(db: Session, code: str) -> Meeting:
    meeting = (
        db.query(Meeting)
        .filter(Meeting.meeting_code == _normalize_meeting_code(code))
        .first()
    )
    if not meeting:
        raise ApiError(404, "Meeting not found")
    return meeting


def _get_active_meeting_or_404(db: Session, code: str) -> Meeting:
    meeting = _get_meeting_or_404(db, code)
    if not meeting.is_active:
        raise ApiError(404, "Meeting not found")
    return meeting


def _get_participant_or_404(db: Session, meeting: Meeting, participant_id: int) -> Participant:
    participant = (
        db.query(Participant)
        .filter(Participant.id == participant_id, Participant.meeting_id == meeting.id)
        .first()
    )
    if not participant:
        raise ApiError(404, "Participant not found")
    return participant


def _assert_host(user: User, meeting: Meeting) -> None:
    if meeting.host_id != user.id:
        raise ApiError(403, "Only the host can perform this action")


def create_instant(db: Session, user: User, payload: InstantMeetingInput) -> ApiResponse:
    meeting = Meeting(
        meeting_code=_generate_unique_meeting_code(db),
        title=payload.title or "Instant Meeting",
        host_id=user.id,
        status=MeetingStatus.INSTANT.value,
    )
    db.add(meeting)
    db.flush()

    db.add(
        Participant(
            meeting_id=meeting.id,
            user_id=user.id,
            display_name=user.full_name,
            role=ParticipantRole.HOST.value,
        )
    )
    db.commit()
    db.refresh(meeting)

    return ApiResponse(201, {"meeting": _meeting_to_out(meeting)}, "Meeting created")


def schedule(db: Session, user: User, payload: ScheduleMeetingInput) -> ApiResponse:
    meeting = Meeting(
        meeting_code=_generate_unique_meeting_code(db),
        title=payload.title,
        description=payload.description or "",
        host_id=user.id,
        status=MeetingStatus.SCHEDULED.value,
        scheduled_at=payload.scheduled_at,
        duration_min=payload.duration_min,
        passcode=payload.passcode,
        waiting_room=payload.waiting_room,
    )
    db.add(meeting)
    db.flush()

    db.add(
        Participant(
            meeting_id=meeting.id,
            user_id=user.id,
            display_name=user.full_name,
            role=ParticipantRole.HOST.value,
        )
    )
    db.commit()
    db.refresh(meeting)

    return ApiResponse(201, {"meeting": _meeting_to_out(meeting)}, "Meeting scheduled")


def list_my_meetings(db: Session, user: User) -> ApiResponse:
    now = datetime.utcnow()

    upcoming = (
        db.query(Meeting)
        .filter(
            Meeting.host_id == user.id,
            Meeting.status == MeetingStatus.SCHEDULED.value,
            Meeting.is_active.is_(True),
            Meeting.scheduled_at >= now,
        )
        .order_by(Meeting.scheduled_at.asc())
        .all()
    )

    recent = (
        db.query(Meeting)
        .filter(
            Meeting.host_id == user.id,
            or_(Meeting.status == MeetingStatus.INSTANT.value, Meeting.is_active.is_(False)),
        )
        .order_by(Meeting.created_at.desc())
        .all()
    )

    pmi = (
        db.query(Meeting)
        .filter(Meeting.host_id == user.id, Meeting.status == MeetingStatus.INSTANT.value)
        .order_by(Meeting.created_at.asc(), Meeting.id.asc())
        .first()
    )

    data = MeetingListOut(
        upcoming=[_meeting_to_out(m) for m in upcoming],
        recent=[_meeting_to_out(m) for m in recent],
        pmi=_meeting_to_out(pmi) if pmi else None,
    )
    return ApiResponse(200, data, "Success")


def get_by_code(db: Session, code: str) -> ApiResponse:
    meeting = _get_active_meeting_or_404(db, code)
    return ApiResponse(200, {"meeting": _meeting_to_out(meeting)}, "Success")


def edit(db: Session, user: User, code: str, payload: UpdateMeetingInput) -> ApiResponse:
    meeting = _get_meeting_or_404(db, code)
    _assert_host(user, meeting)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)

    return ApiResponse(200, {"meeting": _meeting_to_out(meeting)}, "Meeting updated")


def end(db: Session, user: User, code: str) -> ApiResponse:
    meeting = _get_meeting_or_404(db, code)
    _assert_host(user, meeting)

    meeting.is_active = False
    db.commit()
    db.refresh(meeting)

    return ApiResponse(200, {"meeting": _meeting_to_out(meeting)}, "Meeting ended")


def join(db: Session, code: str, payload: JoinMeetingInput, current_user: Optional[User]) -> ApiResponse:
    meeting = _get_active_meeting_or_404(db, code)

    participant = Participant(
        meeting_id=meeting.id,
        user_id=current_user.id if current_user else None,
        display_name=payload.display_name,
        role=ParticipantRole.PARTICIPANT.value,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    db.refresh(meeting)

    data = {
        "participant": ParticipantOut.model_validate(participant),
        "meeting": _meeting_to_out(meeting),
    }
    return ApiResponse(201, data, "Joined meeting")


def list_participants(db: Session, code: str) -> ApiResponse:
    meeting = _get_meeting_or_404(db, code)

    participants = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id)
        .order_by(Participant.joined_at.asc())
        .all()
    )

    data = {"participants": [ParticipantOut.model_validate(p) for p in participants]}
    return ApiResponse(200, data, "Success")


def mute_one(db: Session, user: User, code: str, participant_id: int) -> ApiResponse:
    meeting = _get_meeting_or_404(db, code)
    _assert_host(user, meeting)

    participant = _get_participant_or_404(db, meeting, participant_id)
    participant.is_muted = True
    db.commit()
    db.refresh(participant)

    return ApiResponse(200, {"participant": ParticipantOut.model_validate(participant)}, "Participant muted")


def mute_all(db: Session, user: User, code: str) -> ApiResponse:
    meeting = _get_meeting_or_404(db, code)
    _assert_host(user, meeting)

    participants = (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.role != ParticipantRole.HOST.value)
        .all()
    )
    for participant in participants:
        participant.is_muted = True
    db.commit()

    data = {"participants": [ParticipantOut.model_validate(p) for p in participants]}
    return ApiResponse(200, data, "All participants muted")


def remove_one(db: Session, user: User, code: str, participant_id: int) -> ApiResponse:
    meeting = _get_meeting_or_404(db, code)
    _assert_host(user, meeting)

    participant = _get_participant_or_404(db, meeting, participant_id)
    participant.is_removed = True
    participant.left_at = datetime.utcnow()
    db.commit()
    db.refresh(participant)

    return ApiResponse(200, {"participant": ParticipantOut.model_validate(participant)}, "Participant removed")
