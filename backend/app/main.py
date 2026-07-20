from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api import router
from app.ledger import LedgerError

app = FastAPI(title="Restaurant Inventory Service")
app.include_router(router)


@app.exception_handler(LedgerError)
async def ledger_error_handler(request: Request, exc: LedgerError) -> JSONResponse:
    # i18n key + context; the frontend translates
    return JSONResponse(
        status_code=409, content={"code": exc.code, "context": exc.context}
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
