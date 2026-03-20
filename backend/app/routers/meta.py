from fastapi import APIRouter
from app.models.user import Position

router = APIRouter()

@router.get("/positions")
def get_positions():
    """Returns the list of valid user positions/ranks from the system Enum."""
    return [p.value for p in Position]
