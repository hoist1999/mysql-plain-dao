# mysql-plain-dao

A TypeScript-first tool for generating data model objects from existing MySQL databases. It also provides a library of utilities to simplify database access operations.


## Inspired by

This project was inspired by [schemats](https://github.com/SweetIQ/schemats). Some code has been adapted and modified from their implementation to better suit our needs.


## Features

- Generate TypeScript interfaces from MySQL database tables
- Maintain type safety between your database and application code
- Automatic type definition updates when database schema changes
- Built-in DAO (Data Access Object) utilities for CRUD operations

## Installation

```bash
pnpm add mysql-plain-dao
```

## Usage

### Command Line Interface

The tool can be used via CLI in three ways:

1. Using command line arguments:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
```

2. Using environment variables:
```bash
SCHEMATS_CONN=mysql://user:pass@localhost:3306/dbname \
SCHEMATS_TABLE=users \
SCHEMATS_OUTPUT=src/models/users.ts \
npx mysql-plain-dao generate
```

3. Using a configuration file (schemats.json):
```bash
npx mysql-plain-dao generate --config schemats.json
```

### Command Line Options

| Option | Alias | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| --conn | -c | MySQL connection string | Yes | - |
| --table | -t | Table name(s) to generate interfaces for | Yes | - |
| --schema | -s | Database schema name | No | - |
| --output | -o | Output TypeScript file path | Yes | - |
| --camelCase | -C | Convert column names to camelCase | No | false |
| --noHeader | - | Skip writing file header comment | No | false |
| --config | - | Path to configuration file | No | schemats.json |

### Configuration File

You can provide configuration via `schemats.json`:

```json
{
  "conn": "mysql://user:pass@localhost:3306/dbname",
  "table": ["users", "products"],
  "output": "src/models/index.ts",
  "camelCase": true,
  "schema": "public",
  "noHeader": false
}
```

### Environment Variables

All options can be set using environment variables with the `SCHEMATS_` prefix:

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| SCHEMATS_CONN | Database connection string | - |
| SCHEMATS_TABLE | Table name(s) to generate interfaces for | - |
| SCHEMATS_SCHEMA | Database schema name | - |
| SCHEMATS_OUTPUT | Output TypeScript file path | - |
| SCHEMATS_CAMEL_CASE | Convert column names to camelCase | false |
| SCHEMATS_NO_HEADER | Skip writing file header comment | false |
| SCHEMATS_CONFIG | Path to configuration file | schemats.json |

## Examples

1. Generate interface for a single table:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
```

2. Generate interfaces for multiple tables:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/index.ts
```

3. Generate interfaces with camelCase column names:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -C -o src/models/users.ts
```

4. Generate interfaces with camelCase for all tables:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -C -o src/models/index.ts
```

## Testing

To test the BaseDAO functionality, please refer to `role.test.ts` which includes examples of CRUD operations.


## Running Tests

There are two ways to run the tests:

### 1. Local Testing (test-local.sh)

Run tests in your local environment. This requires:
- MySQL/MariaDB installed locally
- Node.js and pnpm installed
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



## License

MIT