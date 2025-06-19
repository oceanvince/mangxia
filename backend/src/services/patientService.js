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
                pp.*,
                hm.metric_type,
                hm.metric_value,
                hm.unit,
                hm.measured_at,
                mp.medication_name,
                mp.previous_dosage,
                mp.system_suggested_dosage,
                mp.doctor_suggested_dosage,
                mp.status as medication_status
            FROM patient_profile_tab pp
            LEFT JOIN LATERAL (
                SELECT * FROM health_metrics_tab hm
                WHERE hm.patient_id = pp.patient_id
                ORDER BY hm.measured_at DESC
                LIMIT 1
            ) hm ON true
            LEFT JOIN LATERAL (
                SELECT * FROM medication_plan_tab mp
                WHERE mp.patient_id = pp.patient_id
                ORDER BY mp.created_at DESC
                LIMIT 1
            ) mp ON true
            ORDER BY pp.created_at DESC
        `;
        
        const result = await pool.query(query);
        return {
            success: true,
            data: result.rows
        };
    } catch (error) {
        console.error('Error fetching patient profiles:', error);
        return {
            success: false,
            error: 'Failed to fetch patient profiles'
        };
    }
};

const getPatientProfileById = async (patientId) => {
    try {
        const query = `
            SELECT 
                pp.*,
                dp.name as doctor_name,
                dp.hospital as doctor_hospital,
                dp.department as doctor_department,
                json_agg(DISTINCT mp.*) as medication_plans,
                json_agg(DISTINCT hm.*) as health_metrics
            FROM patient_profile_tab pp
            LEFT JOIN doctor_profile_tab dp ON pp.primary_doctor_id = dp.doctor_id
            LEFT JOIN medication_plan_tab mp ON pp.patient_id = mp.patient_id
            LEFT JOIN health_metrics_tab hm ON pp.patient_id = hm.patient_id
            WHERE pp.patient_id = $1
            GROUP BY pp.patient_id, dp.doctor_id
        `;
        
        const result = await pool.query(query, [patientId]);
        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Patient not found'
            };
        }
        
        return {
            success: true,
            data: result.rows[0]
        };
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        return {
            success: false,
            error: 'Failed to fetch patient profile'
        };
    }
};

module.exports = {
    getAllPatientProfiles,
    getPatientProfileById
}; 