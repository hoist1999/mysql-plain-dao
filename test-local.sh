#!/bin/bash
# Run test in local environment

# Load environment variables from .env.test-local
if [ -f .env.test-local ]; then
    export $(cat .env.test-local | grep -v '^#' | xargs)
else
    echo "❌ .env.test-local file not found"
    exit 1
fi

# Default values if not set in .env.test-local
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-test}

# Function to execute MySQL commands
execute_mysql_command() {
    local command=$1
    mysql \
    -h"$DB_HOST" \
    -P"$DB_PORT" \
    -u"$DB_USER" \
    ${DB_PASSWORD:+-p"$DB_PASSWORD"} \
    -e "$command" 2>/dev/null
}

# Function to import schema
import_schema() {
    if [ -f "src/__tests__/sql/schema.sql" ]; then
        echo "🔨 Initializing database schema..."
        mysql \
        -h"$DB_HOST" \
        -P"$DB_PORT" \
        -u"$DB_USER" \
        ${DB_PASSWORD:+-p"$DB_PASSWORD"} \
        "$DB_DATABASE" < "src/__tests__/sql/schema.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Schema initialized successfully"
            return 0
        else
            echo "❌ Failed to initialize schema"
            return 1
        fi
    fi
}

# Print current config
echo "📝 Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  Database: $DB_DATABASE"

# Check if mysql client is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client is not installed"
    exit 1
fi

# Drop database if exists and create fresh one
echo "🗑️  Dropping database if exists..."
execute_mysql_command "DROP DATABASE IF EXISTS \`$DB_DATABASE\`;"

echo "🔨 Creating fresh database..."
execute_mysql_command "CREATE DATABASE \`$DB_DATABASE\`;"
if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
    import_schema || exit 1
else
    echo "❌ Failed to create database"
    exit 1
fi

echo "✨ Database setup complete"

# Run tests
# Determine which package manager to use
if command -v pnpm &> /dev/null; then
    echo "📦 Using pnpm"
    pnpm test
elif command -v npm &> /dev/null; then
    echo "📦 Using npm"
    npm test
else
    echo "❌ Neither pnpm nor npm is installed"
    exit 1
fi