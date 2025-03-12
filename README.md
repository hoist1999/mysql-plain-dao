# mysql-plain-dao

A TypeScript-first tool for generating data model objects from existing MySQL databases and executing native SQL queries with type-safe DAO operations. It also provides a library of utilities to simplify database access operations.


## Warning
> ⚠️ **Warning**: This package is still under active development and the API is not yet stable. Please do not use it in production environments.

## Why Choose Native SQL?

In an era of AI-generated code, writing SQL queries has become easier than ever - AI can help generate queries while you maintain control over performance and debugging. This tool helps you maintain type safety while leveraging the full power of SQL.


## Quick Start

### 1. Installation

```bash
# Using npm
npm install mysql-plain-dao

# Or using pnpm (recommended)
pnpm add mysql-plain-dao
```

### 2. Prepare MySQL Database

First, create a MySQL database and tables. Here's an example of creating a `user` table:

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

### 3. Generate Model and DAO using Command Line Tool

Generate TypeScript interfaces and DAOs from your existing MySQL database tables:

```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/mydb -t user -o src/dao/
```

Generated files example:

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
    
    // Place your custom database access methods here
}
```

### 4. Here's how to use the generated DAO class for CRUD operations:

```typescript
// src/user-crud-example.ts
import { DbUtil } from 'mysql-plain-dao';
import { UserDao } from './dao/UserDao';
import type { InsertUser } from './dao/User';

// Database configuration
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'mydb'
};

async function main() {
    try {
        // Initialize database connection
        await DbUtil.initialize(DB_CONFIG);
        console.log('Database connection initialized successfully');

        const userDao = new UserDao();

        // Create: Insert a new user
        const newUser: InsertUser = {
            username: 'john_doe',
            email: 'john@example.com',
            password_hash: 'hashed_password',
            first_name: 'John',
            last_name: 'Doe',
            is_active: true
        };
        const userId = await userDao.insertAsync(newUser);
        console.log('Created user with ID:', userId);

        // Read: Get user by ID
        const user = await userDao.getByIdAsync(userId);
        console.log('Retrieved user:', user);

        // Update: Modify user data
        if (user) {
            const updatedUser = {
                ...user,
                first_name: 'Johnny',
                last_name: 'Doe Jr'
            };
            await userDao.updateAsync(updatedUser);
            console.log('User updated successfully');
        }

        // List all data
        const activeUsers = await userDao.getListAsync();
        console.log('Active users:', activeUsers);

        // Delete
        await userDao.deleteByIdAsync(userId);
        console.log('User deleted successfully');
    } catch (error) {
        console.error('Error occurred:', error);
        process.exit(1);
    } finally {
        // Always close the connection when done
        await DbUtil.endPoolAsync();
        console.log('Database connection closed');
    }
}

// Execute the example
main().catch(console.error);
```

## CLI Options

| Option | Description |
|--------|-------------|
| `-c, --conn` | Database connection string (MySQL) |
| `-t, --table` | Table name(s) to generate interfaces for |
| `-o, --output` | Output directory for generated files |
| `-g, --generate` | Generation type (model, dao, or all) |
| `--model-dir` | Specific output directory for model files |
| `--dao-dir` | Specific output directory for DAO files |
| `--no-header` | Skip writing file header comment |

## Base DAO Classes

The library provides three base DAO classes for different primary key scenarios:

| Base Class | Description | Built-in CRUD Methods |
|------------|-------------|----------------------|
| `BaseDao<T>` | For tables with auto-increment ID | • `insertAsync()` - Create new records<br>• `getByIdAsync()` - Retrieve by ID<br>• `updateAsync()` - Update records<br>• `deleteByIdAsync()` - Delete by ID<br>• `getListAsync()` - List all records |
| `BaseDaoUUID<T>` | For tables with UUID primary key | • `insertAsync()` - Create new records<br>• `getByUuidAsync()` - Retrieve by UUID<br>• `updateAsync()` - Update records<br>• `deleteByUuidAsync()` - Delete by UUID<br>• `getListAsync()` - List all records |
| `BaseDaoDoubleID<T>` | For tables with both ID and UUID | • `insertAsync()` - Create new records<br>• `getByIdAsync()` - Retrieve by ID<br>• `getByUuidAsync()` - Retrieve by UUID<br>• `updateAsync()` - Update records<br>• `deleteByIdAsync()` - Delete by ID<br>• `deleteByUuidAsync()` - Delete by UUID<br>• `getListAsync()` - List all records |

The generator automatically selects the appropriate base class based on your table structure.

## Writing Custom DAO Methods

Each generated DAO class comes with built-in CRUD operations:


Need more specific database operations? You can add custom methods to your DAO class. Here's how to extend the `UserDao` class with custom SQL queries:

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

    // You can add your own methods below


    // Custom methods below

    /** Find active users who logged in within the last n days */
    async findActiveUsersAsync(): Promise<User[]> {
        const sql = `
            SELECT * FROM user 
            WHERE is_active = true 
            ORDER BY last_login DESC
            LIMIT 100
        `;

        return await DbUtil.executeGetListAsync<User>(sql);
    }

    /** Update user status and record the change time */
    async updateUserStatusAsync(userId: number, isActive: boolean): Promise<number> {
        const sql = `
            UPDATE user 
            SET is_active = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        return await DbUtil.executeUpdateAsync(sql, [isActive, userId]);
    }

    /** Get user statistics by registration date */
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

    /** Search users with complex conditions */
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

Usage example:

```typescript
const userDao = new UserDao();

// Find active users
const recentUsers = await userDao.findActiveUsersAsync();

// Update user status
await userDao.updateUserStatusAsync(123, false);

// Get user registration statistics for the last month
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 1);
const stats = await userDao.getUserStatsByDateAsync(startDate, new Date());

// Search users with complex conditions
const searchResults = await userDao.searchUsersAsync({
    keyword: 'user',
    isActive: true,
    startDate: new Date('2024-01-01T00:00:00Z'),
    limit: 10
});
```

## SQL Injection Prevention

SQL injection is one of the most common web application vulnerabilities. Here's how to write secure SQL queries using this library:

### ❌ Unsafe Example (DO NOT USE)

```typescript
// DON'T DO THIS - Vulnerable to SQL injection
class UnsafeUserDao {
    async searchUsers(keyword: string, isActive: boolean) {
        // DANGEROUS: Direct string concatenation
        const sql = `
            SELECT * FROM user 
            WHERE username LIKE '%${keyword}%'
            AND is_active = ${isActive}
        `;
        return await DbUtil.executeGetListAsync(sql);
    }
}

// This could be exploited:
await userDao.searchUsers("' OR '1'='1'; DROP TABLE user; --", true);
```

### ✅ Safe Example (Recommended)

```typescript
class UserDao extends BaseDaoDoubleID<User, InsertUser> {
    // Method 1: Using parameterized queries (Recommended)
    async searchUsers(keyword: string, isActive: boolean) {
        const sql = `
            SELECT * FROM user 
            WHERE username LIKE ? 
            AND is_active = ?
        `;
        return await DbUtil.executeGetListAsync(sql, [`%${keyword}%`, isActive]);
    }

    // Method 2: Using mysql2's format function
    async searchUsersWithFormat(keyword: string, isActive: boolean) {
        const sql = format(
            'SELECT * FROM user WHERE username LIKE ? AND is_active = ?',
            [`%${keyword}%`, isActive]
        );
        return await DbUtil.executeGetListAsync(sql);
    }
}
```

### Key Security Points

1. **Never** concatenate user input directly into SQL strings
2. **Always** use parameterized queries with `?` placeholders
3. **Consider** using `mysql2`'s `format` or `escape` functions for complex queries
4. **Validate** and sanitize input before using it in queries
5. **Follow** the built-in DAO methods pattern of using parameterized queries instead of string concatenation


## Inspired by

This project was inspired by [schemats](https://github.com/SweetIQ/schemats), which is no longer actively maintained. Some code has been adapted from their implementation while the codebase has been rewritten in TypeScript and enhanced with modern features and additional functionality.


## License

MIT