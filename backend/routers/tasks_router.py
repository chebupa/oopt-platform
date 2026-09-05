from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Task, User, RoleEnum, TaskStatusEnum
from schemas import TaskCreate, TaskOut, TaskUpdate
from auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.volunteer:
        return db.query(Task).filter(Task.status == TaskStatusEnum.open).all()
    elif current_user.role == RoleEnum.inspector:
        return db.query(Task).filter(Task.inspector_id == current_user.id).all()
    return []

@router.post("/", response_model=TaskOut)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.inspector:
        raise HTTPException(status_code=403, detail="Only inspectors can create tasks")
    
    db_task = Task(
        title=task.title,
        description=task.description,
        volunteers_needed=task.volunteers_needed,
        points_reward=task.points_reward,
        geom=task.geom_wkt, # Expecting WKT format, GeoAlchemy handles it
        inspector_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_update.status:
        if task_update.status == TaskStatusEnum.done and db_task.status != TaskStatusEnum.done:
            if db_task.volunteer_id:
                volunteer = db.query(User).filter(User.id == db_task.volunteer_id).first()
                if volunteer:
                    volunteer.points += db_task.points_reward
                    db.add(volunteer)
        db_task.status = task_update.status
    if task_update.volunteer_id:
        db_task.volunteer_id = task_update.volunteer_id
        
    db.commit()
    db.refresh(db_task)
    return db_task
