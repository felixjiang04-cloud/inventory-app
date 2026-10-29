from fastapi import HTTPException
from fastapi.responses import JSONResponse


def api_error(status: int, code: str, **context) -> HTTPException:
    """An HTTP error whose body is an i18n payload {"code", "context"}.

    The frontend translates the code — the server never sends English
    sentences. Usage: raise api_error(404, "apiError.itemNotFound", itemId=3)
    """
    return HTTPException(status, detail={"code": code, "context": context})


def api_error_response(
    status: int, code: str, headers: dict[str, str] | None = None, **context
) -> JSONResponse:
    """The same error as api_error, but to *return* instead of raise.

    A request that raises has everything it wrote rolled back (see
    deps.get_db); one that returns keeps it. Login uses this so that a
    failed attempt stays counted.
    """
    return JSONResponse(
        status_code=status,
        content={"detail": {"code": code, "context": context}},
        headers=headers,
    )
