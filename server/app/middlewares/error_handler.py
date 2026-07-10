from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.utils.api_error import ApiError


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "statusCode": exc.status_code,
                "data": None,
                "message": exc.message,
                "success": False,
                "errors": exc.errors,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        errors = [
            {
                "field": ".".join(str(loc) for loc in error["loc"] if loc != "body"),
                "message": error["msg"],
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "statusCode": 422,
                "data": None,
                "message": "Validation failed",
                "success": False,
                "errors": errors,
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "statusCode": exc.status_code,
                "data": None,
                "message": exc.detail if isinstance(exc.detail, str) else "HTTP error",
                "success": False,
                "errors": [],
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "statusCode": 500,
                "data": None,
                "message": "Internal server error",
                "success": False,
                "errors": [],
            },
        )
