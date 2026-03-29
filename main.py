from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from database import engine, SessionLocal, User, Item, Base

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Lifespan (runs on startup) ---
def initialize_database():
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", password="password123"))
        db.commit()
    db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield

# --- Create the ONE and ONLY app instance ---
app = FastAPI(lifespan=lifespan)

# --- Add CORS Middleware for Mobile App Connection ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (including Android/iOS)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas ---
class LoginData(BaseModel):
    username: str
    password: str

class ItemCreate(BaseModel):
    name: str
    description: str
    status: str

class ItemResponse(ItemCreate):
    id: int

@app.get("/")
def read_root():
    return {"status": "running", "app": "TaskFlow API", "version": "1.0"}

@app.post("/api/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username, User.password == data.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": "fake-jwt-token-for-demo", "username": user.username}

@app.get("/api/items")
def get_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

@app.post("/api/items")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    new_item = Item(name=item.name, description=item.description, status=item.status)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.put("/api/items/{item_id}")
def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db_item.name = item.name
    db_item.description = item.description
    db_item.status = item.status
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return {"status": "deleted"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Server running on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
