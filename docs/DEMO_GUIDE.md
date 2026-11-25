# MediCore Hospital ERP - Demonstration & Viva Walkthrough Guide

Prepared for College Minor Project Demonstration, Faculty Guide, and Viva Evaluation.
Conforming strictly to **SRS Appendix C: Demonstration Scenario**.

---

## Quick Start (Running the System)

Open 3 terminal windows in `Minor-project/`:

### 1. Start Python AI Microservice (Port 8000)
```powershell
cd ai-service
python -m uvicorn app.main:app --port 8000 --reload
```
*Health Check:* `http://localhost:8000/health`

### 2. Start Node.js Express ERP Backend (Port 5000)
```powershell
cd backend
npm run dev
```
*Health Check:* `http://localhost:5000/health`
*Database:* SQLite with Prisma pre-seeded (`backend/prisma/medicore.db`)

### 3. Start React Frontend (Port 5173)
```powershell
cd frontend
npm run dev
```
*App URL:* `http://localhost:5173`

---

## Demo Roles & 1-Click Role Switcher
In the top right navigation bar of the application, click **"Demo Role"** to switch instantly between:
1. **Admin / Medical Superintendent** (`admin@medicore.com`)
2. **Doctor (OPD Specialist)** (`doctor@medicore.com` - Dr. Sagun Adhikari)
3. **Receptionist** (`receptionist@medicore.com` - Suman Sunuwar)
4. **Nurse** (`nurse@medicore.com` - Sarah Jenkins)
5. **Pharmacist** (`pharmacist@medicore.com` - David Vance)
6. **Lab Technician** (`labtech@medicore.com` - Maya Sharma)
7. **Accountant** (`accountant@medicore.com` - James Wilson)


---

## Step-by-Step Viva Demonstration Walkthrough (SRS Appendix C)

### Step 1: Receptionist registers a patient & books appointment (Screenshot 1 Layout)
1. Switch to **Receptionist** role or click **"OPD Registration"** on sidebar.
2. Observe the **LunivaCare style multi-card form**:
   - Title, First Name, Last Name, Mobile, Gender, Age, DOB, State/District, Address.
   - Right side: Patient Category, Department (General Medicine), Doctor (Dr. Sagun Adhikari).
   - Financial Summary: Total Rs 500.
3. Click **"Submit"**:
   - System validates unique patient number (`MC-2026-XXXX`).
   - Checks for duplicate phone numbers (SRS TC-004).
   - Automatically generates OPD Appointment case number (`O/202604/X`).
4. Click **"Print Sticker"** or **"Re-Print Bill"** to preview official printable patient labels.

### Step 2: Doctor views OPD queue & opens clinical overview (Screenshot 3 & 2 Layouts)
1. Click **"OPD Management"** on sidebar / top nav:
   - Matches **EazyHMS Layout** (Screenshot 3).
   - Displays live patients: *Atul T Chandankhede*, *Vivek Pateliya*, *Jivan Parekh*, *Rajesh Gantharia*, etc.
   - Change Status inline: click the status dropdown from `WAITING` → `IN ROOM`.
2. Click the blue **"View"** button for patient *Atul T Chandankhede*:
   - Opens the **Swedish EMR Clinical Dashboard** (Screenshot 2).
   - Displays the 8 clinical cards:
     1. `Läkemedel` (Active medications: Omeprazole 40mg, Betapred, Cetirizine)
     2. `Kliniska Parametrar` (NEWS2: 2, SpO2: 98%, BP: 135/85 flagged red, Pulse: 102/min, BMI: 25.0)
     3. `Beställningar` (Lab orders: Blood Status, Glucose, Troponin T)
     4. `Svar` (Lab test results with normal/abnormal badges)
     5. `Bokat & Ej bokat` (Consultation visit history)
     6. `Social bakgrund` (Lifestyle, occupation, allergies)
     7. `Diagnoser` (ICD-10 coded hypertension, asthma, lumbago)
     8. `Remisser & Inskrivning` (Ward allocation & referral status)

### Step 3: AI generates a source-linked medical history summary (SRS UC-04, FR-058)
1. On the Clinical Overview page, click **"AI Clinical Summary"** (sparkle button).
2. The FastAPI AI microservice retrieves authorized consultations, vitals, prescriptions, and diagnoses.
3. Displays a validated draft narrative citing **Source Record IDs** for clinical traceability without hallucinating.

### Step 4 & 5: Doctor/Lab Tech uploads lab report with OCR & human review (SRS UC-05, FR-062)
1. Navigate to **"Lab & Diagnostics"** on sidebar.
2. Click **"AI OCR Report Extraction"**.
3. View or edit the sample scanned lab report text.
4. Click **"Parse Report with LLM Schema"**:
   - Extracts 10 standard test parameters (Hemoglobin, Glucose, Creatinine, CRP, etc.).
   - Computes reference ranges and flags out-of-range parameters (`HIGH` / `LOW`).
5. **Human Clinical Gate (FR-062)**: Click **"Approve & Commit to EHR"** to officially commit validated findings to the patient's record.

### Step 6: Doctor prescribes & Pharmacist dispenses with atomic stock check (SRS UC-07, TC-006)
1. Navigate to **"Pharmacy & Stock"**.
2. View medicines catalogue and batches with expiry dates (FEFO).
3. Click **"Dispense Medicine"** on *Omeprazol Teva 40mg*.
4. Test Insufficient Stock Protection (TC-006):
   - Enter a quantity higher than batch stock (e.g. 500 units) → system transactionally rejects with clear alert and prevents negative stock.
   - Enter a valid quantity (e.g. 10 units) → system executes an atomic transaction, decrements batch quantity, and logs an `InventoryTransaction`.

### Step 7: Accountant creates invoice and records payment (SRS FR-046, TC-013)
1. Navigate to **"Billing & Cashier"**.
2. View itemized invoices with Net Total, Paid Amount, and Balance.
3. Click **"Receive Pay"** on any invoice with an outstanding balance.
4. Enter partial payment (e.g. Rs 250 of Rs 500):
   - System updates `paidAmount` to Rs 250, recalculates `balanceAmount` to Rs 250, and shifts status to `PARTIAL`.
5. Click **"Print"** to generate an official hospital money receipt.

### Step 8: Admin requests monthly visit & revenue metrics (SRS FR-060, Section 8.3)
1. Navigate to **"AI Assistant (RAG)"** → click **"NL Analytics Query"** tab.
2. Click sample query button: *"Show monthly revenue for the last six months"* or *"Show consultations by department"*.
3. Click **"Run Analytics"**:
   - Backend routes query to approved parameterized analytics functions without arbitrary SQL execution.
   - Returns chart-ready labels, values, and visual bars matching SRS Section 8.3!

### Step 9: Admin asks about an approved hospital policy (RAG with Citations - SRS Section 8.2)
1. In **"AI Assistant"**, select **"RAG Policy Chatbot"** tab.
2. Submit questions such as:
   - *"What is the patient admission procedure?"*
   - *"What are the Emergency Triage levels?"*
   - *"What are the discharge summary requirements?"*
3. The AI service performs vector retrieval over approved indexed hospital SOPs in `ai-service/knowledge_docs/`.
4. Returns grounded answers accompanied by **exact document citations and page numbers** (e.g., `Hospital Admission Policy (Page 1)`).

