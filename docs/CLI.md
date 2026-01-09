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

## 迁移命令

CLI 提供了用于管理数据库架构变更的迁移命令。

### `migrate up` - 运行待处理的迁移

按顺序执行所有待处理的迁移。

**数据库配置:**

`migrate up` 命令支持三种配置数据库连接的方式（按优先级排序）:

1. **通过命令行参数提供连接字符串:**
   ```bash
   npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb
   ```

2. **通过环境变量提供连接字符串:**
   ```bash
   export DAO_CONN="mysql://user:pass@localhost:3306/mydb"
   npx mysql-plain-dao migrate up
   ```

3. **通过 .env 文件提供单独的数据库设置:**
   ```bash
   # 在项目根目录创建 .env 文件:
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=root888
   DB_DATABASE=mydb
   DB_PORT=3306
   
   # 然后无需 -c 参数即可运行:
   npx mysql-plain-dao migrate up
   ```

**选项:**
- `-c, --conn <connection>` - 数据库连接字符串（如果使用 .env 文件则为可选）
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）
- `--to <name>` - 运行到指定迁移（包含该迁移）
- `--dry-run` - 显示将要执行的内容但不实际运行

**示例:**
```bash
# 运行所有待处理的迁移（使用连接字符串）
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb

# 运行所有待处理的迁移（使用 .env 文件）
npx mysql-plain-dao migrate up

# 运行到指定迁移
npx mysql-plain-dao migrate up --to 20250105_130000_add_email

# 干运行，查看将要执行的内容
npx mysql-plain-dao migrate up --dry-run

# 使用自定义迁移目录
npx mysql-plain-dao migrate up --migrations-dir db/migrations
```

### `migrate status` - 查看迁移状态

显示哪些迁移已应用，哪些待处理。

**选项:**
- `-c, --conn <connection>` - 数据库连接字符串（如果使用 .env 文件则为可选）
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）

**示例:**
```bash
npx mysql-plain-dao migrate status
```

### `migrate create` - 创建新迁移

创建一个带时间戳前缀的新迁移文件。

**选项:**
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）

**示例:**
```bash
npx mysql-plain-dao migrate create add_users_table
# 创建: migrations/20250105_120000_add_users_table.sql
```

### 迁移环境变量

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `DAO_CONN` | 数据库连接字符串（格式: `mysql://user:pass@host:port/database`） | - |
| `DB_HOST` | 数据库主机（使用 .env 文件时） | - |
| `DB_USER` | 数据库用户（使用 .env 文件时） | - |
| `DB_PASSWORD` | 数据库密码（使用 .env 文件时） | - |
| `DB_DATABASE` | 数据库名称（使用 .env 文件时） | - |
| `DB_PORT` | 数据库端口（使用 .env 文件时） | 3306 |
| `DAO_MIGRATIONS_DIR` | 迁移文件目录 | `migrations` |

**注意:** `.env` 文件会根据 `NODE_ENV` 自动加载:
- `NODE_ENV=development`: 加载 `.env`, `.env.development`, `.env.development.local`
- `NODE_ENV=test`: 加载 `.env`, `.env.test`, `.env.test.local`
- `NODE_ENV=production`: 加载 `.env`, `.env.production`, `.env.production.local`
