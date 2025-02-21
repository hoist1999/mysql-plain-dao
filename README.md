# mysql-plain-dao

A TypeScript-first tool for generating data model objects from existing MySQL databases. It also provides a library of utilities to simplify database access operations.

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

## Inspired by

This project was inspired by [schemats](https://github.com/SweetIQ/schemats)

## License

MIT

