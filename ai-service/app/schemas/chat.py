from pydantic import BaseModel, Field
from typing import List, Optional

class SourceCitation(BaseModel):
    documentId: str
    documentName: str
    page: int = 1
    snippet: Optional[str] = None
    similarityScore: Optional[float] = None

class ChatRequest(BaseModel):
    conversationId: Optional[str] = None
    message: str
    contextScope: str = "HOSPITAL_POLICIES"
    role: Optional[str] = "GENERAL"

class ChatResponseData(BaseModel):
    answer: str
    sources: List[SourceCitation] = []
    scope: str = "HOSPITAL_POLICIES"

class ChatResponse(BaseModel):
    success: bool = True
    data: ChatResponseData

