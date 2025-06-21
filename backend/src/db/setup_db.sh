#!/bin/bash

# Exit on error
set -e

# Get the directory of the script
SCRIPT_DIR=$(dirname "$0")

# Database configuration
DB_NAME="mangxia_db"
DB_USER="chupengdai"  # Using your system username

echo "Setting up database..."

# Create database and initialize schema
psql -U $DB_USER postgres -f "$SCRIPT_DIR/init.sql"

# Apply schema
psql -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/schema.sql"

echo "Database setup completed!" 