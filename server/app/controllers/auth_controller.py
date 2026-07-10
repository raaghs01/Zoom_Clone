from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.api_error import ApiError
from app.utils.api_response import ApiResponse
from app.utils.security import create_access_token, hash_password, verify_password
from app.validators.auth import AuthOut, LoginInput, RegisterInput, UserOut


def register(db: Session, payload: RegisterInput) -> ApiResponse:
    existing = (
        db.query(User)
        .filter((User.email == payload.email) | (User.username == payload.username))
        .first()
    )
    if existing:
        raise ApiError(409, "A user with that email or username already exists")

    user = User(
        full_name=payload.full_name,
        username=payload.username,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    data = AuthOut(user=UserOut.model_validate(user), access_token=token)
    return ApiResponse(201, data, "User registered successfully")


def login(db: Session, payload: LoginInput) -> ApiResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise ApiError(401, "Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    data = AuthOut(user=UserOut.model_validate(user), access_token=token)
    return ApiResponse(200, data, "Login successful")


def get_me(user: User) -> ApiResponse:
    return ApiResponse(200, {"user": UserOut.model_validate(user)}, "Success")
