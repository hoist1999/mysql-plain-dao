# Command Line Interface Guide

This document describes the command line interface for mysql-plain-dao.

## Usage

The tool can be used via CLI in three ways:

### 1. Using Command Line Arguments

```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
```

### 2. Using Environment Variables

```bash
SCHEMATS_CONN=mysql://user:pass@localhost:3306/dbname \
SCHEMATS_TABLE=users \
SCHEMATS_OUTPUT=src/models/users.ts \
npx mysql-plain-dao generate
```

### 3. Using Configuration File

```bash
npx mysql-plain-dao generate --config schemats.json
```

Example `schemats.json`:
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

## Command Line Options

| Option | Alias | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| --conn | -c | MySQL connection string | Yes | - |
| --table | -t | Table name(s) to generate interfaces for | Yes | - |
| --schema | -s | Database schema name | No | - |
| --output | -o | Output TypeScript file path | Yes | - |
| --camelCase | -C | Convert column names to camelCase | No | false |
| --noHeader | - | Skip writing file header comment | No | false |
| --config | - | Path to configuration file | No | schemats.json |

## Environment Variables

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