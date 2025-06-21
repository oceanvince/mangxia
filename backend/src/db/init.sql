-- Connect to default database first
\c postgres;

-- Drop database if exists
DROP DATABASE IF EXISTS mangxia_db;

-- Create database
CREATE DATABASE mangxia_db;

-- Connect to the database
\c mangxia_db;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 