const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// POST /api/v1/medical-records - Document Consultation (UC-03)
router.post('/', authenticateToken, authorizeRoles('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { patientId, doctorId, symptoms, diagnosis, clinicalNotes, icdCode, appointmentId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ success: false, error: 'patientId and doctorId are required' });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        symptoms,
        diagnosis,
        clinicalNotes,
        icdCode
      },
      include: {
        patient: true,
        doctor: { include: { user: true } }
      }
    });

    // If linked to active appointment, mark appointment COMPLETED
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' }
      });
    }

    await recordAudit(req.user.id, 'CREATE_CONSULTATION', 'MEDICAL_RECORD', record.id, { diagnosis });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/medical-records/:id/vitals - Record Vitals & Clinical Parameters (Sample 2 Kliniska Parametrar)
router.post('/:id/vitals', authenticateToken, async (req, res) => {
  try {
    const recordId = req.params.id;
    const {
      patientId,
      bloodPressure,
      pulse,
      temperature,
      spo2,
      respiratoryRate,
      height,
      weight,
      news2Score,
      painScore
    } = req.body;

    let bmi = null;
    if (height && weight) {
      const hM = height / 100;
      bmi = parseFloat((weight / (hM * hM)).toFixed(1));
    }

    const vital = await prisma.vital.create({
      data: {
        patientId,
        recordId: recordId !== 'standalone' ? recordId : null,
        bloodPressure,
        pulse: pulse ? Number(pulse) : null,
        temperature: temperature ? Number(temperature) : null,
        spo2: spo2 ? Number(spo2) : null,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        bmi,
        news2Score: news2Score ? Number(news2Score) : 0,
        painScore: painScore ? Number(painScore) : 0
      }
    });

    await recordAudit(req.user.id, 'RECORD_VITALS', 'VITAL', vital.id);

    res.status(201).json({ success: true, data: vital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/medical-records/:id/prescriptions - Create Prescription
router.post('/:id/prescriptions', authenticateToken, authorizeRoles('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const recordId = req.params.id;
    const { patientId, doctorId, notes, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'At least one medicine item is required' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        recordId: recordId !== 'standalone' ? recordId : null,
        patientId,
        doctorId,
        status: 'PENDING',
        notes,
        items: {
          create: items.map(item => ({
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || ''
          }))
        }
      },
      include: {
        items: { include: { medicine: true } }
      }
    });

    await recordAudit(req.user.id, 'CREATE_PRESCRIPTION', 'PRESCRIPTION', prescription.id, {
      itemsCount: items.length
    });

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

