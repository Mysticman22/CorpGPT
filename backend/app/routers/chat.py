from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from sqlalchemy.orm import Session
from app.core import rag
from app.core.database import get_db
from app.auth.utils import get_current_user, require_super_admin
from app.models.chat import Conversation, Message as DBMessage, RoleEnum
from app.core.middleware import validate_department_access

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "mistral" # Provided by frontend 
    stream: bool = True
    conversation_id: Optional[str] = None

class IngestRequest(BaseModel):
    directory_path: Optional[str] = None

@router.post("/message")
async def chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Standard (non-streaming) chat endpoint using RAG and saving to PostgreSQL.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
    rag.Settings.llm.model = request.model
    user_message = request.messages[-1].content
    
    # 1. Handle Conversation ID
    conversation_id = request.conversation_id
    if not conversation_id:
        new_conv = Conversation(user_id=user.id, title=user_message[:50])
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)
        conversation_id = new_conv.id
        
    # 2. Save User Message
    db_user_msg = DBMessage(
        conversation_id=conversation_id,
        role=RoleEnum.USER,
        content=user_message,
        model=request.model
    )
    db.add(db_user_msg)
    db.commit()

    # 3. Validate user belongs to a department
    if not user.department_id:
        raise HTTPException(status_code=403, detail="User must belong to a department to use Chat.")
            
    try:
        engine = rag.get_chat_engine(user.department_id)
        response = engine.chat(user_message)
        response_text = str(response)
        
        # 4. Save AI Response
        db_ai_msg = DBMessage(
            conversation_id=conversation_id,
            role=RoleEnum.ASSISTANT,
            content=response_text,
            model=request.model
        )
        db.add(db_ai_msg)
        db.commit()
        
        return {
            "conversation_id": conversation_id,
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "done": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Streaming chat endpoint using RAG and saving to PostgreSQL.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
    rag.Settings.llm.model = request.model
    user_message = request.messages[-1].content

    # 1. Handle Conversation ID
    conversation_id = request.conversation_id
    if not conversation_id:
        new_conv = Conversation(user_id=user.id, title=user_message[:50])
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)
        conversation_id = new_conv.id

    # 2. Save User Message
    db_user_msg = DBMessage(
        conversation_id=conversation_id,
        role=RoleEnum.USER,
        content=user_message,
        model=request.model
    )
    db.add(db_user_msg)
    db.commit()

    # 3. Validate user belongs to a department
    if not user.department_id:
        raise HTTPException(status_code=403, detail="User must belong to a department to use Chat streaming.")
            
    try:
        engine = rag.get_chat_engine(user.department_id)
        streaming_response = engine.stream_chat(user_message)
        
        async def generator():
            full_response = ""
            # LlamaIndex stream_chat returns an iterator of tokens
            for token in streaming_response.response_gen:
                full_response += token
                yield f'{{"conversation_id": "{conversation_id}", "message": {{"content": "{token}"}}, "done": false}}\n'
            
            # 3. Save AI Response
            db_ai_msg = DBMessage(
                conversation_id=conversation_id,
                role=RoleEnum.ASSISTANT,
                content=full_response,
                model=request.model
            )
            db.add(db_ai_msg)
            db.commit()

            # Send final done signal
            yield f'{{"conversation_id": "{conversation_id}", "message": {{"content": ""}}, "done": true}}\n'

        return StreamingResponse(generator(), media_type="application/x-ndjson")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
async def ingest_docs(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
    admin = Depends(require_super_admin)
):
    """
    Endpoint to trigger document ingestion into the vector database.
    """
    path_to_ingest = request.directory_path if request.directory_path else str(rag.DATA_DIR)
    
    # Run ingestion in the background so it doesn't block the API
    background_tasks.add_task(rag.ingest_documents, path_to_ingest)
    
    return {"status": "success", "message": f"ingestion started for {path_to_ingest} in background"}
