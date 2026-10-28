from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from subtrack.config import settings
from subtrack.subscription import router as subscription_router
from subtrack.alert import router as alert_router
from subtrack.routers import health

app = FastAPI(title = "SubTrack API")

@app.get("/")
def read_root():
    return {"message": "SubTrack API", "docs": "/docs", "health": "/health"}

app.add_middleware(
    CORSMiddleware,
    allow_origins = [origin.strip() for origin in settings.frontend_origin.split(",")],
    allow_credentials = True,
    allow_methods = ["GET", "POST", "PUT", "DELETE"],
    allow_headers = ["Authorization", "Content-Type"],
)

app.include_router(subscription_router)
app.include_router(alert_router)
app.include_router(health.router)