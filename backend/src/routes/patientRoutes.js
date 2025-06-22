const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// 患者相关路由
router.get('/', patientController.getAllPatients);
router.get('/:patientId', patientController.getPatientById);
router.get('/:patientId/current-status', patientController.getCurrentStatus);
router.get('/:patientId/profile', patientController.getPatientProfile);
router.get('/:patientId/latest-active-plans', patientController.getLatestActivePlans);

router.post('/register', patientController.registerPatient);
router.post('/:patientId/metrics', patientController.addHealthMetric);

router.put('/medication-plan/:planId', patientController.updateMedicationPlan);

// Generate QR code for patient profile
router.get('/:patientId/qr-code', patientController.generateProfileQRCode);

// Bind account to patient profile
router.post('/bind-account', patientController.bindAccountToProfile);

// Unbind account from patient profile
router.post('/unbind-account', patientController.unbindAccountFromProfile);

module.exports = router; 