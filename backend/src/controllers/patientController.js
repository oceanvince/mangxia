const patientService = require('../services/patientService');
const { Pool } = require('pg');
const pool = new Pool();

const getAllPatients = async (req, res) => {
    try {
        const result = await patientService.getAllPatientProfiles();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Controller error fetching patients:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getPatientById = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID is required'
            });
        }

        const result = await patientService.getPatientProfileById(patientId);
        
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Controller error fetching patient:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Register a new patient with health metrics and medication plan
 * @param {Request} req 
 * @param {Response} res 
 */
const registerPatient = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        
        // 2. Create patient profile
        const patientResult = await client.query(
            `INSERT INTO patient_profile_tab 
             (name, gender, phone, operation_type, operation_date, discharge_date) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING patient_id`,
            [
                req.body.name,
                req.body.gender,
                req.body.phone,
                req.body.operation_type,
                req.body.operation_date,
                req.body.discharge_date
            ]
        );
        
        const patientId = patientResult.rows[0].patient_id;
        
        // 3. Add health metric (INR)
        const metricResult = await client.query(
            `INSERT INTO health_metrics_tab 
             (patient_id, metric_type, metric_value, measured_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING metric_id`,
            [patientId, 'INR', req.body.metric_value]
        );
        
        const metricId = metricResult.rows[0].metric_id;
        
        // 4. Create medication plan
        await client.query(
            `INSERT INTO medication_plan_tab 
             (patient_id, metric_id, doctor_suggested_dosage, status) 
             VALUES ($1, $2, $3, $4)`,
            [patientId, metricId, req.body.doctor_suggested_dosage, 'active']
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Patient registered successfully',
            patientId,
            accountId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in registerPatient:', error);
        res.status(500).json({
            message: 'Error registering patient',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllPatients,
    getPatientById,
    registerPatient
}; 