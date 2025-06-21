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
        // 这条SQL语句会连接相关的表，获取前端需要的所有信息
        // 使用 COALESCE 提供默认值，使用 TO_CHAR 统一日期格式
        const query = `
            SELECT
                p.patient_id,
                COALESCE(p.name, '无姓名') AS patient_name,
                COALESCE(a.phone, '无手机号') AS phone_number,
                p.gender,
                p.date_of_birth,
                COALESCE(p.operation_type, 'N/A') AS surgery_type,
                TO_CHAR(p.operation_date, 'YYYY-MM-DD') AS operation_date,
                TO_CHAR(p.discharge_date, 'YYYY-MM-DD') AS discharge_date
            FROM
                patient_profile_tab p
            LEFT JOIN
                account_tab a ON p.account_id = a.account_id
            ORDER BY
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
                COALESCE(a.phone, '无手机号') AS phone_number,
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
                account_tab a ON p.account_id = a.account_id
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
                plan_id AS id,
                previous_dosage AS dose,
                system_suggested_dosage AS "sysDose",
                doctor_suggested_dosage AS "doctorDose",
                remarks AS note,
                status AS "confirmStatus",
                TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS "testDate"
            FROM
                medication_plan_tab
            WHERE
                patient_id = $1
            ORDER BY
                created_at DESC;
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

module.exports = {
    getAllPatientProfiles,
    getPatientProfileById
}; 