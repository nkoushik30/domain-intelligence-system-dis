from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.routes import router

app = FastAPI(title="Network Tracker")
app.include_router(router, prefix="/api")
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
def home():
    return {"message": "Domain Intelligence API is running 🚀"}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://domain-intelligence-system-dis.vercel.app/"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)