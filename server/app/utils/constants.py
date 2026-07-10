from enum import Enum


class ParticipantRole(str, Enum):
    HOST = "host"
    PARTICIPANT = "participant"


class MeetingStatus(str, Enum):
    INSTANT = "instant"
    SCHEDULED = "scheduled"
