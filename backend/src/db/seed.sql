-- This script seeds the database with initial test data.

-- Use a transaction to ensure all or nothing
BEGIN;

DO $$
DECLARE
    -- Declare variables to hold the IDs of the created entities
    v_doctor_account_id UUID;
    v_doctor_profile_id UUID;
    v_patient_account_id UUID;
    v_patient_profile_id UUID;
    v_metric_id UUID;
BEGIN
    -- 1. Create a Doctor
    -- First, create an account for the doctor
    INSERT INTO account_tab (account_type, phone, wechat_id, status)
    VALUES ('doctor', '13800138000', 'wechat_doc_wang', 'active')
    RETURNING account_id INTO v_doctor_account_id;

    -- Then, create the doctor's profile and link it to the account
    INSERT INTO doctor_profile_tab (account_id, name, gender, department, hospital)
    VALUES (v_doctor_account_id, '王建国', 'male', '心脏外科', '北京协和医院')
    RETURNING doctor_id INTO v_doctor_profile_id;

    -- 2. Create a Patient
    -- First, create an account for the patient
    INSERT INTO account_tab (account_type, phone, wechat_id, status)
    VALUES ('patient', '18812345678', 'wechat_patient_zhang', 'active')
    RETURNING account_id INTO v_patient_account_id;

    -- Then, create the patient's profile, linking it to their account and the doctor
    INSERT INTO patient_profile_tab (account_id, primary_doctor_id, name, gender, date_of_birth, operation_type, operation_date, discharge_date)
    VALUES (v_patient_account_id, v_doctor_profile_id, '张三', 'male', '1965-01-10', '机械瓣膜置换', '2025-01-05', '2025-01-25')
    RETURNING patient_id INTO v_patient_profile_id;

    -- 3. Add Health Metrics for the Patient (e.g., INR value)
    INSERT INTO health_metrics_tab (patient_id, doctor_id, metric_type, metric_value, unit, measured_at, notes)
    VALUES (v_patient_profile_id, v_doctor_profile_id, 'INR', 1.8, 'ratio', '2025-04-10 09:00:00+08', '最近一次的INR检测值')
    RETURNING metric_id INTO v_metric_id;

    -- 4. Add a Medication Plan for the Patient
    INSERT INTO medication_plan_tab (patient_id, doctor_id, metric_id, medication_name, previous_dosage, system_suggested_dosage, doctor_suggested_dosage, remarks, status)
    VALUES (v_patient_profile_id, v_doctor_profile_id, v_metric_id, '华法林', 2.0, 2.25, NULL, '根据最新INR值，系统建议调整剂量', 'pending');

    RAISE NOTICE 'Seed data inserted successfully for Dr. 王建国 and Patient 张三';

END $$;

COMMIT; 