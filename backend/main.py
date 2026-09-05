from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
import auth
from contextlib import asynccontextmanager
from routers import auth_router, tasks_router, reports_router, planetary_router
from seed import seed_users

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_users()
    yield

app = FastAPI(title="OOPT Platform API", lifespan=lifespan)


app.include_router(auth_router.router)
app.include_router(tasks_router.router)
app.include_router(reports_router.router)
app.include_router(planetary_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the OOPT Platform API"}
