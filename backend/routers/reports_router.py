from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Report, User, RoleEnum
from schemas import ReportCreate, ReportOut, ReportUpdate
from auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.inspector:
        return db.query(Report).all()
    elif current_user.role == RoleEnum.citizen:
        return db.query(Report).filter(Report.citizen_id == current_user.id).all()
    return []

@router.post("/", response_model=ReportOut)
def create_report(report: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_report = Report(
        description=report.description,
        geom=report.geom_wkt,
        image_url=report.image_url,
        citizen_id=current_user.id
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.patch("/{report_id}", response_model=ReportOut)
def update_report(report_id: int, report_update: ReportUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.inspector:
        raise HTTPException(status_code=403, detail="Only inspectors can update reports")
        
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report_update.status:
        from models import ReportStatusEnum
        if report_update.status == ReportStatusEnum.approved and db_report.status != ReportStatusEnum.approved:
            # Award points for an approved pollution card
            citizen = db.query(User).filter(User.id == db_report.citizen_id).first()
            if citizen:
                citizen.points += 20 # fixed reward for creating a report
                db.add(citizen)
        db_report.status = report_update.status

    db.commit()
    db.refresh(db_report)
    return db_report
