class ApiError(Exception):
    def __init__(self, status_code: int, message: str = "Something went wrong", errors: list | None = None):
        self.status_code = status_code
        self.message = message
        self.errors = errors or []
        super().__init__(message)
