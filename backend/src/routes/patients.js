const express = require('express');
const router = express.Router();
const patientService = require('../services/patientService');
const { pool } = require('../db');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const result = await patientService.getAllPatientProfiles();
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: 'Error fetching patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await patientService.getPatientProfileById(id);
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ success: false, message: 'Error fetching patient' });
  }
});

// Update medication plan status
router.put('/medication-plan/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['active', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update medication plan status
      const result = await client.query(
        `UPDATE medication_plan_tab 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE plan_id = $2
         RETURNING *`,
        [status, planId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Medication plan not found' });
      }

      await client.query('COMMIT');
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating medication plan:', error);
    res.status(500).json({ success: false, message: 'Error updating medication plan' });
  }
});

// Register new patient
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      gender,
      phone,
      operation_type,
      operation_date,
      discharge_date,
      metric_value,
      doctor_suggested_dosage,
    } = req.body;

    // Validate required fields
    if (!name || !gender || !phone || !operation_type || !operation_date || !discharge_date || !metric_value || !doctor_suggested_dosage) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create patient profile
      const patientResult = await client.query(
        `INSERT INTO patient_profile_tab 
         (name, gender, phone, operation_type, operation_date, discharge_date) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING patient_id`,
        [name, gender, phone, operation_type, operation_date, discharge_date]
      );
      
      const patientId = patientResult.rows[0].patient_id;
      
      // Add health metric (INR)
      const metricResult = await client.query(
        `INSERT INTO health_metrics_tab 
         (patient_id, metric_type, metric_value, measured_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING metric_id`,
        [patientId, 'INR', metric_value]
      );
      
      const metricId = metricResult.rows[0].metric_id;
      
      // Create medication plan
      await client.query(
        `INSERT INTO medication_plan_tab 
         (patient_id, metric_id, medication_name, doctor_suggested_dosage, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [patientId, metricId, '华法林', doctor_suggested_dosage, 'active']
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: {
          patient_id: patientId,
          patient_name: name,
          gender: gender,
          phone_number: phone,
          operation_type: operation_type,
          operation_date: operation_date,
          discharge_date: discharge_date,
          metric_value: metric_value,
          doctor_suggested_dosage: doctor_suggested_dosage,
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering patient' });
  }
});

module.exports = router; 