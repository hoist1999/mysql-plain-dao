#!/bin/bash

# Test generate model and dao files in different directories

# Load environment variables from .env.test-local
source .env.test-local

rm -rf ./test-output/*

# Construct connection string from environment variables
CONNECTION_STRING="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"

# Execute the generate command
echo "01 Test generate model and dao files"
pnpm start -c "$CONNECTION_STRING" --model-dir ./test-output/model --dao-dir ./test-output/dao

# Define array of files to check
files=(
    "./test-output/model/News.ts"
    "./test-output/dao/NewsDao.ts"
    "./test-output/model/User.ts"
    "./test-output/dao/UserDao.ts"
    "./test-output/model/UserPermission.ts"
    "./test-output/dao/UserPermissionDao.ts"
    "./test-output/model/Book.ts"
    "./test-output/dao/BookDao.ts"
)

# Check if all files exist
all_files_exist=true
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo "✅ Test OK: All generated files found"
    exit 0
else
    echo "❌ Test Failed: Some files are missing"
    exit 1
fi



