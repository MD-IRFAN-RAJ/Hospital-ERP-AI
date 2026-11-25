from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class AnalyticsQueryRequest(BaseModel):
    question: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    department: Optional[str] = None

class AnalyticsQueryResponseData(BaseModel):
    summary: str
    chartType: str  # "line", "bar", "pie", "metric"
    labels: List[str]
    values: List[float]
    seriesName: Optional[str] = "Value"
    metadata: Optional[Dict[str, Any]] = None

class AnalyticsQueryResponse(BaseModel):
    success: bool = True
    data: AnalyticsQueryResponseData

