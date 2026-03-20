from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.department import Department
from app.auth.utils import require_super_admin

router = APIRouter()

class DepartmentCreate(BaseModel):
    name: str

class DepartmentResponse(DepartmentCreate):
    id: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/", response_model=DepartmentResponse)
def create_department(
    dept: DepartmentCreate,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(Department.name.ilike(dept.name)).first()
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Department name already exists.")
        
    new_dept = Department(
        name=dept.name,
        created_by=current_admin.id
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.delete("/{dept_id}")
def delete_department(
    dept_id: UUID,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    # Protect Headquarters or handle cascading
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
        
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}
