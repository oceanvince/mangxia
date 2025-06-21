const express = require('express');
const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    // TODO: Replace with actual database query
    const dummyPatients = [
      {
        id: 1,
        name: 'John Doe',
        age: 32,
        lastVisit: '2024-03-15'
      },
      {
        id: 2,
        name: 'Jane Smith',
        age: 28,
        lastVisit: '2024-03-10'
      }
    ];

    res.json({ success: true, data: dummyPatients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Replace with actual database query
    const dummyPatient = {
      id: parseInt(id),
      name: 'John Doe',
      age: 32,
      lastVisit: '2024-03-15',
      medicalHistory: 'Sample medical history'
    };

    res.json({ success: true, data: dummyPatient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patient' });
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

    // TODO: Add validation here
    if (!name || !gender || !phone || !operation_type || !operation_date || !discharge_date || !metric_value || !doctor_suggested_dosage) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // TODO: Replace with actual database insertion
    const dummyResponse = {
      success: true,
      data: {
        patient_id: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        patient_name: name,
        gender: gender,
        phone_number: phone,
        surgery_type: operation_type,
        operation_date: operation_date,
        discharge_date: discharge_date,
        metric_value: metric_value,
        doctor_suggested_dosage: doctor_suggested_dosage,
      }
    };

    res.status(201).json(dummyResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering patient' });
  }
});

module.exports = router; 