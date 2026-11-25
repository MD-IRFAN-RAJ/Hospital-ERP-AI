from pydantic import BaseModel, Field
from typing import List, Optional

class ExtractedField(BaseModel):
    testName: str
    category: str = "General"
    value: str
    unit: str
    referenceRange: str
    flag: str = "NORMAL"  # NORMAL, HIGH, LOW, CRITICAL
    confidence: float = 0.95

class OCRExtractRequest(BaseModel):
    rawText: Optional[str] = None
    fileName: Optional[str] = "lab_report.pdf"
    patientId: Optional[str] = None

class OCRExtractResponseData(BaseModel):
    documentName: str
    testsExtracted: List[ExtractedField] = []
    overallRemarks: str
    humanReviewRequired: bool = True
    status: str = "DRAFT"

class OCRExtractResponse(BaseModel):
    success: bool = True
    data: OCRExtractResponseData

