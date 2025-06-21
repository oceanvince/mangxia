const express = require('express');
const router = express.Router();
const patientService = require('../services/patientService');

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

// Get patient current medication status (for mini app) 小程序主页上获取病人当前用药状态
router.get('/mini/:patientId/current-status', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getPatientCurrentStatus(patientId);
    
    if (!result.success) {
      return res.status(404).json({ 
        success: false, 
        message: result.error 
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching patient current status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching patient current status' 
    });
  }
});

// Get patient by ID 病人详情页
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

// Update medication plan status 更新用药计划状态，确认、拒绝
router.put('/medication-plan/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, doctor_suggested_dosage } = req.body;

    // Validate status
    if (!status || !['active', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    // Validate doctor_suggested_dosage if provided
    if (doctor_suggested_dosage !== undefined && doctor_suggested_dosage !== null) {
      const dosage = parseFloat(doctor_suggested_dosage);
      if (isNaN(dosage) || dosage < 0) {
        return res.status(400).json({ success: false, message: 'Invalid doctor suggested dosage' });
      }
    }

    const result = await patientService.updateMedicationPlanStatus(planId, status, doctor_suggested_dosage);
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating medication plan:', error);
    res.status(500).json({ success: false, message: 'Error updating medication plan' });
  }
});

// Register new patient 新增病人
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

    const result = await patientService.registerPatient({
      name,
      gender,
      phone,
      operation_type,
      operation_date,
      discharge_date,
      metric_value,
      doctor_suggested_dosage,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering patient' });
  }
});

// Get latest 3 active medication plans 小程序历史记录上获取病人最新3条用药计划
router.get('/:patientId/latest-active-plans', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getLatestActivePlans(patientId);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: result.error 
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching latest active plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching latest active plans' 
    });
  }
});

// Get patient basic profile (for mini app) 小程序获取病人“我的”信息  
router.get('/mini/:patientId/basic-profile', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getPatientBasicProfile(patientId);
    
    if (!result.success) {
      return res.status(404).json({ 
        success: false, 
        message: result.error 
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching patient basic profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching patient basic profile' 
    });
  }
});

module.exports = router; 