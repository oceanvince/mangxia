-- This script adds a new pending medication plan for patient '张三' with INR = 2.0

-- Step 1: Find the patient_id for '张三'
WITH target_patient AS (
    SELECT patient_id FROM patient_profile_tab WHERE name = '张三' LIMIT 1
),
-- Step 2: Get the last active dose for the patient
last_active_dose AS (
    SELECT doctor_suggested_dosage as last_dose
    FROM medication_plan_tab mp
    JOIN target_patient tp ON mp.patient_id = tp.patient_id
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
),
-- Step 3: Insert a new health metric for this patient (INR = 2.0)
new_metric AS (
    INSERT INTO health_metrics_tab (patient_id, metric_type, metric_value, measured_at)
    SELECT patient_id, 'INR', 2.0, '2025-06-10' FROM target_patient
    RETURNING metric_id, patient_id
)
-- Step 4: Insert a new medication plan based on the new metric
INSERT INTO medication_plan_tab (
    patient_id, 
    metric_id, 
    medication_name, 
    previous_dosage,
    system_suggested_dosage, 
    status
)
SELECT 
    nm.patient_id, 
    nm.metric_id, 
    '华法林',
    lad.last_dose,
    CASE 
        WHEN 2.0 < 1.5 THEN lad.last_dose * 1.2
        WHEN 2.0 > 3.0 THEN lad.last_dose * 0.8
        ELSE lad.last_dose
    END,
    'pending'
FROM new_metric nm
CROSS JOIN last_active_dose lad;

SELECT 'Successfully added a new pending medication plan for 张三.'; 