const patientService = require('../services/patientService');

// 获取所有患者
const getAllPatients = async (req, res) => {
  try {
    const result = await patientService.getAllPatients();
    res.json(result);
  } catch (error) {
    console.error('获取患者列表失败:', error);
    res.status(500).json({ success: false, error: '获取患者列表失败' });
  }
};

// 根据ID获取患者详情
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getPatientById(patientId);
    res.json(result);
  } catch (error) {
    console.error('获取患者详情失败:', error);
    res.status(500).json({ success: false, error: '获取患者详情失败' });
  }
};

// 获取患者当前状态
const getCurrentStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getCurrentStatus(patientId);
    res.json(result);
  } catch (error) {
    console.error('获取患者当前状态失败:', error);
    res.status(500).json({ success: false, error: '获取患者当前状态失败' });
  }
};

// 获取患者基本信息
const getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getPatientProfile(patientId);
    res.json(result);
  } catch (error) {
    console.error('获取患者基本信息失败:', error);
    res.status(500).json({ success: false, error: '获取患者基本信息失败' });
  }
};

// 获取最新用药计划
const getLatestActivePlans = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getLatestActivePlans(patientId);
    res.json(result);
  } catch (error) {
    console.error('获取最新用药计划失败:', error);
    res.status(500).json({ success: false, error: '获取最新用药计划失败' });
  }
};

// 获取患者健康指标记录
const getPatientMetrics = async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await patientService.getPatientMetrics(patientId);
    res.json(result);
  } catch (error) {
    console.error('获取患者健康指标失败:', error);
    res.status(500).json({ success: false, error: '获取患者健康指标失败' });
  }
};

// 注册新患者
const registerPatient = async (req, res) => {
  try {
    const patientData = req.body;
    
    // 基本验证
    if (!patientData.name || !patientData.phone) {
      return res.status(400).json({ success: false, error: '姓名和手机号必填' });
    }
    
    const result = await patientService.registerPatient(patientData);
    res.status(201).json(result);
  } catch (error) {
    console.error('注册患者失败:', error);
    res.status(500).json({ success: false, error: '注册患者失败' });
  }
};

// 添加健康指标
const addHealthMetric = async (req, res) => {
  try {
    const { patientId } = req.params;
    const metricData = req.body;
    const imageFile = req.file; // 从multer获取上传的文件
    
    // 输入验证
    if (!metricData.metric_value || !metricData.metric_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'INR值和指标类型不能为空' 
      });
    }
    
    // INR值范围验证
    const inrValue = parseFloat(metricData.metric_value);
    if (isNaN(inrValue) || inrValue <= 0 || inrValue > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'INR值必须在0-10之间的有效数字' 
      });
    }
    
    // 检查时间验证（如果提供）
    if (metricData.measured_at) {
      const measuredDate = new Date(metricData.measured_at);
      const now = new Date();
      if (measuredDate > now) {
        return res.status(400).json({ 
          success: false, 
          error: '检查时间不能晚于当前时间' 
        });
      }
    }
    
    // 图片文件验证（如果提供）
    if (imageFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({
          success: false,
          error: '只支持 JPG、PNG、GIF 格式的图片'
        });
      }
      
      // 限制文件大小为5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: '图片文件大小不能超过5MB'
        });
      }
    }
    
    const result = await patientService.addHealthMetric(patientId, metricData, imageFile);
    res.status(201).json(result);
  } catch (error) {
    console.error('添加健康指标失败:', error);
    res.status(500).json({ success: false, error: '添加健康指标失败' });
  }
};

// 更新用药计划
const updateMedicationPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;
    
    const result = await patientService.updateMedicationPlan(planId, updateData);
    res.json(result);
  } catch (error) {
    console.error('更新用药计划失败:', error);
    res.status(500).json({ success: false, error: '更新用药计划失败' });
  }
};

// Bind account to patient profile
const bindAccountToProfile = async (req, res) => {
  try {
    const { accountId, patientId } = req.body;
    
    // Basic validation
    if (!accountId || !patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both accountId and patientId are required' 
      });
    }

    const result = await patientService.bindAccountToProfile(accountId, patientId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('绑定账号失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '绑定账号失败' 
    });
  }
};

// Generate QR code for patient profile
const generateProfileQRCode = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: '患者ID不能为空'
      });
    }

    const result = await patientService.generateProfileQRCode(patientId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('生成二维码失败:', error);
    res.status(500).json({
      success: false,
      error: '生成二维码失败'
    });
  }
};

// Unbind account from patient profile
const unbindAccountFromProfile = async (req, res) => {
  try {
    const { accountId, patientId } = req.body;
    
    // Basic validation
    if (!accountId || !patientId) {
      return res.status(400).json({ 
        success: false, 
        error: '账号ID和患者ID不能为空' 
      });
    }

    const result = await patientService.unbindAccountFromProfile(accountId, patientId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('解绑账号失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '解绑账号失败' 
    });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getCurrentStatus,
  getPatientProfile,
  getLatestActivePlans,
  getPatientMetrics,
  registerPatient,
  addHealthMetric,
  updateMedicationPlan,
  bindAccountToProfile,
  generateProfileQRCode,
  unbindAccountFromProfile
}; 