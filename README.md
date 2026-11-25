# MediCore - AI-Powered Hospital ERP System
**Software Requirements Specification & Technical Implementation**
*College Minor Project - Version 1.0*

MediCore is a web-based Hospital ERP system designed to centralize hospital operations connecting patient care, appointments, electronic medical records (EMR), pharmacy, laboratory, billing, and inpatient ward administration, with assistive AI capabilities for document retrieval (RAG), summarization, OCR extraction, and natural-language analytics.

---

## Architecture Overview
Per SRS Section 4, MediCore utilizes a **Modular Monolith + Python AI Microservice** architecture:

```
Hospital Users (Web Browser)
        │
        ▼
React Frontend (Vite + Tailwind CSS) [Port 5173]
  ├── Screenshot 1: LunivaCare OPD Registration
  ├── Screenshot 2: Swedish EMR 8-Card Clinical Dashboard
  └── Screenshot 3: EazyHMS OPD Queue Management Table
        │
        ▼ REST API (JWT + RBAC)
Node.js Express ERP Backend [Port 5000]
  ├── Modules: Auth, Patients, Doctors, Appointments,
  │            Medical Records, Pharmacy, Lab, Billing, Wards, Audit
  └── Prisma ORM + Relational Storage (medicore.db)
        │
        ▼ Protected Service-to-Service Call
Python FastAPI AI Service [Port 8000]
  ├── RAG Assistant (Vector retrieval over Hospital SOPs)
  ├── Clinical History Summarizer (Source-linked record IDs)
  ├── OCR Lab Report Extractor (Human clinical review gate)
  └── Natural-Language Analytics (Approved whitelist tools)
```

---

## UI Implementations from Provided Design Samples

1. **LunivaCare OPD Patient Registration (`media_1795591278995_3f10268c.jpg`)**:
   - Left side: Full patient demographic information (Patient ID, Mobile, Title, Names, Gender, Age, DOB, Country, State, District, Municipality, Address, Ward No, Ethnicity, Blood Group).
   - Right side: Financial information (Category, Type, Department, Doctor, POPD Consultation tag).
   - Financial Summary: Actual Total, Discount, Rounded Amount, Total (Large font).
   - Collapsible sections: Contact info, Patient info, Police Case toggle.
   - Action buttons: Re-Print Bill, Print Sticker, Submit.

2. **Swedish EMR Patient Overview (`media_1795591291638_bc266efa.jpg`)**:
   - 8-Card clinical grid:
     1. `Läkemedel` (Active prescriptions & medications)
     2. `Kliniska Parametrar` (NEWS2 score, SpO2, Blood Pressure with flag, Pulse, Temp, BMI)
     3. `Beställningar` (Lab orders & investigations)
     4. `Svar` (Lab test findings with normal/abnormal badges)
     5. `Bokat & Ej bokat` (Appointments & visits)
     6. `Social bakgrund` (Living, occupation, allergies)
     7. `Diagnoser` (ICD-10 coded conditions)
     8. `Remisser & Inskrivning` (Inpatient admission & referral status)

3. **EazyHMS OPD Management Table (`media_1795591303426_381e8117.jpg`)**:
   - Quick action pills: `New Registration`, `OPD`, `IPD`, `LAB`, `RAD`, `OTHER`.
   - Filter bar: Patient search, date range, department filter, count badge.
   - Patient Queue Table: Columns for Patient Name, Type, Case No, Doctor, Patient Type, Date, Time, Status dropdown (`IN ROOM`, `WAITING`, `COMPLETED`), Action buttons (`View`, `Edit`, `Payment`).

---

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios
- **Core ERP API**: Node.js, Express.js, Prisma ORM, JWT, Bcrypt
- **Database**: SQLite (turnkey zero-config) / PostgreSQL (production ready)
- **AI Microservice**: Python 3, FastAPI, Pydantic, TF-IDF Vector Search, Scikit-learn
- **Testing & Traceability**: Immutable audit logs, transactional stock decrements, human review gates

---

## Quick Setup Instructions

### 1. Requirements
- Node.js >= 18
- Python >= 3.10

### 2. Run Python AI Service
```bash
cd ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Run Backend ERP
```bash
cd backend
npm run dev
```

### 4. Run Frontend
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Test Accounts & Roles
| Role | Email | Password | Name |
|---|---|---|---|
| Hospital Admin | admin@medicore.com | password123 | System Administrator |
| Doctor | doctor@medicore.com | password123 | Dr. Sagun Adhikari |
| Receptionist | receptionist@medicore.com | password123 | Suman Sunuwar |
| Nurse | nurse@medicore.com | password123 | Sarah Jenkins |
| Pharmacist | pharmacist@medicore.com | password123 | David Vance |
| Lab Tech | labtech@medicore.com | password123 | Maya Sharma |
| Accountant | accountant@medicore.com | password123 | James Wilson |

*Use the 1-click **Demo Role** dropdown on the top right navigation bar to test any role instantly.*

