from fastapi import Depends, Request
from jose import JWTError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.utils.api_error import ApiError
from app.utils.security import decode_access_token


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()

    return request.headers.get("auth-token")


def verify_jwt(request: Request, db: Session = Depends(get_db)):
    from app.models.user import User  # local import: avoids circular import with models package

    token = _extract_token(request)
    if not token:
        raise ApiError(401, "Unauthorized: no token provided")

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise ApiError(401, "Unauthorized: invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise ApiError(401, "Unauthorized: invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise ApiError(401, "Unauthorized: user not found")

    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)):
    from app.models.user import User  # local import: avoids circular import with models package

    token = _extract_token(request)
    if not token:
        return None

    try:
        payload = decode_access_token(token)
    except JWTError:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    return db.query(User).filter(User.id == int(user_id)).first()
