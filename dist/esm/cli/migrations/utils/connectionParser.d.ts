import mysql from 'mysql2';
/**
 * Parse MySQL connection string to PoolOptions
 * Supports format: mysql://user:password@host:port/database
 */
export declare function parseConnectionString(connectionString: string): mysql.PoolOptions;
