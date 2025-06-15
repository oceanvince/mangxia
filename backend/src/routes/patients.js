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

    res.json(dummyPatients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients' });
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

    res.json(dummyPatient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient' });
  }
});

module.exports = router; 