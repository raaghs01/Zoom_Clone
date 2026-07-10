from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import connect_db
from app.middlewares.error_handler import register_error_handlers
from app.routes.auth_routes import router as auth_router
from app.routes.meeting_routes import router as meeting_router
from app.seed import seed
from app.utils.api_response import ApiResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_db()
    seed()
    yield


app = FastAPI(title="Zoom Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origin.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)


@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return ApiResponse(200, {"status": "ok"}, "Service is healthy")


app.include_router(auth_router, prefix="/api/v1")
app.include_router(meeting_router, prefix="/api/v1")
