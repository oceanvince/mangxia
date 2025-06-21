-- This script adds a new pending medication plan for the patient '王老五'.

-- Step 1: Find the patient_id for '王老五'
WITH target_patient AS (
    SELECT patient_id FROM patient_profile_tab WHERE name = '王老五' LIMIT 1
),
-- Step 2: Insert a new health metric for this patient (INR = 1.9)
new_metric AS (
    INSERT INTO health_metrics_tab (patient_id, metric_type, metric_value, measured_at)
    SELECT patient_id, 'INR', 1.9, '2025-06-21' FROM target_patient
    RETURNING metric_id, patient_id
)
-- Step 3: Insert a new medication plan based on the new metric
INSERT INTO medication_plan_tab (patient_id, metric_id, medication_name, system_suggested_dosage, status)
SELECT patient_id, metric_id, '华法林', 4.0, 'pending' FROM new_metric; -- Assuming system suggests 4.0mg for an INR of 1.9

SELECT 'Successfully added a new pending medication plan for 王老五.'; 