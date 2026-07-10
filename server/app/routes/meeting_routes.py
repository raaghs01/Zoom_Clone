from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import meeting_controller
from app.db.database import get_db
from app.middlewares.auth import get_optional_user, verify_jwt
from app.models.user import User
from app.validators.meeting import (
    InstantMeetingInput,
    JoinMeetingInput,
    ScheduleMeetingInput,
    UpdateMeetingInput,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("/instant")
def create_instant(
    payload: InstantMeetingInput, db: Session = Depends(get_db), user: User = Depends(verify_jwt)
):
    return meeting_controller.create_instant(db, user, payload)


@router.post("/schedule")
def schedule(
    payload: ScheduleMeetingInput, db: Session = Depends(get_db), user: User = Depends(verify_jwt)
):
    return meeting_controller.schedule(db, user, payload)


@router.get("")
def list_my_meetings(db: Session = Depends(get_db), user: User = Depends(verify_jwt)):
    return meeting_controller.list_my_meetings(db, user)


@router.get("/{code}")
def get_by_code(code: str, db: Session = Depends(get_db)):
    return meeting_controller.get_by_code(db, code)


@router.patch("/{code}")
def edit(
    code: str,
    payload: UpdateMeetingInput,
    db: Session = Depends(get_db),
    user: User = Depends(verify_jwt),
):
    return meeting_controller.edit(db, user, code, payload)


@router.post("/{code}/end")
def end(code: str, db: Session = Depends(get_db), user: User = Depends(verify_jwt)):
    return meeting_controller.end(db, user, code)


@router.post("/{code}/join")
def join(
    code: str,
    payload: JoinMeetingInput,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    return meeting_controller.join(db, code, payload, current_user)


@router.get("/{code}/participants")
def list_participants(code: str, db: Session = Depends(get_db)):
    return meeting_controller.list_participants(db, code)


@router.post("/{code}/participants/mute-all")
def mute_all(code: str, db: Session = Depends(get_db), user: User = Depends(verify_jwt)):
    return meeting_controller.mute_all(db, user, code)


@router.post("/{code}/participants/{participant_id}/mute")
def mute_one(
    code: str, participant_id: int, db: Session = Depends(get_db), user: User = Depends(verify_jwt)
):
    return meeting_controller.mute_one(db, user, code, participant_id)


@router.post("/{code}/participants/{participant_id}/remove")
def remove_one(
    code: str, participant_id: int, db: Session = Depends(get_db), user: User = Depends(verify_jwt)
):
    return meeting_controller.remove_one(db, user, code, participant_id)
