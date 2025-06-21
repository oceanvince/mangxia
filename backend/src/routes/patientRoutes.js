const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

/**
 * @route GET /api/patients
 * @description Get all patient profiles with their assigned doctors
 * @access Private
 */
router.get('/', patientController.getAllPatients);

/**
 * @route GET /api/patients/:patientId
 * @description Get a specific patient's profile with their medication plans and health metrics
 * @access Private
 */
router.get('/:patientId', patientController.getPatientById);

/**
 * @route POST /api/patients/register
 * @description Register a new patient with health metrics and medication plan
 * @access Private
 */
router.post('/register', patientController.registerPatient);

/**
 * @route PUT /api/patients/medication-plan/:planId
 * @description Confirm or reject a medication plan and update doctor suggested dosage
 * @access Private (Admin/Doctor only)
 */
router.put('/medication-plan/:planId', patientController.updateMedicationPlan);

/**
 * @route POST /api/patients/:patientId/metrics
 * @description Add a new health metric for a patient, which triggers the creation of a new pending medication plan with a system-suggested dosage.
 * @access Private (for now, ideally should be accessible by the miniprogram service)
 */
router.post('/:patientId/metrics', patientController.addHealthMetricAndPlan);

module.exports = router; 