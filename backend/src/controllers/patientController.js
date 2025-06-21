const patientService = require('../services/patientService');

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

module.exports = {
    getAllPatients,
    getPatientById
}; 