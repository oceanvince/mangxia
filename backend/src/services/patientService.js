const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'chupengdai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mangxia_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});



// For admin page to get the list of patients 病人列表页
const getAllPatientProfiles = async () => {
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
            FROM
                patient_profile_tab p
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
                    FROM
                        medication_plan_tab mp
                    LEFT JOIN
                        health_metrics_tab hm ON mp.metric_id = hm.metric_id
                    WHERE
                        mp.status IN ('pending', 'active')
                )
                SELECT * FROM ranked_plans WHERE rn = 1
            ) AS lp ON p.patient_id = lp.patient_id
            ORDER BY
                (lp.status = 'pending') DESC,
                lp.measured_at DESC NULLS LAST,
                p.created_at DESC;
        `;
        const { rows } = await pool.query(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching patient profiles:', error);
        return { success: false, error: 'Database error' };
    }
};

// For admin page to get the details of a patient 病人详情页
const getPatientProfileById = async (patientId) => {
    try {
        // 主查询，获取患者基本信息
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
                COALESCE(d.hospital, 'N/A') AS doctor_hospital
            FROM
                patient_profile_tab p
            LEFT JOIN
                doctor_profile_tab d ON p.primary_doctor_id = d.doctor_id
            WHERE
                p.patient_id = $1;
        `;
        const { rows: patientRows } = await pool.query(patientQuery, [patientId]);

        if (patientRows.length === 0) {
            return { success: false, error: 'Patient not found' };
        }

        const patientProfile = patientRows[0];

        // 子查询，获取该患者的用药记录
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
            FROM
                medication_plan_tab mp
            LEFT JOIN
                health_metrics_tab hm ON mp.metric_id = hm.metric_id
            WHERE
                mp.patient_id = $1
            ORDER BY
                mp.created_at DESC;
        `;
        const { rows: medicationRows } = await pool.query(medicationQuery, [patientId]);
        
        // 子查询，获取健康指标（例如INR）
        const healthMetricsQuery = `
             SELECT 
                metric_id as id,
                metric_type,
                metric_value,
                unit,
                TO_CHAR(measured_at, 'YYYY-MM-DD HH24:MI:SS') as measured_at
             FROM 
                health_metrics_tab
             WHERE 
                patient_id = $1
             ORDER BY
                measured_at DESC;
        `;
        const { rows: healthMetricsRows } = await pool.query(healthMetricsQuery, [patientId]);


        // 组合最终返回的数据
        const result = {
            ...patientProfile,
            medication_plans: medicationRows,
            health_metrics: healthMetricsRows,
        };
        
        return { success: true, data: result };
    } catch (error) {
        console.error(`Error fetching patient profile by id ${patientId}:`, error);
        return { success: false, error: 'Database error' };
    }
};

const calculateSystemDosage = (lastConfirmedDose, newINR) => {
    let newDosage = lastConfirmedDose;
    if (newINR > 1.8) {
        newDosage -= 0.25;
    } else if (newINR < 1.5) {
        newDosage += 0.25;
    }
    // Ensure dosage does not go below a certain threshold, e.g., 0.
    return Math.max(0, newDosage);
};

// for admin page to register a new patient 新增病人
const registerPatient = async (patientData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Create patient profile
        const patientResult = await client.query(
            `INSERT INTO patient_profile_tab 
             (name, gender, phone, operation_type, operation_date, discharge_date) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING patient_id`,
            [patientData.name, patientData.gender, patientData.phone, 
             patientData.operation_type, patientData.operation_date, patientData.discharge_date]
        );
        
        const patientId = patientResult.rows[0].patient_id;
        
        // Add health metric (INR)
        const metricResult = await client.query(
            `INSERT INTO health_metrics_tab 
             (patient_id, metric_type, metric_value, measured_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING metric_id`,
            [patientId, 'INR', patientData.metric_value]
        );
        
        const metricId = metricResult.rows[0].metric_id;
        
        // Create medication plan
        await client.query(
            `INSERT INTO medication_plan_tab 
             (patient_id, metric_id, medication_name, doctor_suggested_dosage, status) 
             VALUES ($1, $2, $3, $4, $5)`,
            [patientId, metricId, '华法林', patientData.doctor_suggested_dosage, 'active']
        );
        
        await client.query('COMMIT');
        
        return {
            success: true,
            data: {
                patient_id: patientId,
                patient_name: patientData.name,
                gender: patientData.gender,
                phone_number: patientData.phone,
                operation_type: patientData.operation_type,
                operation_date: patientData.operation_date,
                discharge_date: patientData.discharge_date,
                metric_value: patientData.metric_value,
                doctor_suggested_dosage: patientData.doctor_suggested_dosage,
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in registerPatient:', error);
        return {
            success: false,
            error: 'Failed to register patient'
        };
    } finally {
        client.release();
    }
};

// for admin page to update the status of a medication plan 更新用药计划状态，确认、拒绝
const updateMedicationPlanStatus = async (planId, status, doctor_suggested_dosage) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `UPDATE medication_plan_tab 
             SET status = $1, 
                 doctor_suggested_dosage = COALESCE($2, doctor_suggested_dosage),
                 updated_at = CURRENT_TIMESTAMP
             WHERE plan_id = $3
             RETURNING *`,
            [status, doctor_suggested_dosage, planId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: 'Medication plan not found'
            };
        }

        await client.query('COMMIT');
        
        return {
            success: true,
            data: result.rows[0]
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in updateMedicationPlanStatus:', error);
        return {
            success: false,
            error: 'Failed to update medication plan status'
        };
    } finally {
        client.release();
    }
};

// for mini app to get the current status of a patient 小程序主页上获取病人当前用药状态
const getPatientCurrentStatus = async (patientId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `WITH latest_active_plan AS (
                SELECT 
                    mp.plan_id,
                    mp.doctor_suggested_dosage as current_dosage,
                    mp.metric_id,
                    mp.updated_at as plan_updated_at,
                    ROW_NUMBER() OVER (ORDER BY mp.updated_at DESC) as rn
                FROM medication_plan_tab mp
                WHERE mp.patient_id = $1 
                AND (mp.status = 'active' OR mp.status = 'pending')
            )
            SELECT 
                pp.name as patient_name,
                lap.current_dosage,
                hm.metric_value,
                hm.measured_at,
                hm.created_at as metric_created_at,
                lap.plan_updated_at,
                lap.status
            FROM latest_active_plan lap
            JOIN patient_profile_tab pp ON pp.patient_id = $1
            JOIN health_metrics_tab hm ON hm.metric_id = lap.metric_id
            WHERE lap.rn = 1`,
            [patientId]
        );

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'No active medication plan found for this patient'
            };
        }

        return {
            success: true,
            data: {
                patient_name: result.rows[0].patient_name,
                current_dosage: result.rows[0].current_dosage,
                metric: {
                    value: result.rows[0].metric_value,
                    measured_at: result.rows[0].measured_at,
                    created_at: result.rows[0].metric_created_at
                },
                plan_updated_at: result.rows[0].plan_updated_at
            }
        };
    } catch (error) {
        console.error('Error in getPatientCurrentStatus:', error);
        return {
            success: false,
            error: 'Failed to fetch patient current status'
        };
    } finally {
        client.release();
    }
};

// For mini app tp get latest 3 active medication plans for a patient. 小程序历史记录上获取病人最新3条用药计划
const getLatestActivePlans = async (patientId) => {
    try {
        const query = `
            SELECT
                mp.plan_id,
                TO_CHAR(mp.updated_at, 'YYYY-MM-DD HH24:MI:SS') as plan_updated_at,
                TO_CHAR(mp.created_at, 'YYYY-MM-DD HH24:MI:SS') as plan_created_at,
                mp.doctor_suggested_dosage,
                hm.metric_value,
                TO_CHAR(hm.measured_at, 'YYYY-MM-DD HH24:MI:SS') as metric_measured_at,
                TO_CHAR(hm.created_at, 'YYYY-MM-DD HH24:MI:SS') as metric_created_at
            FROM
                medication_plan_tab mp
            LEFT JOIN
                health_metrics_tab hm ON mp.metric_id = hm.metric_id
            WHERE
                mp.patient_id = $1
                AND mp.status = 'active'
            ORDER BY
                mp.updated_at DESC
            LIMIT 3;
        `;
        
        const { rows } = await pool.query(query, [patientId]);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching latest active medication plans:', error);
        return { success: false, error: 'Database error' };
    }
};

// For mini app to get patient basic profile information. 小程序获取病人“我的”信息
const getPatientBasicProfile = async (patientId) => {
    try {
        const query = `
            SELECT
                COALESCE(p.name, '无姓名') AS patient_name,
                p.gender,
                COALESCE(p.operation_type, 'N/A') AS operation_type,
                TO_CHAR(p.operation_date, 'YYYY-MM-DD') AS operation_date,
                COALESCE(d.name, '未分配') AS doctor_name
            FROM
                patient_profile_tab p
            LEFT JOIN
                doctor_profile_tab d ON p.primary_doctor_id = d.doctor_id
            WHERE
                p.patient_id = $1;
        `;
        
        const { rows } = await pool.query(query, [patientId]);
        
        if (rows.length === 0) {
            return { success: false, error: 'Patient not found' };
        }

        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('Error fetching patient basic profile:', error);
        return { success: false, error: 'Database error' };
    }
};

module.exports = {
    getAllPatientProfiles,
    getPatientProfileById,
    calculateSystemDosage,
    registerPatient,
    updateMedicationPlanStatus,
    getPatientCurrentStatus,
    getLatestActivePlans,
    getPatientBasicProfile
}; 