-- Begin transaction
BEGIN;

-- First, verify that all bindings are properly represented in account_tab
DO $$
DECLARE
  inconsistent_patient_count INTEGER;
  inconsistent_doctor_count INTEGER;
BEGIN
  -- Check patient bindings
  SELECT COUNT(*)
  INTO inconsistent_patient_count
  FROM patient_profile_tab p
  LEFT JOIN account_tab a ON a.profile_id = p.patient_id
  WHERE p.account_id IS NOT NULL 
    AND (a.account_id IS NULL OR p.account_id != a.account_id);

  -- Check doctor bindings
  SELECT COUNT(*)
  INTO inconsistent_doctor_count
  FROM doctor_profile_tab d
  LEFT JOIN account_tab a ON a.profile_id = d.doctor_id
  WHERE d.account_id IS NOT NULL 
    AND (a.account_id IS NULL OR d.account_id != a.account_id);

  IF inconsistent_patient_count > 0 OR inconsistent_doctor_count > 0 THEN
    RAISE EXCEPTION 'Found % inconsistent patient bindings and % inconsistent doctor bindings. Please check data before proceeding.', 
      inconsistent_patient_count, inconsistent_doctor_count;
  END IF;
END $$;

-- Remove constraints and column from patient_profile_tab
ALTER TABLE patient_profile_tab
DROP CONSTRAINT IF EXISTS patient_profile_tab_account_id_fkey;

ALTER TABLE patient_profile_tab
DROP CONSTRAINT IF EXISTS patient_profile_tab_account_id_key;

ALTER TABLE patient_profile_tab
DROP COLUMN IF EXISTS account_id;

-- Remove constraints and column from doctor_profile_tab
ALTER TABLE doctor_profile_tab
DROP CONSTRAINT IF EXISTS doctor_profile_tab_account_id_fkey;

ALTER TABLE doctor_profile_tab
DROP CONSTRAINT IF EXISTS doctor_profile_tab_account_id_key;

ALTER TABLE doctor_profile_tab
DROP COLUMN IF EXISTS account_id;

COMMIT; 