from fastapi import HTTPException


def api_error(status: int, code: str, **context) -> HTTPException:
    """An HTTP error whose body is an i18n payload {"code", "context"}.

    The frontend translates the code — the server never sends English
    sentences. Usage: raise api_error(404, "apiError.itemNotFound", itemId=3)
    """
    return HTTPException(status, detail={"code": code, "context": context})
