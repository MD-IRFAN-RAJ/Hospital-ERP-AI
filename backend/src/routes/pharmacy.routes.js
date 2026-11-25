const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// GET /api/v1/medicines - List catalogue with batch stock
router.get('/medicines', authenticateToken, async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    const enriched = medicines.map(med => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      const isLowStock = totalStock <= med.reorderLevel;
      const now = new Date();
      const nearExpiryThreshold = new Date(now.getTime() + 90 * 24 * 3600 * 1000);
      const hasNearExpiry = med.batches.some(b => b.quantity > 0 && new Date(b.expiryDate) <= nearExpiryThreshold);

      return {
        ...med,
        totalStock,
        isLowStock,
        hasNearExpiry
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/inventory/low-stock - Low stock & near expiry alerts (SRS FR-035)
router.get('/inventory/low-stock', authenticateToken, async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: { batches: true }
    });

    const alerts = [];
    for (const m of medicines) {
      const stock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (stock <= m.reorderLevel) {
        alerts.push({
          type: 'LOW_STOCK',
          medicineId: m.id,
          name: m.name,
          currentStock: stock,
          reorderLevel: m.reorderLevel,
          message: `Stock level (${stock}) is at or below reorder threshold (${m.reorderLevel})`
        });
      }
    }

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/pharmacy/dispense - Transactional Dispense (SRS FR-034, UC-07, TC-006)
router.post('/pharmacy/dispense', authenticateToken, authorizeRoles('PHARMACIST', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { prescriptionId, items } = req.body;
    // items: [ { prescriptionItemId, batchId, quantity } ]

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'No items provided for dispensing' });
    }

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const dispensedItems = [];

      for (const item of items) {
        const batch = await tx.medicineBatch.findUnique({
          where: { id: item.batchId },
          include: { medicine: true }
        });

        if (!batch) {
          throw new Error(`Batch ID ${item.batchId} not found`);
        }

        if (batch.quantity < item.quantity) {
          // TC-006: Dispense more than stock rejected; stock unchanged
          throw new Error(`Insufficient stock for '${batch.medicine.name}' (Batch: ${batch.batchNumber}). Requested: ${item.quantity}, Available: ${batch.quantity}`);
        }

        // 1. Decrement batch quantity
        const updatedBatch = await tx.medicineBatch.update({
          where: { id: item.batchId },
          data: { quantity: batch.quantity - item.quantity }
        });

        // 2. Append inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            batchId: item.batchId,
            quantityChange: -Number(item.quantity),
            transactionType: 'DISPENSE',
            referenceId: prescriptionId || null
          }
        });

        // 3. Mark prescription item dispensed
        if (item.prescriptionItemId) {
          await tx.prescriptionItem.update({
            where: { id: item.prescriptionItemId },
            data: { isDispensed: true }
          });
        }

        dispensedItems.push({
          medicine: batch.medicine.name,
          batchNumber: batch.batchNumber,
          quantity: item.quantity,
          remainingStock: updatedBatch.quantity
        });
      }

      // If prescription provided, update its status
      if (prescriptionId) {
        await tx.prescription.update({
          where: { id: prescriptionId },
          data: { status: 'DISPENSED' }
        });
      }

      return dispensedItems;
    });

    await recordAudit(req.user.id, 'DISPENSE_MEDICINE', 'PHARMACY', prescriptionId, {
      itemsCount: items.length
    });

    res.json({
      success: true,
      message: 'Medications dispensed and inventory updated transactionally.',
      data: result
    });
  } catch (error) {
    console.error('Dispensing error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

