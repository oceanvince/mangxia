-- This script adds a new pending medication plan for the most recently created patient.

-- First insert a new health metric
WITH new_metric AS (
  INSERT INTO health_metrics_tab 
    (patient_id, metric_type, metric_value, measured_at)
  VALUES 
    ('3c9c19a8-3f08-44d9-8edc-48664732108c', 'INR', 1.0, CURRENT_TIMESTAMP)
  RETURNING metric_id
)
-- Then insert the medication plan
INSERT INTO medication_plan_tab 
  (patient_id, metric_id, medication_name, previous_dosage, system_suggested_dosage, status)
SELECT 
  '3c9c19a8-3f08-44d9-8edc-48664732108c',
  metric_id,
  '华法林',
  15,
  13,
  'pending'
FROM new_metric;

SELECT 'Successfully added a new pending medication plan for the latest patient.'; 