-- This script adds a new pending medication plan for the most recently created patient.

-- First insert a new health metric
WITH new_metric AS (
  INSERT INTO health_metrics_tab 
    (patient_id, metric_type, metric_value, measured_at)
  VALUES 
    ('9777999e-af6a-4e96-b0f1-7ad50d288891', 'INR', 7.0, CURRENT_TIMESTAMP)
  RETURNING metric_id
)
-- Then insert the medication plan
INSERT INTO medication_plan_tab 
  (patient_id, metric_id, medication_name, previous_dosage, system_suggested_dosage, status)
SELECT 
  '9777999e-af6a-4e96-b0f1-7ad50d288891',
  metric_id,
  '华法林',
  7.0,
  79.0,
  'pending'
FROM new_metric;

SELECT 'Successfully added a new pending medication plan for the latest patient.'; 