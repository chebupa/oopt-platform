import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from geoalchemy2 import Geometry

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    citizen = "citizen"
    volunteer = "volunteer"
    inspector = "inspector"

class TaskStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    done = "done"

class ReportStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks_created = relationship("Task", foreign_keys="[Task.inspector_id]", back_populates="inspector")
    tasks_assigned = relationship("Task", foreign_keys="[Task.volunteer_id]", back_populates="volunteer")
    reports = relationship("Report", back_populates="citizen")

class ProtectedArea(Base):
    __tablename__ = "protected_areas"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    volunteers_needed = Column(Integer, default=1, nullable=False)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.open, nullable=False)
    
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    inspector = relationship("User", foreign_keys=[inspector_id], back_populates="tasks_created")
    volunteer = relationship("User", foreign_keys=[volunteer_id], back_populates="tasks_assigned")

    @property
    def geom_wkt(self) -> str:
        if self.geom is not None:
            from geoalchemy2.shape import to_shape
            return to_shape(self.geom).wkt
        return ""

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    geom = Column(Geometry('POINT', srid=4326), nullable=False)
    image_url = Column(String, nullable=True)
    status = Column(Enum(ReportStatusEnum), default=ReportStatusEnum.pending, nullable=False)
    
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    citizen = relationship("User", back_populates="reports")

    @property
    def geom_wkt(self) -> str:
        if self.geom is not None:
            from geoalchemy2.shape import to_shape
            return to_shape(self.geom).wkt
        return ""
