# mysql-plain-dao

A TypeScript-first tool for generating data model objects from existing MySQL databases and executing native SQL queries with type-safe DAO operations. It also provides a library of utilities to simplify database access operations.


## Warning
> ⚠️ **Warning**: This package is still under active development and the API is not yet stable. Please do not use it in production environments.

## Why Choose Native SQL?

In an era of AI-generated code, writing SQL queries has become easier than ever - AI can help generate queries while you maintain control over performance and debugging. This tool helps you maintain type safety while leveraging the full power of SQL.


## Installation

```bash
# Using npm
npm install mysql-plain-dao

# Or using pnpm (recommended)
pnpm add mysql-plain-dao
```

## Command Line Tool

Generate TypeScript interfaces and DAOs from your existing MySQL database tables:

```bash
npx mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -o src/dao/
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
import { BaseDaoDoubleID } from 'mysql-plain-dao';

export class UserDao extends BaseDaoDoubleID<User, InsertUser> {
    constructor() {
        super({
            table_name: 'user'
        });
    }
    
    // Place your custom database access methods here
}
```

Here's how to use the generated DAO class for CRUD operations:

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

        // Read with conditions
        const activeUsers = await userDao.getListAsync();
        console.log('Active users:', activeUsers);

        // Delete
        await userDao.deleteByIdAsync(userId);
        console.log('User deleted successfully');

        // Custom query example
        const result = await DbUtil.queryAsync(
            'SELECT * FROM user WHERE created_at > ? AND is_active = ?',
            [new Date('2024-01-01'), true]
        );
        console.log('Custom query result:', result);

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

- \`-c, --conn\`: Database connection string (MySQL)
- \`-t, --table\`: Table name(s) to generate interfaces for
- \`-o, --output\`: Output directory for generated files
- \`-g, --generate\`: Generation type (model, dao, or all)
- \`--model-dir\`: Specific output directory for model files
- \`--dao-dir\`: Specific output directory for DAO files
- \`--no-header\`: Skip writing file header comment

## Base DAO Classes

The library provides three base DAO classes for different primary key scenarios:

- \`BaseDao<T>\`: For tables with auto-increment ID
- \`BaseDaoUUID<T>\`: For tables with UUID primary key
- \`BaseDaoDoubleID<T>\`: For tables with both ID and UUID

The generator automatically selects the appropriate base class based on your table structure.

## Contributing & Testing
We welcome contributions! This project includes comprehensive test coverage for database operations, DAO functionality, and type generation. 

Before submitting a pull request, please ensure you've:
- Added tests for new features
- Updated relevant documentation
- Followed the existing code style

For detailed testing information, please refer to our [Testing Guide](./docs/TESTING.md).


## Inspired by

This project was inspired by [schemats](https://github.com/SweetIQ/schemats), which is no longer actively maintained. Some code has been adapted from their implementation while the codebase has been rewritten in TypeScript and enhanced with modern features and additional functionality.


## License

MIT