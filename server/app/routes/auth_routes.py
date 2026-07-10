from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import auth_controller
from app.db.database import get_db
from app.middlewares.auth import verify_jwt
from app.models.user import User
from app.validators.auth import LoginInput, RegisterInput

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(payload: RegisterInput, db: Session = Depends(get_db)):
    return auth_controller.register(db, payload)


@router.post("/login")
def login(payload: LoginInput, db: Session = Depends(get_db)):
    return auth_controller.login(db, payload)


@router.get("/me")
def get_me(user: User = Depends(verify_jwt)):
    return auth_controller.get_me(user)
