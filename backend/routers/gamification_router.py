from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserOut
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["gamification"])

class BuyRequest(BaseModel):
    item_id: str
    price: int

@router.post("/users/complete-course", response_model=UserOut)
def complete_course(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.has_completed_course:
        raise HTTPException(status_code=400, detail="Курс уже пройден")
    
    current_user.has_completed_course = True
    current_user.points += 50 # reward for completing course
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/store/buy", response_model=UserOut)
def buy_item(request: BuyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.points < request.price:
        raise HTTPException(status_code=400, detail="Недостаточно баллов")
    
    current_user.points -= request.price
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
