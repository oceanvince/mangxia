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

module.exports = router; 