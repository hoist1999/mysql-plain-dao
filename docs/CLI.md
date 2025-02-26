# Command Line Interface Guide

This document describes the command line interface for mysql-plain-dao.

## Common Usage Examples

Here are some common examples of how to use the CLI:

### 1. Generate interface for a single table:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
```

* `npx mysql-plain-dao` means using `npx` to run the executable tool in the _mysql-plain-dao_ package.

* `generate` is a subcommand of the tool, which is used to generate corresponding typescript type files and DAO class files from an existing database.

* `-c mysql://user:pass@localhost:3306/dbname` indicates database connection

* `-t users` indicates the table name to be generated. `users` is a table name used for examples.

* `-o src/models/users.ts` indicates the output file path

### 2. Generate interfaces for multiple tables

```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/index.ts
```

Here, `-t users` and `-t products` means generating these two data tables at the same time.


### 3. Generate interfaces with camelCase column names:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -C -o src/models/users.ts
```

* `-C` or `--camelCase` option will convert database column names from snake_case to camelCase in the generated TypeScript interfaces
* For example:
  - Database column: `user_id` -> TypeScript property: `userId`
  - Database column: `created_at` -> TypeScript property: `createdAt`
  - Database column: `first_name` -> TypeScript property: `firstName`

### 4. Generate interfaces with camelCase for all tables:
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -C -o src/models/index.ts
``` 

The command will generate type files for all data tables because the `-t` option is not provided here.


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



## Using Configuration File

All command line options can be specified in a configuration file. This is particularly useful when you need to reuse the same settings multiple times or manage complex configurations.

For example, create a `schemas.json` configuration file in the project root directory:

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

Then run the command line tool:

```bash
npx mysql-plain-dao generate --config schemats.json
```

This will have the same effect as running the command with individual options:

```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/index.ts -C
```


## Using Environment Variables

Environment variables provide a secure and flexible way to configure the tool, especially useful in:
- CI/CD pipelines where sensitive information should not be exposed in command line arguments
- Docker containers and cloud environments
- Development workflows where you switch between different configurations

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

### Example

```bash
SCHEMATS_CONN=mysql://user:pass@localhost:3306/dbname \
SCHEMATS_TABLE=users \
SCHEMATS_OUTPUT=src/models/users.ts \
npx mysql-plain-dao generate
```

This approach is equivalent to using command line arguments but offers better security and maintainability.
