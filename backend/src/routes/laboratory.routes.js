const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// GET /api/v1/lab/orders - List lab orders (Sample 2 Beställningar)
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (patientId) where.patientId = patientId;

    const orders = await prisma.labOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        results: true
      }
    });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/lab/orders - Create lab order
router.post('/orders', authenticateToken, authorizeRoles('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { patientId, doctorId, priority, notes, testNames } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ success: false, error: 'Patient and Doctor are required' });
    }

    const labOrder = await prisma.labOrder.create({
      data: {
        patientId,
        doctorId,
        priority: priority || 'ROUTINE',
        notes: notes || 'Ordered during consultation',
        status: 'PENDING'
      },
      include: {
        patient: true,
        doctor: { include: { user: true } }
      }
    });

    // If pre-specified test names are provided, create pending result placeholders
    if (testNames && Array.isArray(testNames)) {
      for (const name of testNames) {
        await prisma.labResult.create({
          data: {
            labOrderId: labOrder.id,
            testName: name,
            category: 'General',
            value: 'PENDING',
            status: 'DRAFT'
          }
        });
      }
    }

    await recordAudit(req.user.id, 'CREATE_LAB_ORDER', 'LAB_ORDER', labOrder.id);

    res.status(201).json({ success: true, data: labOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/v1/lab/orders/:id/status - Update sample status
router.patch('/orders/:id/status', authenticateToken, authorizeRoles('LAB_TECHNICIAN', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.labOrder.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/lab/orders/:id/results - Submit test results (Sample 2 Svar)
router.post('/orders/:id/results', authenticateToken, authorizeRoles('LAB_TECHNICIAN', 'DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const labOrderId = req.params.id;
    const { results } = req.body; // Array of results

    if (!results || !results.length) {
      return res.status(400).json({ success: false, error: 'At least one test result is required' });
    }

    const createdResults = [];
    for (const r of results) {
      const resItem = await prisma.labResult.create({
        data: {
          labOrderId,
          testName: r.testName,
          category: r.category || 'Biochemistry',
          value: String(r.value),
          unit: r.unit || '',
          referenceRange: r.referenceRange || '',
          flag: r.flag || 'NORMAL',
          status: 'APPROVED',
          remarks: r.remarks || null
        }
      });
      createdResults.push(resItem);
    }

    // Mark order COMPLETED
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { status: 'COMPLETED' }
    });

    await recordAudit(req.user.id, 'SUBMIT_LAB_RESULTS', 'LAB_ORDER', labOrderId, { count: results.length });

    res.status(201).json({ success: true, data: createdResults });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

