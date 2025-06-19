#!/bin/bash

# Exit on error
set -e

# Database configuration
DB_NAME="mangxia_db"
DB_USER="chupengdai"  # Using your system username

echo "Setting up database..."

# Create database and initialize schema
psql -U $DB_USER postgres -f init.sql

# Apply schema
psql -U $DB_USER -d $DB_NAME -f schema.sql

echo "Database setup completed!" 