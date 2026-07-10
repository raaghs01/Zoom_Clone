from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


class ApiResponse(JSONResponse):
    def __init__(self, status_code: int = 200, data=None, message: str = "Success"):
        content = {
            "statusCode": status_code,
            "data": jsonable_encoder(data),
            "message": message,
            "success": status_code < 400,
        }
        super().__init__(status_code=status_code, content=content)
