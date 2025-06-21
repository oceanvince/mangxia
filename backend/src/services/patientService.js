const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'chupengdai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mangxia_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

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

module.exports = {
    getAllPatientProfiles,
    getPatientProfileById,
    calculateSystemDosage,
}; 