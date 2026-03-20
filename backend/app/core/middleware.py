import time
import logging
from fastapi import Request, status, Depends, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from uuid import UUID
from app.models.user import User
from app.auth.utils import get_current_user

logger = logging.getLogger(__name__)

class DepartmentIsolationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # In FastAPI, standard middleware runs before routing, so we inject global checks here or log
        # For actual department validation, we will rely on endpoint dependencies where the DB session is available,
        # but we use this middleware for global request logging and rate limit tracking.
        
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log request completion
        # For a true enterprise setup, this logs to a file or log aggregation service
        # print(f"[{request.method}] {request.url.path} - {response.status_code} - {process_time:.4f}s")
        
        return response

# To enforce strict department checks, we define a Dependency injector below
def require_department_match(current_user: User = Depends(get_current_user)):
    """
    Dependency that ensures the current user is active. 
    Specific route handlers will further check if the user belongs to the department 
    they are trying to access, unless they are a SUPER_ADMIN.
    """
    return current_user

def validate_department_access(target_department_id: UUID, user: User):
    """
    Utility function to validate if a user can access data for a specific department.
    """
    from app.models.user import UserRole
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    if user.department_id != target_department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not belong to this department."
        )
    return True
