from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import SessionLocal
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.user import User
from app.utils.constants import MeetingStatus, ParticipantRole
from app.utils.security import hash_password

PMI_CODE = "732-863-5057"


def _get_or_create_default_user(db: Session) -> User:
    user = db.query(User).filter(User.email == settings.default_user_email).first()
    if user:
        return user

    user = User(
        full_name=settings.default_user_full_name,
        username=settings.default_user_username,
        email=settings.default_user_email,
        password=hash_password(settings.default_user_password),
    )
    db.add(user)
    db.flush()
    return user


def _get_or_create_meeting(db: Session, host: User, meeting_code: str, **fields) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.meeting_code == meeting_code).first()
    if meeting:
        return meeting

    meeting = Meeting(meeting_code=meeting_code, host_id=host.id, **fields)
    db.add(meeting)
    db.flush()
    return meeting


def _ensure_participant(db: Session, meeting: Meeting, *, user: User | None, display_name: str, **fields) -> None:
    query = db.query(Participant).filter(
        Participant.meeting_id == meeting.id, Participant.display_name == display_name
    )
    if query.first():
        return

    db.add(
        Participant(
            meeting_id=meeting.id,
            user_id=user.id if user else None,
            display_name=display_name,
            **fields,
        )
    )


def seed() -> None:
    db = SessionLocal()
    try:
        user = _get_or_create_default_user(db)

        pmi = _get_or_create_meeting(
            db,
            user,
            PMI_CODE,
            title="Demo User's Personal Meeting Room",
            status=MeetingStatus.INSTANT.value,
        )
        _ensure_participant(db, pmi, user=user, display_name=user.full_name, role=ParticipantRole.HOST.value)

        now = datetime.utcnow()
        for code, title, description, scheduled_at, duration_min, passcode, waiting_room in (
            ("245-981-3312", "Sprint Planning", "Q3 kickoff", now + timedelta(days=1, hours=2), 40, None, False),
            ("618-204-7756", "1:1 with Manager", "", now + timedelta(days=2, hours=5), 30, None, False),
            ("903-457-1189", "Design Review", "Homepage revamp", now + timedelta(days=4), 60, "482913", True),
        ):
            meeting = _get_or_create_meeting(
                db,
                user,
                code,
                title=title,
                description=description,
                status=MeetingStatus.SCHEDULED.value,
                scheduled_at=scheduled_at,
                duration_min=duration_min,
                passcode=passcode,
                waiting_room=waiting_room,
            )
            _ensure_participant(
                db, meeting, user=user, display_name=user.full_name, role=ParticipantRole.HOST.value
            )

        recent_meeting = _get_or_create_meeting(
            db,
            user,
            "774-320-6685",
            title="Instant Meeting",
            status=MeetingStatus.INSTANT.value,
            is_active=False,
        )
        _ensure_participant(
            db,
            recent_meeting,
            user=user,
            display_name=user.full_name,
            role=ParticipantRole.HOST.value,
            left_at=now,
        )
        for name in ("Alex Johnson", "Priya Sharma"):
            _ensure_participant(
                db,
                recent_meeting,
                user=None,
                display_name=name,
                role=ParticipantRole.PARTICIPANT.value,
                left_at=now,
            )

        db.commit()
    finally:
        db.close()
