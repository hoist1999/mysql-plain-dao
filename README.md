# mysql-plain-dao

A TypeScript-first tool for generating data model objects from existing MySQL databases. It also provides a library of utilities to simplify database access operations.

## Warning
> ⚠️ **Warning**: This package is still under active development and the API is not yet stable. Please do not use it in production environments.

## Inspired by

This project was inspired by [schemats](https://github.com/SweetIQ/schemats). Some code has been adapted and modified from their implementation to better suit our needs.


## Features

- Generate TypeScript interfaces from MySQL database tables
- Maintain type safety between your database and application code
- Automatic type definition updates when database schema changes
- Built-in DAO (Data Access Object) utilities for CRUD operations

## Installation

```bash
# Using npm
npm install mysql-plain-dao

# Using pnpm
pnpm add mysql-plain-dao
```

## Usage

### Quick Start

This package provides two main features:

1. **CLI Tool**: Generate TypeScript type definitions from MySQL database tables

2. **DAO Library**: Base DAO class and database utilities for CRUD operations


## Command Line Tool
Generate TypeScript interfaces from your MySQL database:

For detailed information about command line options, configuration, and more examples, 
please refer to our [CLI Guide](./docs/CLI.md).


## DAO Library
Base DAO class and database utilities for CRUD operations
   ```typescript
   import { BaseDAO } from 'mysql-plain-dao';
   
   class UserDAO extends BaseDAO<User> {
       constructor() {
           super('user');
       }
   }
   ```



## Contributing & Testing
We welcome contributions! This project includes comprehensive test coverage for database operations, DAO functionality, and type generation. 

Before submitting a pull request, please ensure you've:
- Added tests for new features
- Updated relevant documentation
- Followed the existing code style

For detailed testing information, please refer to our [Testing Guide](./docs/TESTING.md).

## License

MIT

