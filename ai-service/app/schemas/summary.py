from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class SummaryRequest(BaseModel):
    patientId: str
    patientName: Optional[str] = "Patient"
    gender: Optional[str] = None
    age: Optional[int] = None
    consultations: List[Dict[str, Any]] = []
    diagnoses: List[Dict[str, Any]] = []
    vitals: List[Dict[str, Any]] = []
    prescriptions: List[Dict[str, Any]] = []
    labResults: List[Dict[str, Any]] = []

class SummaryResponseData(BaseModel):
    summary: str
    clinicalHighlights: List[str] = []
    activeMedications: List[str] = []
    criticalAlerts: List[str] = []
    sourceRecordIds: List[str] = []
    reviewStatus: str = "DRAFT"

class SummaryResponse(BaseModel):
    success: bool = True
    data: SummaryResponseData

