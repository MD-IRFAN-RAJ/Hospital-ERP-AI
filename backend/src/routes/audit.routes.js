const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/v1/audit/logs - Audit trail
router.get('/logs', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

