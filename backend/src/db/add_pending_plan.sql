-- This script adds a new pending medication plan for the most recently created patient.

-- Step 1: Find the most recent patient_id
WITH recent_patient AS (
    SELECT patient_id FROM patient_profile_tab ORDER BY created_at DESC LIMIT 1
),
-- Step 2: Insert a new health metric for this patient (INR = 2)
new_metric AS (
    INSERT INTO health_metrics_tab (patient_id, metric_type, metric_value, measured_at)
    SELECT patient_id, 'INR', 2, CURRENT_TIMESTAMP FROM recent_patient
    RETURNING metric_id, patient_id
)
-- Step 3: Insert a new medication plan based on the new metric
INSERT INTO medication_plan_tab (patient_id, metric_id, medication_name, system_suggested_dosage, status)
SELECT patient_id, metric_id, '华法林', 3.5, 'pending' FROM new_metric;

SELECT 'Successfully added a new pending medication plan for the latest patient.'; 