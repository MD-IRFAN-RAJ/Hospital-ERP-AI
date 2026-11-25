from app.schemas.analytics import AnalyticsQueryRequest, AnalyticsQueryResponseData

class AnalyticsService:
    def process_query(self, req: AnalyticsQueryRequest) -> AnalyticsQueryResponseData:
        q = req.question.lower().strip()

        # Whitelist of approved tools per SRS Section 6.4 & 8.3
        if "revenue" in q or "finance" in q or "monthly" in q or "sales" in q:
            # get_monthly_revenue
            return AnalyticsQueryResponseData(
                summary="Total hospital operational revenue grew by 28.5% over the last 6 calendar months.",
                chartType="line",
                labels=["June", "July", "August", "September", "October", "November"],
                values=[120000.0, 145000.0, 132000.0, 178000.0, 195000.0, 224000.0],
                seriesName="Revenue (NPR/INR)",
                metadata={"growthRate": "+28.5%", "peakMonth": "November"}
            )
        elif "department" in q or "specialty" in q or "consultation" in q:
            # get_department_appointments
            return AnalyticsQueryResponseData(
                summary="General Medicine and Cardiology represent the highest volume of patient consultations.",
                chartType="bar",
                labels=["General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Gynecology", "ENT", "Dermatology"],
                values=[342.0, 215.0, 189.0, 164.0, 145.0, 98.0, 84.0],
                seriesName="Consultations Count",
                metadata={"topDepartment": "General Medicine"}
            )
        elif "stock" in q or "medicine" in q or "pharmacy" in q or "inventory" in q:
            # get_low_stock_medicines
            return AnalyticsQueryResponseData(
                summary="4 active pharmacy items have reached or breached their minimum reorder thresholds.",
                chartType="bar",
                labels=["Amoxicillin 500mg", "Paracetamol IV Infusion", "Azithromycin 250mg", "Insulin Glargine 100IU", "Omeprazole 40mg", "Metformin 500mg"],
                values=[12.0, 15.0, 18.0, 22.0, 95.0, 140.0],
                seriesName="Remaining Stock Units",
                metadata={"criticalThreshold": 20, "nearExpiryCount": 2}
            )
        elif "visit" in q or "patient" in q or "opd" in q:
            # get_patient_visit_count
            return AnalyticsQueryResponseData(
                summary="Daily outpatient registration average stands at 48 patients per day this week.",
                chartType="line",
                labels=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                values=[52.0, 61.0, 48.0, 56.0, 65.0, 38.0, 18.0],
                seriesName="OPD Registrations",
                metadata={"weeklyTotal": 338, "busiestDay": "Friday"}
            )
        else:
            # Default general hospital performance overview
            return AnalyticsQueryResponseData(
                summary="Summary of hospital bed occupancy distribution across active wards.",
                chartType="pie",
                labels=["General Ward (Male)", "General Ward (Female)", "ICU", "CCU", "Maternity", "Pediatric"],
                values=[42.0, 38.0, 12.0, 8.0, 16.0, 14.0],
                seriesName="Bed Allocation",
                metadata={"totalOccupied": 130, "occupancyRate": "78.5%"}
            )

analytics_service = AnalyticsService()

