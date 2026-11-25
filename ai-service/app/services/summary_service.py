from typing import Dict, Any, List
from app.schemas.summary import SummaryRequest, SummaryResponseData

class SummaryService:
    def generate_summary(self, req: SummaryRequest) -> SummaryResponseData:
        source_ids = []
        highlights = []
        meds = []
        alerts = []

        # 1. Process diagnoses
        diag_texts = []
        for d in req.diagnoses:
            name = d.get("diagnosis", "Unspecified Condition")
            code = d.get("icdCode") or ""
            diag_texts.append(f"{name} ({code})" if code else name)
            if "id" in d:
                source_ids.append(d["id"])

        # 2. Process consultations & symptoms
        for c in req.consultations:
            symptoms = c.get("symptoms")
            notes = c.get("notes") or c.get("clinicalNotes")
            if symptoms:
                highlights.append(f"Reported symptoms: {symptoms}")
            if notes:
                highlights.append(f"Clinical notes: {notes}")
            if "id" in c:
                source_ids.append(c["id"])

        # 3. Process vitals
        for v in req.vitals:
            bp = v.get("bloodPressure")
            hr = v.get("pulse")
            spo2 = v.get("spo2")
            news2 = v.get("news2Score", 0)
            if news2 and news2 >= 3:
                alerts.append(f"Elevated NEWS2 Early Warning Score: {news2}")
            if spo2 and spo2 < 92:
                alerts.append(f"Hypoxia alert: SpO2 measured at {spo2}%")
            if bp:
                highlights.append(f"Recent BP: {bp} mmHg, Pulse: {hr} bpm")
            if "id" in v:
                source_ids.append(v["id"])

        # 4. Process prescriptions & active meds
        for p in req.prescriptions:
            items = p.get("items", [])
            for item in items:
                m_name = item.get("medicine", {}).get("name") or item.get("name", "Medication")
                dose = item.get("dosage", "")
                freq = item.get("frequency", "")
                meds.append(f"{m_name} {dose} ({freq})".strip())
            if "id" in p:
                source_ids.append(p["id"])

        # 5. Process lab results
        for r in req.labResults:
            test = r.get("testName", "Lab Test")
            val = r.get("value", "")
            unit = r.get("unit", "")
            flag = r.get("flag", "NORMAL")
            if flag in ["HIGH", "LOW", "CRITICAL"]:
                alerts.append(f"Abnormal lab finding: {test} = {val} {unit} [{flag}]")
            if "id" in r:
                source_ids.append(r["id"])

        # Synthesize overview
        diag_summary = ", ".join(diag_texts) if diag_texts else "No active chronic diagnoses recorded."
        pt_name = req.patientName or "Patient"
        age_str = f", {req.age}yo" if req.age else ""
        gender_str = f" ({req.gender})" if req.gender else ""

        narrative = (
            f"CLINICAL SUMMARY FOR {pt_name.upper()}{gender_str}{age_str}:\n"
            f"Active Diagnoses: {diag_summary}\n"
            f"Current Regimen: {', '.join(meds[:5]) if meds else 'No active outpatient prescriptions recorded.'}\n"
            f"Key Observations: {'; '.join(highlights[:4]) if highlights else 'Stable routine evaluation.'}"
        )

        return SummaryResponseData(
            summary=narrative,
            clinicalHighlights=highlights[:6],
            activeMedications=meds[:8],
            criticalAlerts=alerts,
            sourceRecordIds=source_ids,
            reviewStatus="VALIDATED_DRAFT"
        )

summary_service = SummaryService()

