#!/bin/bash

# Load environment variables from .env.test-local
source .env.test-local

rm -rf ./test-output

# Set environment variables for mysql-plain-dao
export DAO_CONN="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
export DAO_OUTPUT="./test-output"
export DAO_GENERATE="all"

# Execute the generate command using environment variables
echo "01 Test generate model and dao files using environment variables"
pnpm start

# Define array of files to check
files=(
    "./test-output/News.ts"
    "./test-output/NewsDao.ts"
    "./test-output/User.ts"
    "./test-output/UserDao.ts"
    "./test-output/UserPermission.ts"
    "./test-output/UserPermissionDao.ts"
    "./test-output/Book.ts"
    "./test-output/BookDao.ts"
)

# Check if all files exist
all_files_exist=true
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        all_files_exist=false
    fi
done

# Clean up environment variables
unset DAO_CONN
unset DAO_OUTPUT
unset DAO_GENERATE

if [ "$all_files_exist" = true ]; then
    echo "✅ Test OK: All generated files found"
    exit 0
else
    echo "❌ Test Failed: Some files are missing"
    exit 1
fi

