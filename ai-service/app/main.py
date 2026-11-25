import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.schemas.chat import ChatRequest, ChatResponse, ChatResponseData
from app.schemas.summary import SummaryRequest, SummaryResponse, SummaryResponseData
from app.schemas.ocr import OCRExtractRequest, OCRExtractResponse, OCRExtractResponseData
from app.schemas.analytics import AnalyticsQueryRequest, AnalyticsQueryResponse, AnalyticsQueryResponseData

from app.services.rag_service import rag_service
from app.services.summary_service import summary_service
from app.services.ocr_service import ocr_service
from app.services.analytics_service import analytics_service

load_dotenv()

app = FastAPI(
    title="MediCore AI Service",
    description="Assistive AI Microservice for MediCore Hospital ERP (RAG, Summarization, OCR extraction, Analytics)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "medicore-ai-service",
        "ragDocumentsIndexed": len(rag_service.chunks),
        "version": "1.0.0"
    }

@app.post("/api/v1/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        answer, sources = rag_service.search_and_answer(req.message)
        return ChatResponse(
            success=True,
            data=ChatResponseData(
                answer=answer,
                sources=sources,
                scope=req.contextScope
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/summarize", response_model=SummaryResponse)
def summarize_endpoint(req: SummaryRequest):
    try:
        data = summary_service.generate_summary(req)
        return SummaryResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ocr/extract", response_model=OCRExtractResponse)
def ocr_endpoint(req: OCRExtractRequest):
    try:
        data = ocr_service.extract_from_report(req)
        return OCRExtractResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analytics/query", response_model=AnalyticsQueryResponse)
def analytics_endpoint(req: AnalyticsQueryRequest):
    try:
        data = analytics_service.process_query(req)
        return AnalyticsQueryResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

