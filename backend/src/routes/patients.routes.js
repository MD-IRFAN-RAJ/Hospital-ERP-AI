const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

// Helper to generate next patient number: MC-2026-XXXX
const generatePatientNumber = async () => {
  const count = await prisma.patient.count();
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, '0');
  return `MC-${year}-${num}`;
};

// GET /api/v1/patients - List & Search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, type, limit = 50 } = req.query;
    const where = {};

    if (type && type !== 'ALL') {
      where.patientType = type;
    }

    if (search) {
      const s = search.trim();
      where.OR = [
        { patientNumber: { contains: s } },
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { phone: { contains: s } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 1,
          include: { doctor: { include: { user: true, department: true } } }
        },
        bills: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/patients/:id - Full Medical & Clinical Overview
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: {
          orderBy: { startAt: 'desc' },
          include: { doctor: { include: { user: true, department: true } } }
        },
        records: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { include: { user: true } },
            vitals: true,
            prescriptions: { include: { items: { include: { medicine: true } } } }
          }
        },
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { medicine: true } }, doctor: { include: { user: true } } }
        },
        labOrders: {
          orderBy: { createdAt: 'desc' },
          include: { results: true, doctor: { include: { user: true } } }
        },
        admissions: {
          orderBy: { admittedAt: 'desc' },
          include: { bed: { include: { ward: true } } }
        },
        bills: {
          orderBy: { createdAt: 'desc' },
          include: { items: true, payments: true }
        },
        aiSummaries: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/patients - Register patient (LunivaCare style OPD Registration)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const {
      title,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      city,
      state,
      country,
      wardNo,
      ethnicity,
      bloodGroup,
      allergies,
      chronicDiseases,
      emergencyContact,
      isPoliceCase,
      patientType,
      doctorId,
      consultationFee,
      depositAmount
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'First name and last name are required' });
    }

    // Check possible duplicates (SRS TC-004)
    if (phone) {
      const duplicate = await prisma.patient.findFirst({
        where: { phone: phone.trim() }
      });
      if (duplicate && !req.query.force) {
        return res.status(200).json({
          success: false,
          warning: 'POTENTIAL_DUPLICATE',
          message: `A patient with phone number ${phone} is already registered (${duplicate.patientNumber}: ${duplicate.firstName} ${duplicate.lastName}). Pass force=true to proceed anyway.`,
          existingPatient: duplicate
        });
      }
    }

    const patientNumber = await generatePatientNumber();

    const patient = await prisma.patient.create({
      data: {
        patientNumber,
        title: title || 'Mr.',
        firstName,
        middleName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || 'Male',
        phone,
        email,
        address,
        city,
        state,
        country: country || 'Nepal',
        wardNo,
        ethnicity,
        bloodGroup,
        allergies,
        chronicDiseases,
        emergencyContact,
        isPoliceCase: Boolean(isPoliceCase),
        patientType: patientType || 'General'
      }
    });

    // If doctor assigned during OPD registration, create initial appointment
    let appointment = null;
    if (doctorId) {
      const now = new Date();
      const end = new Date(now.getTime() + 20 * 60000);
      const caseCount = await prisma.appointment.count();
      const caseNo = `O/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${caseCount + 1}`;

      appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          startAt: now,
          endAt: end,
          status: 'WAITING',
          appointmentType: 'OPD',
          caseNo,
          reason: 'Initial OPD Registration'
        }
      });
    }

    // If consultation fee or deposit recorded, create invoice
    let bill = null;
    const fee = Number(consultationFee || 0);
    const deposit = Number(depositAmount || fee);
    if (fee > 0 || deposit > 0) {
      const billCount = await prisma.bill.count();
      const billNumber = `INV-${new Date().getFullYear()}-${String(billCount + 1).padStart(4, '0')}`;
      const status = deposit >= fee ? 'PAID' : (deposit > 0 ? 'PARTIAL' : 'UNPAID');

      bill = await prisma.bill.create({
        data: {
          patientId: patient.id,
          billNumber,
          totalAmount: fee,
          discountAmount: 0,
          netAmount: fee,
          paidAmount: deposit,
          balanceAmount: Math.max(0, fee - deposit),
          status,
          items: {
            create: [
              {
                itemType: 'CONSULTATION',
                description: 'OPD General Consultation Fee',
                quantity: 1,
                unitPrice: fee,
                totalPrice: fee
              }
            ]
          },
          ...(deposit > 0 ? {
            payments: {
              create: [
                {
                  amount: deposit,
                  paymentMethod: 'CASH',
                  transactionRef: `REG-DEP-${Date.now()}`
                }
              ]
            }
          } : {})
        },
        include: { items: true, payments: true }
      });
    }

    await recordAudit(req.user.id, 'CREATE_PATIENT', 'PATIENT', patient.id, {
      patientNumber: patient.patientNumber,
      name: `${patient.firstName} ${patient.lastName}`
    });

    res.status(201).json({
      success: true,
      data: {
        patient,
        appointment,
        bill
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/v1/patients/:id - Update patient
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body
    });
    await recordAudit(req.user.id, 'UPDATE_PATIENT', 'PATIENT', updated.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

