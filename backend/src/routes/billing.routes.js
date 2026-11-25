const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// GET /api/v1/bills - List invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (patientId) where.patientId = patientId;

    const bills = await prisma.bill.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        items: true,
        payments: true
      }
    });

    res.json({ success: true, count: bills.length, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/bills/:id - Invoice details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        items: true,
        payments: true
      }
    });
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/bills - Create invoice (SRS FR-045, UC-08)
router.post('/', authenticateToken, authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { patientId, items, discountAmount = 0, taxRate = 0 } = req.body;

    if (!patientId || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'Patient and bill items are required' });
    }

    // Server-side calculation
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const discount = Number(discountAmount);
    const tax = ((subtotal - discount) * Number(taxRate)) / 100;
    const netAmount = Math.max(0, subtotal - discount + tax);

    const billCount = await prisma.bill.count();
    const billNumber = `INV-${new Date().getFullYear()}-${String(billCount + 1).padStart(4, '0')}`;

    const bill = await prisma.bill.create({
      data: {
        patientId,
        billNumber,
        totalAmount: subtotal,
        discountAmount: discount,
        taxAmount: tax,
        netAmount,
        paidAmount: 0,
        balanceAmount: netAmount,
        status: 'UNPAID',
        items: {
          create: items.map(i => ({
            itemType: i.itemType || 'PROCEDURE',
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.quantity) * Number(i.unitPrice)
          }))
        }
      },
      include: { items: true, patient: true }
    });

    await recordAudit(req.user.id, 'CREATE_INVOICE', 'BILL', bill.id, { billNumber, netAmount });

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/bills/:id/payments - Record Payment (SRS FR-046, TC-013)
router.post('/:id/payments', authenticateToken, authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const billId = req.params.id;
    const { amount, paymentMethod, transactionRef } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero' });
    }

    const updatedBill = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error('Invoice not found');

      if (bill.balanceAmount <= 0) {
        throw new Error('Invoice is already fully settled');
      }

      const newPaid = bill.paidAmount + paymentAmount;
      const newBalance = Math.max(0, bill.netAmount - newPaid);
      const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

      await tx.payment.create({
        data: {
          billId,
          amount: paymentAmount,
          paymentMethod: paymentMethod || 'CASH',
          transactionRef: transactionRef || `PAY-${Date.now()}`
        }
      });

      return tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus
        },
        include: { payments: true, items: true, patient: true }
      });
    });

    await recordAudit(req.user.id, 'RECORD_PAYMENT', 'BILL', billId, { amount: paymentAmount });

    res.json({
      success: true,
      message: 'Payment recorded and outstanding balance recalculated.',
      data: updatedBill
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

