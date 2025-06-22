-- Drop existing tables if they exist
DROP TABLE IF EXISTS medication_plan_tab;
DROP TABLE IF EXISTS health_metrics_tab;
DROP TABLE IF EXISTS patient_profile_tab;
DROP TABLE IF EXISTS doctor_profile_tab;
DROP TABLE IF EXISTS account_tab;

-- Create custom types
DROP TYPE IF EXISTS account_type;
DROP TYPE IF EXISTS gender_type;
DROP TYPE IF EXISTS status_type;

CREATE TYPE account_type AS ENUM ('patient', 'doctor');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE status_type AS ENUM ('active', 'inactive', 'pending', 'rejected');

-- Base account table
CREATE TABLE account_tab (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type account_type NOT NULL,
    profile_id UUID UNIQUE,
    phone VARCHAR(20) UNIQUE,
    wechat_id VARCHAR(100) UNIQUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    status status_type DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor profile table
CREATE TABLE doctor_profile_tab (
    doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- account_id UUID UNIQUE REFERENCES account_tab(account_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender gender_type,
    department TEXT,
    hospital TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient profile table
CREATE TABLE patient_profile_tab (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- account_id UUID UNIQUE REFERENCES account_tab(account_id) ON DELETE CASCADE,
    primary_doctor_id UUID REFERENCES doctor_profile_tab(doctor_id),
    name TEXT NOT NULL,
    phone VARCHAR(20),
    gender gender_type,
    date_of_birth DATE,
    operation_type TEXT,
    operation_date DATE,
    discharge_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health metrics table
CREATE TABLE health_metrics_tab (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patient_profile_tab(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctor_profile_tab(doctor_id),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    unit TEXT,
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medication plan table
CREATE TABLE medication_plan_tab (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patient_profile_tab(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctor_profile_tab(doctor_id),
    metric_id UUID REFERENCES health_metrics_tab(metric_id),
    medication_name TEXT NOT NULL,
    previous_dosage NUMERIC,
    system_suggested_dosage NUMERIC,
    doctor_suggested_dosage NUMERIC,
    remarks TEXT,
    status status_type DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_account_phone ON account_tab(phone);
CREATE INDEX idx_account_wechat ON account_tab(wechat_id);
CREATE INDEX idx_patient_doctor ON patient_profile_tab(primary_doctor_id);
CREATE INDEX idx_health_patient ON health_metrics_tab(patient_id);
CREATE INDEX idx_health_doctor ON health_metrics_tab(doctor_id);
CREATE INDEX idx_health_type_date ON health_metrics_tab(metric_type, measured_at);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_account_timestamp
    BEFORE UPDATE ON account_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_doctor_profile_timestamp
    BEFORE UPDATE ON doctor_profile_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patient_profile_timestamp
    BEFORE UPDATE ON patient_profile_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medication_plan_timestamp
    BEFORE UPDATE ON medication_plan_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_health_metrics_timestamp
    BEFORE UPDATE ON health_metrics_tab
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 