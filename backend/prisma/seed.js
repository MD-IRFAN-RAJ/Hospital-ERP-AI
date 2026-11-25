const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MediCore synthetic hospital demo dataset...');

  // Hash common password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Departments
  const deptGen = await prisma.department.upsert({
    where: { name: 'General Medicine' },
    update: {},
    create: { name: 'General Medicine', description: 'Internal & outpatient adult medicine' }
  });
  const deptCardio = await prisma.department.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: { name: 'Cardiology', description: 'Comprehensive heart & cardiovascular diseases' }
  });
  const deptOrtho = await prisma.department.upsert({
    where: { name: 'Orthopedics' },
    update: {},
    create: { name: 'Orthopedics', description: 'Bones, joints, spine and trauma management' }
  });
  const deptPeds = await prisma.department.upsert({
    where: { name: 'Pediatrics' },
    update: {},
    create: { name: 'Pediatrics', description: 'Infant, child and adolescent health' }
  });
  const deptEmergency = await prisma.department.upsert({
    where: { name: 'Emergency Medicine' },
    update: {},
    create: { name: 'Emergency Medicine', description: '24/7 Level-1 Acute trauma and resuscitation' }
  });

  // 2. Staff Users & Doctors
  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@medicore.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@medicore.com',
      passwordHash,
      role: 'HOSPITAL_ADMIN'
    }
  });

  // Receptionist (Suman Sunuwar - from UI Screenshot 1)
  const recepUser = await prisma.user.upsert({
    where: { email: 'receptionist@medicore.com' },
    update: {},
    create: {
      name: 'Suman Sunuwar',
      email: 'receptionist@medicore.com',
      passwordHash,
      role: 'RECEPTIONIST'
    }
  });

  // Pharmacist
  const pharmUser = await prisma.user.upsert({
    where: { email: 'pharmacist@medicore.com' },
    update: {},
    create: {
      name: 'David Vance',
      email: 'pharmacist@medicore.com',
      passwordHash,
      role: 'PHARMACIST'
    }
  });

  // Lab Technician
  const labUser = await prisma.user.upsert({
    where: { email: 'labtech@medicore.com' },
    update: {},
    create: {
      name: 'Maya Sharma',
      email: 'labtech@medicore.com',
      passwordHash,
      role: 'LAB_TECHNICIAN'
    }
  });

  // Accountant
  const acctUser = await prisma.user.upsert({
    where: { email: 'accountant@medicore.com' },
    update: {},
    create: {
      name: 'James Wilson',
      email: 'accountant@medicore.com',
      passwordHash,
      role: 'ACCOUNTANT'
    }
  });

  // Nurse
  const nurseUser = await prisma.user.upsert({
    where: { email: 'nurse@medicore.com' },
    update: {},
    create: {
      name: 'Sarah Jenkins',
      email: 'nurse@medicore.com',
      passwordHash,
      role: 'NURSE'
    }
  });

  // Doctors (From Screenshot 1 & 3: Dr. Sagun Adhikari, Dr. Phonchai, Dr. Kitikon, Dr. Ekkachai)
  const docUser1 = await prisma.user.upsert({
    where: { email: 'doctor@medicore.com' },
    update: {},
    create: {
      name: 'Dr. Sagun Adhikari',
      email: 'doctor@medicore.com',
      passwordHash,
      role: 'DOCTOR'
    }
  });
  const doctor1 = await prisma.doctor.upsert({
    where: { licenseNumber: 'NMC-54321' },
    update: {},
    create: {
      userId: docUser1.id,
      departmentId: deptGen.id,
      specialization: 'Senior Consultant Physician',
      licenseNumber: 'NMC-54321',
      consultationFee: 500,
      roomNumber: 'OPD-102'
    }
  });

  const docUser2 = await prisma.user.upsert({
    where: { email: 'cardio@medicore.com' },
    update: {},
    create: {
      name: 'Dr. Phonchai Atsawawinitkunchai',
      email: 'cardio@medicore.com',
      passwordHash,
      role: 'DOCTOR'
    }
  });
  const doctor2 = await prisma.doctor.upsert({
    where: { licenseNumber: 'NMC-88124' },
    update: {},
    create: {
      userId: docUser2.id,
      departmentId: deptCardio.id,
      specialization: 'Consultant Cardiologist',
      licenseNumber: 'NMC-88124',
      consultationFee: 750,
      roomNumber: 'OPD-105'
    }
  });

  const docUser3 = await prisma.user.upsert({
    where: { email: 'ortho@medicore.com' },
    update: {},
    create: {
      name: 'Dr. Kitikon Wichairueangtham',
      email: 'ortho@medicore.com',
      passwordHash,
      role: 'DOCTOR'
    }
  });
  const doctor3 = await prisma.doctor.upsert({
    where: { licenseNumber: 'NMC-91204' },
    update: {},
    create: {
      userId: docUser3.id,
      departmentId: deptOrtho.id,
      specialization: 'Orthopedic & Joint Surgeon',
      licenseNumber: 'NMC-91204',
      consultationFee: 650,
      roomNumber: 'OPD-108'
    }
  });

  const docUser4 = await prisma.user.upsert({
    where: { email: 'peds@medicore.com' },
    update: {},
    create: {
      name: 'Dr. Ekkachai Chioratamnuai',
      email: 'peds@medicore.com',
      passwordHash,
      role: 'DOCTOR'
    }
  });
  const doctor4 = await prisma.doctor.upsert({
    where: { licenseNumber: 'NMC-74199' },
    update: {},
    create: {
      userId: docUser4.id,
      departmentId: deptPeds.id,
      specialization: 'Consultant Pediatrician',
      licenseNumber: 'NMC-74199',
      consultationFee: 500,
      roomNumber: 'OPD-110'
    }
  });

  // 3. Patients (Exact list from UI Screenshot 3)
  const patientData = [
    {
      patientNumber: 'MC-2026-0001',
      title: 'Mr.',
      firstName: 'Atul',
      lastName: 'T Chandankhede',
      dateOfBirth: new Date('1984-04-12'),
      gender: 'Male',
      phone: '9841234567',
      address: 'Gandaki 4, Kaski, Pokhara',
      city: 'Pokhara',
      state: 'Gandaki',
      bloodGroup: 'B+',
      allergies: 'Penicillin',
      chronicDiseases: 'Hypertension, Type 2 Diabetes',
      patientType: 'OPD',
      doctor: doctor2,
      caseNo: 'O/202605/5',
      status: 'IN_ROOM',
      time: '10:30'
    },
    {
      patientNumber: 'MC-2026-0002',
      title: 'Mr.',
      firstName: 'Vivek',
      lastName: 'Pateliya',
      dateOfBirth: new Date('1991-08-22'),
      gender: 'Male',
      phone: '9851023456',
      address: 'Kathmandu-3, Bagmati',
      city: 'Kathmandu',
      state: 'Bagmati',
      bloodGroup: 'O+',
      allergies: 'None',
      chronicDiseases: 'Mild Gastritis',
      patientType: 'OPD',
      doctor: doctor2,
      caseNo: 'O/202604/3',
      status: 'WAITING',
      time: '08:15'
    },
    {
      patientNumber: 'MC-2026-0003',
      title: 'Mr.',
      firstName: 'Jivan',
      lastName: 'Parekh',
      dateOfBirth: new Date('1976-11-05'),
      gender: 'Male',
      phone: '9801239876',
      address: 'Lalitpur-14, Kumaripati',
      city: 'Lalitpur',
      state: 'Bagmati',
      bloodGroup: 'A+',
      allergies: 'Sulfa drugs',
      chronicDiseases: 'Lumbar spondylosis',
      patientType: 'OPD',
      doctor: doctor3,
      caseNo: 'O/202604/2',
      status: 'IN_ROOM',
      time: '21:30'
    },
    {
      patientNumber: 'MC-2026-0004',
      title: 'Mr.',
      firstName: 'Rajesh',
      lastName: 'Gantharia',
      dateOfBirth: new Date('1988-02-17'),
      gender: 'Male',
      phone: '9849988776',
      address: 'Bhaktapur-2, Durbar Square',
      city: 'Bhaktapur',
      state: 'Bagmati',
      bloodGroup: 'AB+',
      allergies: 'None',
      chronicDiseases: 'Bronchial Asthma',
      patientType: 'OPD',
      doctor: doctor4,
      caseNo: 'O/202604/1',
      status: 'WAITING',
      time: '15:40'
    },
    {
      patientNumber: 'MC-2026-0005',
      title: 'Mr.',
      firstName: 'Kishor',
      lastName: 'Singha',
      dateOfBirth: new Date('1995-09-14'),
      gender: 'Male',
      phone: '9812341234',
      address: 'Biratnagar-5, Morang',
      city: 'Biratnagar',
      state: 'Koshi',
      bloodGroup: 'O-',
      allergies: 'NSAIDs',
      chronicDiseases: 'None',
      patientType: 'OPD',
      doctor: doctor4,
      caseNo: 'O/202603/6590',
      status: 'WAITING',
      time: '13:33'
    },
    {
      patientNumber: 'MC-2026-0006',
      title: 'Mr.',
      firstName: 'Shubrato',
      lastName: 'Das',
      dateOfBirth: new Date('1980-06-30'),
      gender: 'Male',
      phone: '9865432109',
      address: 'Chitwan-8, Bharatpur',
      city: 'Bharatpur',
      state: 'Bagmati',
      bloodGroup: 'B-',
      allergies: 'None',
      chronicDiseases: 'Hyperlipidemia',
      patientType: 'OPD',
      doctor: doctor4,
      caseNo: 'O/202603/6588',
      status: 'WAITING',
      time: '11:23'
    },
    {
      patientNumber: 'MC-2026-0007',
      title: 'Mr.',
      firstName: 'Samir',
      lastName: 'Agrawal',
      dateOfBirth: new Date('1972-12-08'),
      gender: 'Male',
      phone: '9841002233',
      address: 'Dharan-1, Sunsari',
      city: 'Dharan',
      state: 'Koshi',
      bloodGroup: 'A-',
      allergies: 'Aspirin',
      chronicDiseases: 'Osteoarthritis knee',
      patientType: 'OPD',
      doctor: doctor3,
      caseNo: 'O/202603/6585',
      status: 'IN_ROOM',
      time: '10:45'
    }
  ];

  let primaryPatient = null;

  for (const p of patientData) {
    const createdPatient = await prisma.patient.upsert({
      where: { patientNumber: p.patientNumber },
      update: {},
      create: {
        patientNumber: p.patientNumber,
        title: p.title,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        phone: p.phone,
        address: p.address,
        city: p.city,
        state: p.state,
        country: 'Nepal',
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        chronicDiseases: p.chronicDiseases,
        patientType: p.patientType
      }
    });

    if (p.patientNumber === 'MC-2026-0001') {
      primaryPatient = createdPatient;
    }

    // Create Appointment
    const now = new Date();
    const [h, m] = p.time.split(':').map(Number);
    const apptStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const apptEnd = new Date(apptStart.getTime() + 20 * 60000);

    await prisma.appointment.create({
      data: {
        patientId: createdPatient.id,
        doctorId: p.doctor.id,
        startAt: apptStart,
        endAt: apptEnd,
        status: p.status,
        appointmentType: 'OPD',
        caseNo: p.caseNo,
        reason: 'Routine OPD consultation and follow-up'
      }
    });

    // Create invoice for each OPD registration
    await prisma.bill.create({
      data: {
        patientId: createdPatient.id,
        billNumber: `INV-2026-${p.patientNumber.split('-')[2]}`,
        totalAmount: p.doctor.consultationFee,
        discountAmount: 0,
        netAmount: p.doctor.consultationFee,
        paidAmount: p.doctor.consultationFee,
        balanceAmount: 0,
        status: 'PAID',
        items: {
          create: [
            {
              itemType: 'CONSULTATION',
              description: `OPD Specialist Consultation - ${p.doctor.specialization}`,
              quantity: 1,
              unitPrice: p.doctor.consultationFee,
              totalPrice: p.doctor.consultationFee
            }
          ]
        },
        payments: {
          create: [
            {
              amount: p.doctor.consultationFee,
              paymentMethod: 'CASH',
              transactionRef: `REC-${Date.now()}`
            }
          ]
        }
      }
    });
  }

  // 4. Detailed Clinical Data for Primary Patient (Matching UI Screenshot 2 Swedish EMR)
  if (primaryPatient) {
    // Consultation Record
    const medRec = await prisma.medicalRecord.create({
      data: {
        patientId: primaryPatient.id,
        doctorId: doctor1.id,
        symptoms: 'Dyspnea upon moderate exertion, epigastric burning after meals, intermittent lumbar aching.',
        diagnosis: 'Circulatory system disorder (Essential Hypertension), Gastroesophageal reflux disease, Mild bronchial hyperreactivity.',
        clinicalNotes: 'Patient advised sodium restriction, maintain daily blood pressure diary, continuation of proton-pump inhibitor, follow up in 2 weeks.',
        icdCode: 'I10 / K21.9'
      }
    });

    // Vitals (From Screenshot 2: NEWS2: 2, SpO2: 98%, BP: 135/85, Pulse: 102/min, Temp: 36.9, Ht: 200, Wt: 100, BMI: 25.0)
    await prisma.vital.create({
      data: {
        patientId: primaryPatient.id,
        recordId: medRec.id,
        bloodPressure: '135/85',
        pulse: 102,
        temperature: 36.9,
        spo2: 98,
        respiratoryRate: 11,
        height: 200,
        weight: 100,
        bmi: 25.0,
        news2Score: 2,
        painScore: 2
      }
    });

    // Medicines Catalogue & Batches
    const medOmeprazole = await prisma.medicine.upsert({
      where: { name: 'Omeprazol Teva 40mg' },
      update: {},
      create: {
        name: 'Omeprazol Teva 40mg',
        genericName: 'Omeprazole',
        category: 'Proton Pump Inhibitor',
        manufacturer: 'Teva Pharmaceuticals',
        unitPrice: 15.0,
        reorderLevel: 25,
        batches: {
          create: [
            { batchNumber: 'BAT-OMP-2026A', expiryDate: new Date('2027-08-30'), quantity: 180, costPrice: 8.0 }
          ]
        }
      }
    });

    const medBetapred = await prisma.medicine.upsert({
      where: { name: 'Betapred 0.5mg' },
      update: {},
      create: {
        name: 'Betapred 0.5mg',
        genericName: 'Betamethasone',
        category: 'Corticosteroid',
        manufacturer: 'Swedish Orphan Biovitrum',
        unitPrice: 20.0,
        reorderLevel: 20,
        batches: {
          create: [
            { batchNumber: 'BAT-BET-2026B', expiryDate: new Date('2026-12-15'), quantity: 60, costPrice: 11.0 }
          ]
        }
      }
    });

    const medCetirizin = await prisma.medicine.upsert({
      where: { name: 'Cetirizin Sandoz 10mg' },
      update: {},
      create: {
        name: 'Cetirizin Sandoz 10mg',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Antihistamine',
        manufacturer: 'Sandoz',
        unitPrice: 8.0,
        reorderLevel: 30,
        batches: {
          create: [
            { batchNumber: 'BAT-CET-2026C', expiryDate: new Date('2027-10-20'), quantity: 140, costPrice: 4.0 }
          ]
        }
      }
    });

    const medDesloratadine = await prisma.medicine.upsert({
      where: { name: 'Desloratadine Actavis 5mg' },
      update: {},
      create: {
        name: 'Desloratadine Actavis 5mg',
        genericName: 'Desloratadine',
        category: 'Antihistamine',
        manufacturer: 'Actavis',
        unitPrice: 12.0,
        reorderLevel: 25,
        batches: {
          create: [
            { batchNumber: 'BAT-DES-2026D', expiryDate: new Date('2027-05-18'), quantity: 95, costPrice: 6.5 }
          ]
        }
      }
    });

    // Create Prescriptions (Screenshot 2: Läkemedel)
    await prisma.prescription.create({
      data: {
        recordId: medRec.id,
        patientId: primaryPatient.id,
        doctorId: doctor1.id,
        status: 'DISPENSED',
        notes: 'Take after meals. Do not crush enteric coated capsules.',
        items: {
          create: [
            {
              medicineId: medOmeprazole.id,
              dosage: '40 mg',
              frequency: '1 capsule x 2 daily',
              duration: '14 days',
              instructions: 'Before breakfast and dinner',
              isDispensed: true
            },
            {
              medicineId: medBetapred.id,
              dosage: '0.5 mg',
              frequency: 'According to special schedule',
              duration: '5 days',
              instructions: 'Tapering dose',
              isDispensed: true
            },
            {
              medicineId: medCetirizin.id,
              dosage: '10 mg',
              frequency: '1 tablet once daily at bedtime',
              duration: '10 days',
              instructions: 'At bedtime',
              isDispensed: true
            },
            {
              medicineId: medDesloratadine.id,
              dosage: '5 mg',
              frequency: '1 tablet once daily',
              duration: '10 days',
              instructions: 'Morning with water',
              isDispensed: true
            }
          ]
        }
      }
    });

    // Lab Orders & Results (Screenshot 2: Beställningar & Svar)
    const labOrder = await prisma.labOrder.create({
      data: {
        patientId: primaryPatient.id,
        doctorId: doctor1.id,
        priority: 'ROUTINE',
        status: 'COMPLETED',
        notes: 'Routine metabolic profile and inflammatory workup',
        results: {
          create: [
            { testName: 'B-Hemoglobin', category: 'Kemi', value: '120', unit: 'g/L', referenceRange: '134 - 170', flag: 'LOW', remarks: 'Mild microcytic anemia' },
            { testName: 'B-Leukocyter', category: 'Kemi', value: '5.0', unit: '10^9/L', referenceRange: '3.5 - 8.8', flag: 'NORMAL' },
            { testName: 'B-Trombocyter', category: 'Kemi', value: '200', unit: '10^9/L', referenceRange: '145 - 348', flag: 'NORMAL' },
            { testName: 'P-Glukos', category: 'Kemi', value: '5.8', unit: 'mmol/L', referenceRange: '4.2 - 6.0', flag: 'NORMAL' },
            { testName: 'P-Troponin T', category: 'Kemi', value: '< 5', unit: 'ng/L', referenceRange: '< 14', flag: 'NORMAL' },
            { testName: 'S-ALAT', category: 'Kemi', value: '0.45', unit: 'ukat/L', referenceRange: '< 0.75', flag: 'NORMAL' },
            { testName: 'S-Kalium', category: 'Kemi', value: '4.1', unit: 'mmol/L', referenceRange: '3.5 - 4.6', flag: 'NORMAL' },
            { testName: 'S-Natrium', category: 'Kemi', value: '141', unit: 'mmol/L', referenceRange: '137 - 145', flag: 'NORMAL' },
            { testName: 'S-Kreatinin', category: 'Kemi', value: '88', unit: 'umol/L', referenceRange: '60 - 105', flag: 'NORMAL' },
            { testName: 'S-CRP', category: 'Kemi', value: '4.2', unit: 'mg/L', referenceRange: '< 5.0', flag: 'NORMAL' }
          ]
        }
      }
    });
  }

  // 5. Inpatient Wards & Beds
  const wardGen = await prisma.ward.upsert({
    where: { name: 'General Ward A' },
    update: {},
    create: {
      name: 'General Ward A',
      wardType: 'GENERAL',
      floor: 2,
      beds: {
        create: [
          { bedNumber: 'GW-101', status: 'AVAILABLE', dailyRate: 800 },
          { bedNumber: 'GW-102', status: 'AVAILABLE', dailyRate: 800 },
          { bedNumber: 'GW-103', status: 'OCCUPIED', dailyRate: 800 },
          { bedNumber: 'GW-104', status: 'AVAILABLE', dailyRate: 800 },
          { bedNumber: 'GW-105', status: 'MAINTENANCE', dailyRate: 800 }
        ]
      }
    }
  });

  const wardICU = await prisma.ward.upsert({
    where: { name: 'Intensive Care Unit (ICU)' },
    update: {},
    create: {
      name: 'Intensive Care Unit (ICU)',
      wardType: 'ICU',
      floor: 3,
      beds: {
        create: [
          { bedNumber: 'ICU-01', status: 'AVAILABLE', dailyRate: 5000 },
          { bedNumber: 'ICU-02', status: 'OCCUPIED', dailyRate: 5000 },
          { bedNumber: 'ICU-03', status: 'AVAILABLE', dailyRate: 5000 }
        ]
      }
    }
  });

  console.log('MediCore Database successfully seeded with synthetic hospital dataset!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

