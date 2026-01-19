# 命令行界面指南

本文档描述了 mysql-plain-dao 的命令行界面。

## 常用使用示例

以下是一些使用 CLI 的常见示例：

### 1. 为单个表生成接口：
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/
```

* `-c mysql://user:pass@localhost:3306/dbname` 表示数据库连接字符串
* `-t users` 表示要生成的表名
* `-o src/models/` 表示生成文件的输出目录
* 默认情况下，这将生成 model 和 DAO 文件

### 2. 为多个表生成接口：
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/
```

这里，`-t users -t products` 表示同时为这两个表生成文件。

### 3. 仅生成模型文件：
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -g model -o src/models/
```

* `-g model` 指定仅生成模型/接口文件
* 您也可以使用 `-g dao` 仅生成 DAO 文件，或使用 `-g all`（默认）生成两者

### 4. 使用自定义目录生成文件：
```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users \
  --model-dir src/models/ \
  --dao-dir src/dao/
```

* `--model-dir` 指定模型文件的输出目录
* `--dao-dir` 指定 DAO 文件的输出目录
* 这些会覆盖各自文件类型的 `-o` 选项

## 命令行选项

| 选项 | 别名 | 说明 | 必需 | 默认值 |
|------|------|------|------|--------|
| --conn | -c | MySQL 连接字符串 | 是 | - |
| --table | -t | 要生成接口的表名 | 是 | - |
| --schema | -s | 数据库架构名称 | 否 | - |
| --output | -o | 输出 TypeScript 文件路径 | 是 | - |
| --camelCase | -C | 将列名转换为 camelCase | 否 | false |
| --noHeader | - | 跳过写入文件头注释 | 否 | false |
| --config | - | 配置文件路径 | 否 | schemats.json |



## 使用配置文件

所有命令行选项都可以在配置文件中指定。当您需要多次重用相同设置或管理复杂配置时，这特别有用。

例如，在项目根目录中创建一个 `schemas.json` 配置文件：

```json
{
  "conn": "mysql://user:pass@localhost:3306/dbname",
  "table": ["users", "products"],
  "output": "src/models/",
  "noHeader": false
}
```

然后运行命令行工具：

```bash
npx mysql-plain-dao generate --config schemats.json
```

这与使用单独选项运行命令具有相同的效果：

```bash
npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -t products -o src/models/ -C
```


## 使用环境变量

环境变量提供了一种安全且灵活的配置工具的方式，特别适用于：
- CI/CD 流水线，其中敏感信息不应在命令行参数中暴露
- Docker 容器和云环境
- 在不同配置之间切换的开发工作流

所有选项都可以使用带有 `DAO_` 前缀的环境变量来设置：

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| DAO_CONN | 数据库连接字符串 | - |
| DAO_TABLE | 要生成接口的表名 | - |
| DAO_OUTPUT | 生成文件的输出目录 | - |
| DAO_GENERATE | 生成类型（model、dao 或 all） | all |
| DAO_MODEL_DIR | 模型文件的输出目录 | 与 OUTPUT 相同 |
| DAO_DAO_DIR | DAO 文件的输出目录 | 与 OUTPUT 相同 |
| DAO_NO_HEADER | 跳过写入文件头注释 | false |

### 示例

```bash
DAO_CONN=mysql://user:pass@localhost:3306/dbname \
DAO_TABLE=users,products \
DAO_OUTPUT=src/models/ \
DAO_GENERATE=all \
npx mysql-plain-dao generate
```

这种方法等同于使用命令行参数，但提供了更好的安全性和可维护性。

## 迁移命令

CLI 提供了用于管理数据库架构变更的迁移命令。

### `migrate-up` - 运行待处理的迁移

按顺序执行所有待处理的迁移。

**数据库配置:**

`migrate-up` 命令支持三种配置数据库连接的方式（按优先级排序）:

1. **通过命令行参数提供连接字符串:**
   ```bash
   npx mysql-plain-dao migrate-up -c mysql://user:pass@localhost:3306/mydb
   ```

2. **通过环境变量提供连接字符串:**
   ```bash
   export DAO_CONN="mysql://user:pass@localhost:3306/mydb"
   npx mysql-plain-dao migrate-up
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
   npx mysql-plain-dao migrate-up
   ```

**选项:**
- `-c, --conn <connection>` - 数据库连接字符串（如果使用 .env 文件则为可选）
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）
- `--to <name>` - 运行到指定迁移（包含该迁移）
- `--dry-run` - 显示将要执行的内容但不实际运行

**示例:**
```bash
# 运行所有待处理的迁移（使用连接字符串）
npx mysql-plain-dao migrate-up -c mysql://user:pass@localhost:3306/mydb

# 运行所有待处理的迁移（使用 .env 文件）
npx mysql-plain-dao migrate-up

# 运行到指定迁移
npx mysql-plain-dao migrate-up --to 20250105_130000_add_email

# 干运行，查看将要执行的内容
npx mysql-plain-dao migrate-up --dry-run

# 使用自定义迁移目录
npx mysql-plain-dao migrate-up --migrations-dir db/migrations
```

### `migrate-status` - 查看迁移状态

显示哪些迁移已应用，哪些待处理。

**选项:**
- `-c, --conn <connection>` - 数据库连接字符串（如果使用 .env 文件则为可选）
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）

**示例:**
```bash
npx mysql-plain-dao migrate-status
```

### `migrate-create` - 创建新迁移

创建一个带时间戳前缀的新迁移文件。

**选项:**
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）

**示例:**
```bash
npx mysql-plain-dao migrate-create add_users_table
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
