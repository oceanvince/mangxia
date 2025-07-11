const patientService = require('../services/patientService');
const { pool } = require('../db');

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
    const {
        name,
        gender,
        phone,
        operation_type,
        operation_date,
        discharge_date,
        metric_value,
        doctor_suggested_dosage,
        remarks,
        measurement_time,
    } = req.body;

    // Validate input
    if (!name || !gender || !phone || !operation_type || !operation_date || !discharge_date || !metric_value || !doctor_suggested_dosage) {
        return res.status(400).json({
            message: 'Missing required fields'
        });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        
        // 2. Create patient profile
        const patientResult = await client.query(
            `INSERT INTO patient_profile_tab 
             (name, gender, phone, operation_type, operation_date, discharge_date) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING patient_id`,
            [
                name,
                gender,
                phone,
                operation_type,
                operation_date,
                discharge_date
            ]
        );
        
        const patientId = patientResult.rows[0].patient_id;
        
        // 3. Add health metric (INR)
        const metricResult = await client.query(
            `INSERT INTO health_metrics_tab 
             (patient_id, metric_type, metric_value, measured_at) 
             VALUES ($1, $2, $3, $4) RETURNING metric_id`,
            [patientId, 'INR', metric_value, measurement_time || new Date()]
        );
        
        const metricId = metricResult.rows[0].metric_id;
        
        // 4. Create medication plan
        await client.query(
            `INSERT INTO medication_plan_tab 
             (patient_id, metric_id, medication_name, doctor_suggested_dosage, status, remarks) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [patientId, metricId, '华法林', doctor_suggested_dosage, 'active', remarks]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Patient registered successfully',
            patientId,
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

/**
 * Update medication plan status and doctor suggested dosage
 * @param {Request} req 
 * @param {Response} res 
 */
const updateMedicationPlan = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { planId } = req.params;
        const { status, doctor_suggested_dosage, remarks } = req.body;
        
        // Validate status
        if (!['active', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be either "active" or "rejected"'
            });
        }

        await client.query('BEGIN');

        // Get current plan details
        const currentPlan = await client.query(
            `SELECT system_suggested_dosage, doctor_suggested_dosage 
             FROM medication_plan_tab 
             WHERE plan_id = $1`,
            [planId]
        );

        if (currentPlan.rows.length === 0) {
            return res.status(404).json({
                message: 'Medication plan not found'
            });
        }

        // If no doctor dosage provided and status is active, use system suggested dosage
        const finalDoctorDosage = status === 'active' 
            ? (doctor_suggested_dosage || currentPlan.rows[0].system_suggested_dosage)
            : currentPlan.rows[0].doctor_suggested_dosage;

        // Update the plan
        const result = await client.query(
            `UPDATE medication_plan_tab 
             SET status = $1, 
                 doctor_suggested_dosage = $2,
                 remarks = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE plan_id = $4
             RETURNING *`,
            [status, finalDoctorDosage, remarks, planId]
        );

        await client.query('COMMIT');

        res.json({
            message: `Medication plan ${status === 'active' ? 'confirmed' : 'rejected'} successfully`,
            plan: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in updateMedicationPlan:', error);
        res.status(500).json({
            message: 'Error updating medication plan',
            error: error.message
        });
    } finally {
        client.release();
    }
};

const addHealthMetricAndPlan = async (req, res) => {
    const { patientId } = req.params;
    const { metric_type, metric_value } = req.body; // e.g., 'INR', 1.9

    if (!metric_type || !metric_value) {
        return res.status(400).json({ message: 'Missing metric_type or metric_value' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get the last confirmed dose for the patient
        const lastActiveDoseQuery = `
            SELECT doctor_suggested_dosage
            FROM medication_plan_tab
            WHERE patient_id = $1 AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        `;
        const lastActiveDoseResult = await client.query(lastActiveDoseQuery, [patientId]);
        
        // This could be null if the patient is new and has no active plan yet.
        // We need a fallback. Let's assume initial dose is stored somewhere or use a default.
        // For now, let's say the initial dose is retrieved from patient_profile_tab
        // or we use a default of 1 if not found.
        const lastConfirmedDose = lastActiveDoseResult.rows[0]?.doctor_suggested_dosage || 1; 

        // 2. Calculate the new system suggested dosage
        const system_suggested_dosage = patientService.calculateSystemDosage(parseFloat(lastConfirmedDose), parseFloat(metric_value));

        // 3. Add the new health metric
        const metricResult = await client.query(
            `INSERT INTO health_metrics_tab (patient_id, metric_type, metric_value, measured_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING metric_id`,
            [patientId, metric_type, metric_value]
        );
        const metricId = metricResult.rows[0].metric_id;

        // 4. Create a new medication plan with the suggestion
        await client.query(
            `INSERT INTO medication_plan_tab (patient_id, metric_id, medication_name, system_suggested_dosage, status)
             VALUES ($1, $2, $3, $4, 'pending')`,
            [patientId, metricId, '华法林', system_suggested_dosage]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Health metric and new plan added successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding health metric and plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllPatients,
    getPatientById,
    registerPatient,
    updateMedicationPlan,
    addHealthMetricAndPlan,
}; 