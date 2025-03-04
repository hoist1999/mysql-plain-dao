# Testing Guide

This document describes how to run tests for mysql-plain-dao.

## Unit Tests

To test the BaseDao functionality, please refer to `UserDao.test.ts` which includes examples of CRUD operations.

## Running Tests

There are two ways to run the tests:

### 1. Local Testing (test-local.sh)

Run tests in your local environment. This requires:
- MySQL/MariaDB installed locally
- Node.js and npm or pnpm installed
- `.env.test-local` file configured with your database settings

```bash
# Make the script executable
chmod +x test-local.sh

# Run tests locally
./test-local.sh
```

The script will:
1. Load environment variables from `.env.test-local`
2. Check and create test database if needed
3. Initialize database schema
4. Run the test suite

### 2. Docker Testing (test-in-docker.sh)

Run tests in Docker containers. This requires:
- Docker and Docker Compose installed
- No local database needed

```bash
# Make the script executable
chmod +x test-in-docker.sh

# Run tests in Docker
./test-in-docker.sh
```

The script will:
1. Pull required Docker images
2. Build test container
3. Start MariaDB and test containers
4. Run the test suite
5. Save test logs to `docker-logs/`
6. Clean up containers and volumes

Test logs will be available in:
- `docker-logs/files.log`: List of files in the test container
- `docker-logs/jest-output.log`: Test execution output

Both methods will run the same test suite, just in different environments. Choose the one that best fits your needs:
- Use `test-local.sh` for development and debugging
- Use `test-in-docker.sh` for CI/CD and reproducible testing

## Debugging

The library uses the [debug](https://www.npmjs.com/package/debug) package for logging. To enable debug logs, set the `DEBUG` environment variable:

```bash
# Enable all database operation logs
DEBUG=DAO npm test

# On Windows CMD
set DEBUG=DAO && npm test

# On Windows PowerShell
$env:DEBUG='DAO'; npm test
```

Debug logs will show:
- SQL queries being executed
- Query parameters
- Pool configuration
- Query results
- Error details

Example debug output:
```
DAO === Executing SQL Query: Execute Method ===
DAO sql: INSERT INTO user (uuid, username, email) VALUES (?, ?, ?)
DAO paras: ['123e4567-e89b-12d3-a456-426614174000', 'testuser', 'test@example.com']
DAO Pool configuration: {
  host: 'localhost',
  port: 3306,
  user: 'root',
  database: 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}
```

You can combine with other debug namespaces:
```bash
# Enable multiple debug namespaces
DEBUG=DAO,express:* npm test

# Enable all debug logs
DEBUG=* npm test
``` 