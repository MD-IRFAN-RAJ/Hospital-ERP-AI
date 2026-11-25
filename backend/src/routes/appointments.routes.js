const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// GET /api/v1/appointments - List appointments with filter
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, doctorId, patientId, appointmentType, fromDate, toDate } = req.query;
    const where = {};

    if (status && status !== 'ALL') where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (appointmentType && appointmentType !== 'ALL') where.appointmentType = appointmentType;

    if (fromDate || toDate) {
      where.startAt = {};
      if (fromDate) where.startAt.gte = new Date(fromDate);
      if (toDate) where.startAt.lte = new Date(toDate);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } }
      }
    });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/appointments - Book appointment with conflict prevention (SRS FR-021, TC-005)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR'), async (req, res) => {
  try {
    const { patientId, doctorId, startAt, endAt, appointmentType, reason } = req.body;

    if (!patientId || !doctorId || !startAt) {
      return res.status(400).json({ success: false, error: 'Patient, doctor, and start time are required' });
    }

    const startTime = new Date(startAt);
    const endTime = endAt ? new Date(endAt) : new Date(startTime.getTime() + 20 * 60000);

    // Concurrency / overlap check (TC-005)
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { in: ['CONFIRMED', 'WAITING', 'IN_ROOM'] },
        OR: [
          {
            startAt: { lt: endTime },
            endAt: { gt: startTime }
          }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Conflict: Doctor already has an active appointment in this time window.',
        conflictAppointmentId: existing.id
      });
    }

    const caseCount = await prisma.appointment.count();
    const caseNo = `O/${startTime.getFullYear()}${String(startTime.getMonth() + 1).padStart(2, '0')}/${caseCount + 1}`;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        startAt: startTime,
        endAt: endTime,
        status: 'WAITING',
        appointmentType: appointmentType || 'OPD',
        caseNo,
        reason: reason || 'Routine Consultation'
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } }
      }
    });

    await recordAudit(req.user.id, 'BOOK_APPOINTMENT', 'APPOINTMENT', appointment.id, {
      caseNo,
      patientId,
      doctorId
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/v1/appointments/:id/status - Update status (WAITING -> IN_ROOM -> COMPLETED)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'CONFIRMED', 'WAITING', 'IN_ROOM', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment status' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        patient: true,
        doctor: { include: { user: true } }
      }
    });

    await recordAudit(req.user.id, 'UPDATE_STATUS', 'APPOINTMENT', updated.id, { status });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

