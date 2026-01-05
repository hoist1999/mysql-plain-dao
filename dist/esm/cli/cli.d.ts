#! /usr/bin/env node
/**
 * Command Line Interface for MySQL Plain DAO
 *
 * This CLI tool provides multiple functionalities:
 * - Generate TypeScript models and DAO classes from MySQL database tables
 * - Manage database migrations (create, run, status)
 *
 * Example usage:
 *   # Generate models and DAO
 *   npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/
 *
 *   # Migration commands
 *   npx mysql-plain-dao migrate create add_users_table
 *   npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/dbname
 *   npx mysql-plain-dao migrate status -c mysql://user:pass@localhost:3306/dbname
 */
export {};
