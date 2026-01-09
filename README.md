# mysql-plain-dao

一个 TypeScript 优先的工具，用于从现有 MySQL 数据库生成数据模型对象，并通过类型安全的 DAO 操作执行原生 SQL 查询。它还提供了一个实用程序库来简化数据库访问操作。


## 警告
> ⚠️ **警告**: 此包仍在积极开发中，API 尚未稳定。请不要在生产环境中使用。

## 为什么选择原生 SQL？

在 AI 生成代码的时代，编写 SQL 查询变得比以往任何时候都更容易 - AI 可以帮助生成查询，同时您保持对性能和调试的控制。此工具帮助您在利用 SQL 的全部功能的同时保持类型安全。


## 快速开始

### 1. 安装

```bash
# 使用 npm
npm install mysql-plain-dao

# 或使用 pnpm（推荐）
pnpm add mysql-plain-dao
```

### 2. 准备 MySQL 数据库

首先，创建一个 MySQL 数据库和表。以下是一个创建 `user` 表示例：

```sql
CREATE DATABASE IF NOT EXISTS mydb;
USE mydb;

CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. 使用命令行工具生成 Model 和 DAO

从现有的 MySQL 数据库表生成 TypeScript 接口和 DAO：

```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/mydb -t user -o src/dao/
```

生成的文件示例：

```typescript
// src/dao/User.ts
export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    first_name?: string | null;
    last_name?: string | null;
    is_active?: boolean | null;
    created_at?: Date | null;
    updated_at?: Date | null;
}

export type InsertUser = Omit<User, 'id'>;
```

```typescript
// src/dao/UserDao.ts
import type { User, InsertUser } from './User';
import { BaseDao } from 'mysql-plain-dao';

export class UserDao extends BaseDao<User, InsertUser> {
    constructor() {
        super({
            table_name: 'user'
        });
    }
    
    // 在此处放置您的自定义数据库访问方法
}
```

### 4. 以下是如何使用生成的 DAO 类进行 CRUD 操作：

```typescript
// src/user-crud-example.ts
import { DbUtil } from 'mysql-plain-dao';
import { UserDao } from './dao/UserDao';
import type { InsertUser } from './dao/User';

// 数据库配置
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'mydb'
};

async function main() {
    try {
        // 初始化数据库连接
        await DbUtil.initialize(DB_CONFIG);
        console.log('数据库连接初始化成功');

        const userDao = new UserDao();

        // 创建: 插入新用户
        const newUser: InsertUser = {
            username: 'john_doe',
            email: 'john@example.com',
            password_hash: 'hashed_password',
            first_name: 'John',
            last_name: 'Doe',
            is_active: true
        };
        const userId = await userDao.insertAsync(newUser);
        console.log('创建用户，ID:', userId);

        // 读取: 根据 ID 获取用户
        const user = await userDao.getByIdAsync(userId);
        console.log('检索到的用户:', user);

        // 更新: 修改用户数据
        if (user) {
            const updatedUser = {
                ...user,
                first_name: 'Johnny',
                last_name: 'Doe Jr'
            };
            await userDao.updateAsync(updatedUser);
            console.log('用户更新成功');
        }

        // 列出所有数据
        const activeUsers = await userDao.getListAsync();
        console.log('活跃用户:', activeUsers);

        // 删除
        await userDao.deleteByIdAsync(userId);
        console.log('用户删除成功');
    } catch (error) {
        console.error('发生错误:', error);
        process.exit(1);
    } finally {
        // 完成后始终关闭连接
        await DbUtil.endPoolAsync();
        console.log('数据库连接已关闭');
    }
}

// 执行示例
main().catch(console.error);
```

## CLI 选项

| 选项 | 说明 |
|------|------|
| `-c, --conn` | 数据库连接字符串（MySQL） |
| `-t, --table` | 要生成接口的表名 |
| `-o, --output` | 生成文件的输出目录 |
| `-g, --generate` | 生成类型（model、dao 或 all） |
| `--model-dir` | 模型文件的特定输出目录 |
| `--dao-dir` | DAO 文件的特定输出目录 |
| `--no-header` | 跳过写入文件头注释 |

## 数据库迁移

该库提供了一个简单且专业的迁移系统，用于管理数据库架构变更。迁移在事务中执行，确保数据安全和回滚能力。

### 快速开始

1. **创建迁移文件:**
```bash
npx mysql-plain-dao migrate create add_users_table
```

这将创建一个 SQL 文件，例如 `migrations/20250105_120000_add_users_table.sql`。

2. **编辑迁移文件:**
```sql
-- migrations/20250105_120000_add_users_table.sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

3. **运行迁移:**
```bash
# 方式 1: 使用连接字符串
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb

# 方式 2: 使用 .env 文件（无需 -c 参数）
# 创建 .env 文件，内容如下:
# DB_HOST=127.0.0.1
# DB_USER=root
# DB_PASSWORD=root888
# DB_DATABASE=mydb
npx mysql-plain-dao migrate up
```

### 迁移文件格式

迁移文件是纯 SQL 文件，命名格式为: `<timestamp>_<name>.sql`

- **时间戳格式**: `YYYYMMDD_HHmmss` (例如: `20250105_120000`)
- **名称**: 使用小写字母、数字和下划线的描述性名称 (例如: `add_users_table`)
- **文件扩展名**: `.sql`

示例: `20250105_120000_create_users.sql`

### 迁移命令

#### `migrate up` - 运行待处理的迁移

按顺序执行所有待处理的迁移:

```bash
# 使用连接字符串
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb

# 使用 .env 文件（无需 -c 参数）
npx mysql-plain-dao migrate up
```

**选项:**
- `-c, --conn <connection>` - 数据库连接字符串（可选，可使用 `DAO_CONN` 环境变量或 `.env` 文件）
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）
- `--to <name>` - 运行到指定迁移（包含该迁移）
- `--dry-run` - 显示将要执行的内容但不实际运行

**数据库配置选项:**

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
   # 可选:
   DB_PORT=3306
   
   # 然后无需 -c 参数即可运行:
   npx mysql-plain-dao migrate up
   ```

**示例:**
```bash
# 运行所有待处理的迁移（使用连接字符串）
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb

# 运行所有待处理的迁移（使用 .env 文件）
npx mysql-plain-dao migrate up

# 运行到指定迁移
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb --to 20250105_130000_add_email
# 或使用 .env 文件:
npx mysql-plain-dao migrate up --to 20250105_130000_add_email

# 干运行，查看将要执行的内容
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb --dry-run
# 或使用 .env 文件:
npx mysql-plain-dao migrate up --dry-run

# 使用自定义迁移目录
npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/mydb --migrations-dir db/migrations
# 或使用 .env 文件:
npx mysql-plain-dao migrate up --migrations-dir db/migrations
```

#### `migrate status` - 查看迁移状态

显示哪些迁移已应用，哪些待处理:

```bash
npx mysql-plain-dao migrate status -c mysql://user:pass@localhost:3306/mydb
```

**输出示例:**
```
Migration Status:

✅ 20250105_120000_create_users (applied at 1/5/2025, 12:00:15 PM, duration: 45ms)
✅ 20250105_130000_add_email (applied at 1/5/2025, 1:00:20 PM, duration: 32ms)
⏳ 20250105_140000_add_index (pending)

Total: 3 migration(s), 2 applied, 1 pending
```

**选项:**
- `-c, --conn <connection>` - 数据库连接字符串（必需，或使用 `DAO_CONN` 环境变量）
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）

#### `migrate create` - 创建新迁移

创建一个带时间戳前缀的新迁移文件:

```bash
npx mysql-plain-dao migrate create add_users_table
```

**选项:**
- `--migrations-dir <dir>` - 迁移文件目录（默认: `migrations`，或使用 `DAO_MIGRATIONS_DIR` 环境变量）

**示例:**
```bash
npx mysql-plain-dao migrate create add_users_table
# 创建: migrations/20250105_120000_add_users_table.sql
```

### 迁移特性

- **事务安全**: 每个迁移在事务中运行。如果失败，所有更改都会回滚。
- **顺序保证**: 迁移按文件名顺序执行（基于时间戳）。
- **幂等性**: 已应用的迁移会自动跳过。
- **多语句支持**: 每个 SQL 文件可以包含多个用分号分隔的语句。
- **跟踪记录**: 所有已应用的迁移都会记录在 `migrations` 表中，包含执行时间和持续时间。

### 迁移文件示例

**创建表:**
```sql
-- migrations/20250105_120000_create_users.sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**添加列:**
```sql
-- migrations/20250105_130000_add_email_verified.sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

**创建索引:**
```sql
-- migrations/20250105_140000_add_user_index.sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_created_at ON users(created_at);
```

**多条语句:**
```sql
-- migrations/20250105_150000_update_schema.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_user_phone ON users(phone);
UPDATE users SET phone = '' WHERE phone IS NULL;
```

### 环境变量

您可以使用环境变量来避免重复输入连接字符串:

**方式 1: 使用 DAO_CONN（连接字符串格式）:**
```bash
# 设置连接字符串
export DAO_CONN="mysql://user:pass@localhost:3306/mydb"

# 设置迁移目录（可选）
export DAO_MIGRATIONS_DIR="db/migrations"

# 现在可以无需 -c 参数运行命令
npx mysql-plain-dao migrate up
npx mysql-plain-dao migrate status
```

**方式 2: 使用 .env 文件，提供单独的数据库设置:**
```bash
# 在项目根目录创建 .env 文件:
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root888
DB_DATABASE=mydb
DB_PORT=3306

# 可选: 设置迁移目录
DAO_MIGRATIONS_DIR=db/migrations

# 现在可以无需 -c 参数运行命令
npx mysql-plain-dao migrate up
npx mysql-plain-dao migrate status
```

`.env` 文件会根据 `NODE_ENV` 自动加载:
- `NODE_ENV=development`: 加载 `.env`, `.env.development`, `.env.development.local`
- `NODE_ENV=test`: 加载 `.env`, `.env.test`, `.env.test.local`
- `NODE_ENV=production`: 加载 `.env`, `.env.production`, `.env.production.local`

### 最佳实践

1. **始终先在开发数据库上测试迁移**
2. **使用描述性名称**命名迁移文件（例如: `add_user_email_index` 而不是 `migration1`）
3. **保持迁移小而专注** - 每个迁移只做一个逻辑变更
4. **永远不要修改**已经应用过的现有迁移文件
5. **使用事务** - 迁移自动在事务中运行
6. **在生产环境运行迁移前备份数据库**

## 基础 DAO 类

该库为不同的主键场景提供了三个基础 DAO 类：

| 基础类 | 说明 | 内置 CRUD 方法 |
|--------|------|---------------|
| `BaseDao<T>` | 用于自增 ID 的表 | • `insertAsync()` - 创建新记录<br>• `getByIdAsync()` - 根据 ID 检索<br>• `updateAsync()` - 更新记录<br>• `deleteByIdAsync()` - 根据 ID 删除<br>• `getListAsync()` - 列出所有记录 |
| `BaseDaoUUID<T>` | 用于 UUID 主键的表 | • `insertAsync()` - 创建新记录<br>• `getByUuidAsync()` - 根据 UUID 检索<br>• `updateAsync()` - 更新记录<br>• `deleteByUuidAsync()` - 根据 UUID 删除<br>• `getListAsync()` - 列出所有记录 |
| `BaseDaoDoubleID<T>` | 用于同时具有 ID 和 UUID 的表 | • `insertAsync()` - 创建新记录<br>• `getByIdAsync()` - 根据 ID 检索<br>• `getByUuidAsync()` - 根据 UUID 检索<br>• `updateAsync()` - 更新记录<br>• `deleteByIdAsync()` - 根据 ID 删除<br>• `deleteByUuidAsync()` - 根据 UUID 删除<br>• `getListAsync()` - 列出所有记录 |

生成器会根据您的表结构自动选择合适的基础类。

## 编写自定义 DAO 方法

每个生成的 DAO 类都带有内置的 CRUD 操作：


需要更具体的数据库操作？您可以在 DAO 类中添加自定义方法。以下是如何使用自定义 SQL 查询扩展 `UserDao` 类：

   ```typescript
// src/dao/UserDao.ts

import { BaseDaoDoubleID } from '../../dao/BaseDaoDoubleID';
import { DbUtil } from '../../dao/DbUtil';
import type { InsertUser, User } from './User';

export class UserDao extends BaseDaoDoubleID<User, InsertUser> {
    constructor() {
        super({
            table_name: 'user',
        });
    }

    // 您可以在下面添加自己的方法


    // 下面的自定义方法

    /** 查找在过去 n 天内登录的活跃用户 */
    async findActiveUsersAsync(): Promise<User[]> {
        const sql = `
            SELECT * FROM user 
            WHERE is_active = true 
            ORDER BY last_login DESC
            LIMIT 100
        `;

        return await DbUtil.executeGetListAsync<User>(sql);
    }

    /** 更新用户状态并记录更改时间 */
    async updateUserStatusAsync(userId: number, isActive: boolean): Promise<number> {
        const sql = `
            UPDATE user 
            SET is_active = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        return await DbUtil.executeUpdateAsync(sql, [isActive, userId]);
    }

    /** 根据注册日期获取用户统计信息 */
    async getUserStatsByDateAsync(startDate: Date, endDate: Date)
        : Promise<Array<{ date: string; count: number }>> {
        const sql = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM user
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `;
        const result = await DbUtil.executeGetListAsync<{ date: string; count: number }>(
            sql,
            [startDate, endDate]
        );
        return result;
    }

    /** 使用复杂条件搜索用户 */
    async searchUsersAsync(params: {
        keyword?: string;
        isActive?: boolean;
        startDate?: Date;
        limit?: number;
    }): Promise<User[]> {
        const conditions: string[] = ['1=1'];
        const values: any[] = [];

        if (params.keyword) {
            const keyword = `%${params.keyword}%`;
            conditions.push('(username LIKE ? OR email LIKE ?)');
            values.push(keyword, keyword);
        }

        if (params.isActive !== undefined) {
            conditions.push('is_active = ?');
            values.push(params.isActive);
        }

        if (params.startDate) {
            conditions.push('created_at >= ?');
            values.push(params.startDate);
        }

        const sql = `
            SELECT * FROM user
            WHERE ${conditions.join(' AND ')}
            ORDER BY created_at DESC
            LIMIT ?
        `;

        values.push(params.limit || 100);

        return await DbUtil.executeGetListAsync<User>(sql, values);
    }
}
```

使用示例：

```typescript
const userDao = new UserDao();

// 查找活跃用户
const recentUsers = await userDao.findActiveUsersAsync();

// 更新用户状态
await userDao.updateUserStatusAsync(123, false);

// 获取上个月的用户注册统计信息
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 1);
const stats = await userDao.getUserStatsByDateAsync(startDate, new Date());

// 使用复杂条件搜索用户
const searchResults = await userDao.searchUsersAsync({
    keyword: 'user',
    isActive: true,
    startDate: new Date('2024-01-01T00:00:00Z'),
    limit: 10
});
```

## SQL 注入防护

SQL 注入是最常见的 Web 应用程序漏洞之一。以下是如何使用此库编写安全的 SQL 查询：

### ❌ 不安全示例（请勿使用）

```typescript
// 不要这样做 - 容易受到 SQL 注入攻击
class UnsafeUserDao {
    async searchUsers(keyword: string, isActive: boolean) {
        // 危险：直接字符串拼接
        const sql = `
            SELECT * FROM user 
            WHERE username LIKE '%${keyword}%'
            AND is_active = ${isActive}
        `;
        return await DbUtil.executeGetListAsync(sql);
    }
}

// 这可能会被利用：
await userDao.searchUsers("' OR '1'='1'; DROP TABLE user; --", true);
```

### ✅ 安全示例（推荐）

```typescript
class UserDao extends BaseDaoDoubleID<User, InsertUser> {
    // 方法 1: 使用参数化查询（推荐）
    async searchUsers(keyword: string, isActive: boolean) {
        const sql = `
            SELECT * FROM user 
            WHERE username LIKE ? 
            AND is_active = ?
        `;
        return await DbUtil.executeGetListAsync(sql, [`%${keyword}%`, isActive]);
    }

    // 方法 2: 使用 mysql2 的 format 函数
    async searchUsersWithFormat(keyword: string, isActive: boolean) {
        const sql = format(
            'SELECT * FROM user WHERE username LIKE ? AND is_active = ?',
            [`%${keyword}%`, isActive]
        );
        return await DbUtil.executeGetListAsync(sql);
    }
}
```

### 关键安全要点

1. **永远不要**直接将用户输入拼接到 SQL 字符串中
2. **始终**使用带有 `?` 占位符的参数化查询
3. **考虑**对复杂查询使用 `mysql2` 的 `format` 或 `escape` 函数
4. **在使用查询之前验证和清理输入**
5. **遵循**内置 DAO 方法使用参数化查询而不是字符串拼接的模式


## 灵感来源

此项目受到 [schemats](https://github.com/SweetIQ/schemats) 的启发，该项目已不再积极维护。部分代码已从其实现中改编，同时代码库已用 TypeScript 重写，并增强了现代功能和附加功能。


## License

MIT