-- PostgreSQL initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (already handled by POSTGRES_DB)
-- CREATE DATABASE IF NOT EXISTS inference_instances;

-- Set timezone
SET timezone = 'UTC';

-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions (if using custom user)
-- GRANT ALL PRIVILEGES ON DATABASE inference_instances TO postgres;

-- Log initialization
SELECT 'PostgreSQL database initialized for inference instances' AS message;