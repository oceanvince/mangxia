const db = require('../db');
const QRCode = require('qrcode');

// 获取所有患者
const getAllPatients = async () => {
  try {
    const query = `
      SELECT
        p.patient_id,
        p.name AS patient_name,
        p.phone AS phone_number,
        p.gender,
        p.operation_type,
        TO_CHAR(p.operation_date, 'YYYY-MM-DD') AS operation_date,
        TO_CHAR(p.discharge_date, 'YYYY-MM-DD') AS discharge_date,
        lp.latest_inr,
        lp.latest_inr_date,
        lp.system_suggested_dosage AS suggested_dose,
        lp.status AS latest_plan_status,
        lp.plan_id AS latest_plan_id,
        CASE
          WHEN lp.status = 'pending' THEN lp.previous_dosage
          ELSE lp.doctor_suggested_dosage
        END AS current_dose
      FROM patient_profile_tab p
      LEFT JOIN (
        WITH ranked_plans AS (
          SELECT
            mp.patient_id,
            mp.plan_id,
            mp.status,
            mp.previous_dosage,
            mp.doctor_suggested_dosage,
            mp.system_suggested_dosage,
            hm.metric_value AS latest_inr,
            hm.measured_at,
            TO_CHAR(hm.measured_at, 'YYYY-MM-DD') AS latest_inr_date,
            ROW_NUMBER() OVER(PARTITION BY mp.patient_id ORDER BY (mp.status = 'pending') DESC, hm.measured_at DESC) as rn
          FROM medication_plan_tab mp
          LEFT JOIN health_metrics_tab hm ON mp.metric_id = hm.metric_id
          WHERE mp.status IN ('pending', 'active')
        )
        SELECT * FROM ranked_plans WHERE rn = 1
      ) AS lp ON p.patient_id = lp.patient_id
      ORDER BY
        (lp.status = 'pending') DESC,
        lp.measured_at DESC NULLS LAST,
        p.created_at DESC;
    `;
    const { rows } = await db.query(query);
    return { success: true, data: rows };
  } catch (error) {
    console.error('获取患者列表失败:', error);
    return { success: false, error: '获取患者列表失败' };
  }
};

// 根据ID获取患者详情
const getPatientById = async (patientId) => {
  try {
    const patientQuery = `
      SELECT
        p.patient_id,
        COALESCE(p.name, '无姓名') AS patient_name,
        COALESCE(p.phone, '无手机号') AS phone_number,
        p.gender,
        p.date_of_birth,
        COALESCE(p.operation_type, 'N/A') AS surgery_type,
        TO_CHAR(p.operation_date, 'YYYY-MM-DD') AS operation_date,
        TO_CHAR(p.discharge_date, 'YYYY-MM-DD') AS discharge_date,
        COALESCE(d.name, '未分配') AS doctor_name,
        COALESCE(d.hospital, 'N/A') AS doctor_hospital,
        a.wechat_id
      FROM patient_profile_tab p
      LEFT JOIN doctor_profile_tab d ON p.primary_doctor_id = d.doctor_id
      LEFT JOIN account_tab a ON a.profile_id = p.patient_id
      WHERE p.patient_id = $1;
    `;
    const { rows: patientRows } = await db.query(patientQuery, [patientId]);

    if (patientRows.length === 0) {
      return { success: false, error: '患者不存在' };
    }

    const medicationQuery = `
      SELECT
        mp.plan_id,
        mp.system_suggested_dosage,
        mp.doctor_suggested_dosage,
        mp.previous_dosage,
        mp.remarks,
        mp.status,
        TO_CHAR(mp.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        hm.metric_value AS inr_value,
        TO_CHAR(hm.measured_at, 'YYYY-MM-DD') AS measurement_date
      FROM medication_plan_tab mp
      LEFT JOIN health_metrics_tab hm ON mp.metric_id = hm.metric_id
      WHERE mp.patient_id = $1
      ORDER BY mp.created_at DESC;
    `;
    const { rows: medicationRows } = await db.query(medicationQuery, [patientId]);
    
    const healthMetricsQuery = `
      SELECT 
        metric_id as id,
        metric_type,
        metric_value,
        unit,
        TO_CHAR(measured_at, 'YYYY-MM-DD HH24:MI:SS') as measured_at
      FROM health_metrics_tab
      WHERE patient_id = $1
      ORDER BY measured_at DESC;
    `;
    const { rows: healthMetricsRows } = await db.query(healthMetricsQuery, [patientId]);

    const result = {
      ...patientRows[0],
      medication_plans: medicationRows,
      health_metrics: healthMetricsRows,
    };
    
    return { success: true, data: result };
  } catch (error) {
    console.error('获取患者详情失败:', error);
    return { success: false, error: '获取患者详情失败' };
  }
};

// 获取患者当前状态
const getCurrentStatus = async (patientId) => {
  try {
    // 简化查询，直接JOIN表
    const query = `
      SELECT 
        p.patient_id,
        p.name AS patient_name,
        p.phone,
        COALESCE(mp.doctor_suggested_dosage, mp.system_suggested_dosage, 0) AS current_dosage,
        hm.metric_value AS latest_inr,
        TO_CHAR(hm.measured_at, 'YYYY-MM-DD') AS measurement_date,
        mp.status AS plan_status,
        TO_CHAR(mp.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM patient_profile_tab p
      LEFT JOIN medication_plan_tab mp ON p.patient_id = mp.patient_id 
        AND mp.status IN ('active', 'pending')
      LEFT JOIN health_metrics_tab hm ON mp.metric_id = hm.metric_id
      WHERE p.patient_id = $1
      ORDER BY mp.created_at DESC
      LIMIT 1;
    `;
    
    const { rows } = await db.query(query, [patientId]);
    
    if (rows.length === 0) {
      return { success: false, error: '患者不存在' };
    }
    
    const data = rows[0];
    
    // 格式化数据结构以匹配小程序期望
    const result = {
      patient_id: data.patient_id,
      patient_name: data.patient_name,
      phone: data.phone,
      current_dosage: data.current_dosage,
      metric: {
        value: data.latest_inr,
        measured_at: data.measurement_date
      },
      status: data.plan_status,
      updated_at: data.updated_at
    };
    
    return { success: true, data: result };
  } catch (error) {
    console.error('获取患者当前状态失败:', error);
    return { success: false, error: '获取患者当前状态失败' };
  }
};

// 获取患者基本信息
const getPatientProfile = async (patientId) => {
  try {
    const query = `
      SELECT 
        patient_id,
        name AS patient_name,
        gender,
        phone,
        operation_type,
        TO_CHAR(operation_date, 'YYYY-MM-DD') AS operation_date,
        TO_CHAR(discharge_date, 'YYYY-MM-DD') AS discharge_date
      FROM patient_profile_tab 
      WHERE patient_id = $1;
    `;
    
    const { rows } = await db.query(query, [patientId]);
    
    if (rows.length === 0) {
      return { success: false, error: '患者不存在' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('获取患者基本信息失败:', error);
    return { success: false, error: '获取患者基本信息失败' };
  }
};

// 获取最新用药计划
const getLatestActivePlans = async (patientId) => {
  try {
    const query = `
      SELECT 
        mp.plan_id,
        mp.system_suggested_dosage,
        mp.doctor_suggested_dosage,
        mp.status,
        TO_CHAR(mp.created_at, 'YYYY-MM-DD HH24:MI:SS') AS plan_created_at,
        TO_CHAR(mp.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS plan_updated_at,
        hm.metric_value,
        TO_CHAR(hm.measured_at, 'YYYY-MM-DD HH24:MI:SS') AS metric_measured_at,
        TO_CHAR(hm.created_at, 'YYYY-MM-DD HH24:MI:SS') AS metric_created_at
      FROM medication_plan_tab mp
      LEFT JOIN health_metrics_tab hm ON mp.metric_id = hm.metric_id
      WHERE mp.patient_id = $1 AND mp.status IN ('active', 'pending')
      ORDER BY mp.created_at DESC
      LIMIT 3;
    `;
    
    const { rows } = await db.query(query, [patientId]);
    return { success: true, data: rows };
  } catch (error) {
    console.error('获取最新用药计划失败:', error);
    return { success: false, error: '获取最新用药计划失败' };
  }
};

// 注册新患者
const registerPatient = async (patientData) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const patientResult = await client.query(
      `INSERT INTO patient_profile_tab 
       (name, gender, phone, operation_type, operation_date, discharge_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING patient_id`,
      [patientData.name, patientData.gender, patientData.phone, 
       patientData.operation_type, patientData.operation_date, patientData.discharge_date]
    );
    
    const patientId = patientResult.rows[0].patient_id;
    
    if (patientData.metric_value) {
      const metricResult = await client.query(
        `INSERT INTO health_metrics_tab 
         (patient_id, metric_type, metric_value, measured_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING metric_id`,
        [patientId, 'INR', patientData.metric_value]
      );
      
      const metricId = metricResult.rows[0].metric_id;
      
      await client.query(
        `INSERT INTO medication_plan_tab 
         (patient_id, metric_id, medication_name, doctor_suggested_dosage, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [patientId, metricId, '华法林', patientData.doctor_suggested_dosage, 'active']
      );
    }
    
    await client.query('COMMIT');
    return { success: true, data: { patientId } };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('注册患者失败:', error);
    return { success: false, error: '注册患者失败' };
  } finally {
    client.release();
  }
};

// 添加健康指标
const addHealthMetric = async (patientId, metricData) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const metricResult = await client.query(
      `INSERT INTO health_metrics_tab (patient_id, metric_type, metric_value, measured_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING metric_id`,
      [patientId, metricData.metric_type, metricData.metric_value]
    );
    
    const metricId = metricResult.rows[0].metric_id;
    
    // 计算系统建议剂量
    const lastDoseQuery = `
      SELECT doctor_suggested_dosage
      FROM medication_plan_tab
      WHERE patient_id = $1 AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `;
    const lastDoseResult = await client.query(lastDoseQuery, [patientId]);
    const lastConfirmedDose = lastDoseResult.rows[0]?.doctor_suggested_dosage || 1;
    
    const systemSuggestedDosage = calculateSystemDosage(parseFloat(lastConfirmedDose), parseFloat(metricData.metric_value));
    
    await client.query(
      `INSERT INTO medication_plan_tab (patient_id, metric_id, medication_name, system_suggested_dosage, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [patientId, metricId, '华法林', systemSuggestedDosage]
    );
    
    await client.query('COMMIT');
    return { success: true, message: '健康指标添加成功' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('添加健康指标失败:', error);
    return { success: false, error: '添加健康指标失败' };
  } finally {
    client.release();
  }
};

// 更新用药计划
const updateMedicationPlan = async (planId, updateData) => {
  try {
    const { status, doctor_suggested_dosage, remarks } = updateData;
    
    const result = await db.query(
      `UPDATE medication_plan_tab 
       SET status = $1, 
           doctor_suggested_dosage = $2,
           remarks = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE plan_id = $4
       RETURNING *`,
      [status, doctor_suggested_dosage, remarks, planId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: '用药计划不存在' };
    }
    
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('更新用药计划失败:', error);
    return { success: false, error: '更新用药计划失败' };
  }
};

// 计算系统建议剂量
const calculateSystemDosage = (lastConfirmedDose, newINR) => {
  let newDosage = lastConfirmedDose;
  if (newINR > 1.8) {
    newDosage -= 0.25;
  } else if (newINR < 1.5) {
    newDosage += 0.25;
  }
  return Math.max(0, newDosage);
};

// Bind account with patient profile
const bindAccountToProfile = async (accountId, patientId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // First check if patient profile exists
    const profileQuery = `
      SELECT p.patient_id, p.name
      FROM patient_profile_tab p
      WHERE p.patient_id = $1
    `;
    const { rows: profileRows } = await client.query(profileQuery, [patientId]);
    
    if (profileRows.length === 0) {
      throw new Error('患者档案不存在');
    }

    // Then check if account exists and check its binding
    const accountQuery = `
      SELECT account_type, profile_id 
      FROM account_tab 
      WHERE account_id = $1 AND account_type = 'patient'
    `;
    const { rows: accountRows } = await client.query(accountQuery, [accountId]);
    
    if (accountRows.length === 0) {
      throw new Error('账号不存在或不是患者账号');
    }

    // If account is already bound to this profile, return success
    if (accountRows[0].profile_id === patientId) {
      return {
        success: true,
        data: {
          accountId,
          patientId,
          patientName: profileRows[0].name,
          message: '已绑定成功'
        }
      };
    }

    // If account is bound to a different profile
    if (accountRows[0].profile_id) {
      throw new Error('账号已绑定其他档案');
    }

    // Check if profile is bound to any account
    const profileBindingQuery = `
      SELECT account_id 
      FROM account_tab 
      WHERE profile_id = $1
    `;
    const { rows: bindingRows } = await client.query(profileBindingQuery, [patientId]);
    
    if (bindingRows.length > 0) {
      throw new Error('患者档案已被其他账号绑定');
    }

    // Update account_tab with profile_id
    await client.query(
      'UPDATE account_tab SET profile_id = $1 WHERE account_id = $2',
      [patientId, accountId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        accountId,
        patientId,
        patientName: profileRows[0].name,
        message: '绑定成功'
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error binding account to profile:', error);
    return {
      success: false,
      error: error.message || '绑定失败'
    };
  } finally {
    client.release();
  }
};

// Generate QR code for patient profile
const generateProfileQRCode = async (patientId) => {
  try {
    // First verify that the patient profile exists and is not bound
    const client = await db.getClient();
    const checkQuery = `
      SELECT p.patient_id, p.name, EXISTS (
        SELECT 1 FROM account_tab a WHERE a.profile_id = p.patient_id
      ) as is_bound
      FROM patient_profile_tab p 
      WHERE p.patient_id = $1
    `;
    
    const { rows } = await client.query(checkQuery, [patientId]);
    
    if (rows.length === 0) {
      return {
        success: false,
        error: '患者档案不存在'
      };
    }

    if (rows[0].is_bound) {
      return {
        success: false,
        error: '患者档案已绑定账号'
      };
    }

    // Generate the data to be encoded in QR code
    const qrData = {
      patientId: rows[0].patient_id, // Use the actual UUID from the database
      name: rows[0].name,
      timestamp: Date.now()
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });

    return {
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        patientName: rows[0].name,
        patientId: rows[0].patient_id // Use the actual UUID from the database
      }
    };

  } catch (error) {
    console.error('生成二维码失败:', error);
    return {
      success: false,
      error: '生成二维码失败'
    };
  }
};

// Unbind account from patient profile
const unbindAccountFromProfile = async (accountId, patientId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check if the account and profile are actually bound to each other
    const verifyQuery = `
      SELECT a.account_id, a.profile_id
      FROM account_tab a
      WHERE a.account_id = $1 AND a.profile_id = $2
    `;
    const { rows } = await client.query(verifyQuery, [accountId, patientId]);
    
    if (rows.length === 0) {
      throw new Error('账号与患者档案未绑定');
    }

    // Update account_tab to remove profile_id
    await client.query(
      'UPDATE account_tab SET profile_id = NULL WHERE account_id = $1',
      [accountId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        accountId,
        patientId,
        message: '解绑成功'
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error unbinding account from profile:', error);
    return {
      success: false,
      error: error.message || '解绑失败'
    };
  } finally {
    client.release();
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getCurrentStatus,
  getPatientProfile,
  getLatestActivePlans,
  registerPatient,
  addHealthMetric,
  updateMedicationPlan,
  bindAccountToProfile,
  generateProfileQRCode,
  unbindAccountFromProfile
}; 