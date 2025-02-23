#!/bin/bash

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

# Print current config
echo "📝 Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_DATABASE"

# Check if mysql client is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client is not installed"
    exit 1
fi

# Check if database exists
echo "🔍 Checking if database exists..."
DB_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "SHOW DATABASES LIKE '$DB_DATABASE';" 2>/dev/null | grep "$DB_DATABASE" > /dev/null; echo "$?")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo "✅ Database '$DB_DATABASE' already exists"
else
    echo "🔨 Creating database '$DB_DATABASE'..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "CREATE DATABASE \`$DB_DATABASE\`;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

# Initialize schema if sql file exists
if [ -f "src/__tests__/sql/schema.sql" ]; then
    echo "🔨 Initializing database schema..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_DATABASE" < "src/__tests__/sql/schema.sql"
    if [ $? -eq 0 ]; then
        echo "✅ Schema initialized successfully"
    else
        echo "❌ Failed to initialize schema"
        exit 1
    fi
fi

echo "✨ Database setup complete" 