from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InstantMeetingInput(BaseModel):
    title: Optional[str] = None


class ScheduleMeetingInput(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    scheduled_at: datetime
    duration_min: int = Field(..., gt=0)
    passcode: Optional[str] = None
    waiting_room: bool = False


class UpdateMeetingInput(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_min: Optional[int] = Field(None, gt=0)
    passcode: Optional[str] = None
    waiting_room: Optional[bool] = None


class JoinMeetingInput(BaseModel):
    display_name: str = Field(..., min_length=1)


class MeetingHostOut(BaseModel):
    id: int
    full_name: str
    username: str

    model_config = ConfigDict(from_attributes=True)


class MeetingOut(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: str
    status: str
    scheduled_at: Optional[datetime]
    duration_min: Optional[int]
    passcode: Optional[str]
    waiting_room: bool
    is_active: bool
    invite_link: str
    created_at: datetime
    host: MeetingHostOut

    model_config = ConfigDict(from_attributes=True)


class ParticipantOut(BaseModel):
    id: int
    display_name: str
    role: str
    is_muted: bool
    is_removed: bool
    joined_at: datetime
    left_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class MeetingListOut(BaseModel):
    upcoming: list[MeetingOut]
    recent: list[MeetingOut]
    pmi: Optional[MeetingOut] = None
