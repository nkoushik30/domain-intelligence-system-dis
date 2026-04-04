from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="Network Tracker")

app.include_router(router)

@app.get("/")
def home():
    return {"message": "Domain Intelligence API is running 🚀"}