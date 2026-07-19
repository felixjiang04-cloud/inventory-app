from fastapi import FastAPI

app = FastAPI(title="Restaurant Inventory Service")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
