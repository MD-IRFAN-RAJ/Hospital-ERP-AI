require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patients.routes');
const doctorRoutes = require('./routes/doctors.routes');
const appointmentRoutes = require('./routes/appointments.routes');
const medicalRecordRoutes = require('./routes/medicalRecords.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const labRoutes = require('./routes/laboratory.routes');
const billingRoutes = require('./routes/billing.routes');
const admissionRoutes = require('./routes/admissions.routes');
const aiRoutes = require('./routes/ai.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MediCore Hospital ERP Modular Monolith',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes per SRS Base path /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1', pharmacyRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/bills', billingRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/audit', auditRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`MediCore Hospital ERP Backend running on port ${PORT}`);
  console.log(`REST Base Path: http://localhost:${PORT}/api/v1`);
  console.log(`Health Check:   http://localhost:${PORT}/health`);
  console.log(`===================================================`);
});

module.exports = app;

