-- Healthcare Chat Assistant Database Schema
-- MySQL Database

-- Create Database (if not exists)
CREATE DATABASE IF NOT EXISTS healthcare_db;
USE healthcare_db;

-- ============================================
-- Table: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT chk_role_name CHECK (name IN ('ROLE_PATIENT', 'ROLE_DOCTOR', 'ROLE_ADMIN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles
INSERT INTO roles (name) VALUES ('ROLE_PATIENT'), ('ROLE_DOCTOR'), ('ROLE_ADMIN')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: user_roles (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: health_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS health_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    age INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    blood_type VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    current_medications TEXT,
    emergency_contact VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: chat_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_emergency BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chat_session_id BIGINT NOT NULL,
    role ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    content TEXT NOT NULL,
    structured_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_chat_session (chat_session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: medical_reports
-- ============================================
CREATE TABLE IF NOT EXISTS medical_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    extracted_text LONGTEXT,
    ai_explanation LONGTEXT,
    report_date TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: appointments
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT,
    appointment_date TIMESTAMP NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    notes TEXT,
    soap_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_appointment_date (appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Insert Sample Data (for testing)
-- ============================================

-- Sample Users (passwords are BCrypt hashed 'password123')
INSERT INTO users (username, email, password, full_name, phone_number, is_active) VALUES
('patient', 'patient@healthcare.com', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'John Patient', '555-0001', TRUE),
('doctor', 'doctor@healthcare.com', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'Dr. Sarah Smith', '555-0002', TRUE),
('admin', 'admin@healthcare.com', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'Admin User', '555-0003', TRUE)
ON DUPLICATE KEY UPDATE username=username;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'patient' AND r.name = 'ROLE_PATIENT'
ON DUPLICATE KEY UPDATE user_id=user_id;

INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'doctor' AND r.name = 'ROLE_DOCTOR'
ON DUPLICATE KEY UPDATE user_id=user_id;

INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Sample health profile for patient
INSERT INTO health_profiles (user_id, age, weight, height, blood_type, allergies, chronic_conditions)
SELECT id, 30, 70.5, 175.0, 'O+', 'Penicillin', 'None'
FROM users WHERE username = 'patient'
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Sample chat session
INSERT INTO chat_sessions (user_id, title, is_emergency, is_active, last_message_at)
SELECT id, 'Welcome Conversation', FALSE, TRUE, NOW()
FROM users WHERE username = 'patient'
ON DUPLICATE KEY UPDATE user_id=user_id;

-- ============================================
-- Views for Analytics
-- ============================================

-- View: User statistics
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
    SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_users
FROM users;

-- View: Chat statistics
CREATE OR REPLACE VIEW v_chat_stats AS
SELECT 
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(m.id) as total_messages,
    COUNT(DISTINCT cs.user_id) as unique_users,
    SUM(CASE WHEN cs.is_emergency = TRUE THEN 1 ELSE 0 END) as emergency_sessions
FROM chat_sessions cs
LEFT JOIN messages m ON cs.id = m.chat_session_id;

-- View: Appointment statistics
CREATE OR REPLACE VIEW v_appointment_stats AS
SELECT 
    COUNT(*) as total_appointments,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
FROM appointments;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Additional indexes for performance optimization
CREATE INDEX idx_message_role ON messages(role);
CREATE INDEX idx_session_active ON chat_sessions(is_active, user_id);
CREATE INDEX idx_appointment_status ON appointments(status);
CREATE INDEX idx_user_active ON users(is_active);

-- ============================================
-- Database Setup Complete
-- ============================================

COMMIT;
