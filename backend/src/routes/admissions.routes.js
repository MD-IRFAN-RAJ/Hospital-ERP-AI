const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// GET /api/v1/admissions/wards - List wards with beds
router.get('/wards', authenticateToken, async (req, res) => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          include: {
            admissions: {
              where: { status: 'ACTIVE' },
              include: { patient: true }
            }
          }
        }
      }
    });
    res.json({ success: true, data: wards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/admissions/beds/availability - Available beds
router.get('/beds/availability', authenticateToken, async (req, res) => {
  try {
    const availableBeds = await prisma.bed.findMany({
      where: { status: 'AVAILABLE' },
      include: { ward: true }
    });
    res.json({ success: true, count: availableBeds.length, data: availableBeds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/admissions - List all admissions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const admissions = await prisma.admission.findMany({
      orderBy: { admittedAt: 'desc' },
      include: {
        patient: true,
        bed: { include: { ward: true } }
      }
    });
    res.json({ success: true, count: admissions.length, data: admissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admissions - Register Admission & Allocate Bed (SRS FR-051)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const { patientId, bedId, reason } = req.body;

    if (!patientId || !bedId) {
      return res.status(400).json({ success: false, error: 'Patient ID and Bed ID are required' });
    }

    const admission = await prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({ where: { id: bedId } });
      if (!bed || bed.status !== 'AVAILABLE') {
        throw new Error('Selected bed is not available for admission');
      }

      // Mark bed OCCUPIED
      await tx.bed.update({
        where: { id: bedId },
        data: { status: 'OCCUPIED' }
      });

      // Update patient type to IPD
      await tx.patient.update({
        where: { id: patientId },
        data: { patientType: 'IPD' }
      });

      return tx.admission.create({
        data: {
          patientId,
          bedId,
          reason: reason || 'Inpatient medical management',
          status: 'ACTIVE'
        },
        include: {
          patient: true,
          bed: { include: { ward: true } }
        }
      });
    });

    await recordAudit(req.user.id, 'ADMIT_PATIENT', 'ADMISSION', admission.id, { bedId, patientId });

    res.status(201).json({ success: true, data: admission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admissions/:id/discharge - Discharge Patient (SRS FR-052)
router.post('/:id/discharge', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const admissionId = req.params.id;

    const discharged = await prisma.$transaction(async (tx) => {
      const adm = await tx.admission.findUnique({ where: { id: admissionId } });
      if (!adm || adm.status !== 'ACTIVE') {
        throw new Error('Admission record not found or already discharged');
      }

      // Free bed
      await tx.bed.update({
        where: { id: adm.bedId },
        data: { status: 'AVAILABLE' }
      });

      // Update admission
      return tx.admission.update({
        where: { id: admissionId },
        data: {
          status: 'DISCHARGED',
          dischargedAt: new Date()
        },
        include: {
          patient: true,
          bed: { include: { ward: true } }
        }
      });
    });

    await recordAudit(req.user.id, 'DISCHARGE_PATIENT', 'ADMISSION', admissionId);

    res.json({ success: true, message: 'Patient discharged and bed released.', data: discharged });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

