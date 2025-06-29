const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const patientController = require('../controllers/patientController');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images/');
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳_随机数.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lab-report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 患者相关路由
router.get('/', patientController.getAllPatients);
router.get('/:patientId', patientController.getPatientById);
router.get('/:patientId/current-status', patientController.getCurrentStatus);
router.get('/:patientId/profile', patientController.getPatientProfile);
router.get('/:patientId/latest-active-plans', patientController.getLatestActivePlans);
router.get('/:patientId/metrics', patientController.getPatientMetrics);

router.post('/register', patientController.registerPatient);
router.post('/:patientId/metrics', upload.single('image'), patientController.addHealthMetric);

router.put('/medication-plan/:planId', patientController.updateMedicationPlan);

// Generate QR code for patient profile
router.get('/:patientId/qr-code', patientController.generateProfileQRCode);

// Bind account to patient profile
router.post('/bind-account', patientController.bindAccountToProfile);

// Unbind account from patient profile
router.post('/unbind-account', patientController.unbindAccountFromProfile);

module.exports = router; 