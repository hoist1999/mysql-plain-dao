# Command Line Interface Guide

This document describes the command line interface for mysql-plain-dao.

## Common Usage Examples

Here are some common examples of how to use the CLI:

### 1. Generate interface for a single table:
```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/
```

* `-c mysql://user:pass@localhost:3306/dbname` indicates database connection string
* `-t users` indicates the table name to be generated
* `-o src/models/` indicates the output directory for generated files
* By default, this will generate both model and DAO files

### 2. Generate interfaces for multiple tables:
```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/
```

Here, `-t users -t products` means generating files for these two tables at the same time.

### 3. Generate only model files:
```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -g model -o src/models/
```

* `-g model` specifies to only generate model/interface files
* You can also use `-g dao` for only DAO files, or `-g all` (default) for both

### 4. Generate files with custom directories:
```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users \
  --model-dir src/models/ \
  --dao-dir src/dao/
```

* `--model-dir` specifies output directory for model files
* `--dao-dir` specifies output directory for DAO files
* These override the `-o` option for their respective file types

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
  "output": "src/models/",
  "noHeader": false
}
```

Then run the command line tool:

```bash
npx mysql-plain-dao --config schemats.json
```

This will have the same effect as running the command with individual options:

```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/ -C
```


## Using Environment Variables

Environment variables provide a secure and flexible way to configure the tool, especially useful in:
- CI/CD pipelines where sensitive information should not be exposed in command line arguments
- Docker containers and cloud environments
- Development workflows where you switch between different configurations

All options can be set using environment variables with the `DAO_` prefix:

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| DAO_CONN | Database connection string | - |
| DAO_TABLE | Table name(s) to generate interfaces for | - |
| DAO_OUTPUT | Output directory for generated files | - |
| DAO_GENERATE | Generation type (model, dao, or all) | all |
| DAO_MODEL_DIR | Output directory for model files | Same as OUTPUT |
| DAO_DAO_DIR | Output directory for DAO files | Same as OUTPUT |
| DAO_NO_HEADER | Skip writing file header comment | false |

### Example

```bash
DAO_CONN=mysql://user:pass@localhost:3306/dbname \
DAO_TABLE=users,products \
DAO_OUTPUT=src/models/ \
DAO_GENERATE=all \
npx mysql-plain-dao
```

This approach is equivalent to using command line arguments but offers better security and maintainability.
