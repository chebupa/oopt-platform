from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, TaskStatusEnum, ReportStatusEnum

# Auth schemas
class UserCreate(BaseModel):
    email: str
    password: str
    role: RoleEnum

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    email: str
    role: RoleEnum
    
    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: str
    volunteers_needed: int
    geom_wkt: str  # We will use WKT (Well-Known Text) for simplicity over JSON in this MVP

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: Optional[TaskStatusEnum] = None
    volunteer_id: Optional[int] = None

class TaskOut(TaskBase):
    id: int
    status: TaskStatusEnum
    inspector_id: int
    volunteer_id: Optional[int]
    
    class Config:
        from_attributes = True

# Report schemas
class ReportBase(BaseModel):
    description: str
    geom_wkt: str
    image_url: Optional[str] = None

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    status: ReportStatusEnum

class ReportOut(ReportBase):
    id: int
    status: ReportStatusEnum
    citizen_id: int

    class Config:
        from_attributes = True
