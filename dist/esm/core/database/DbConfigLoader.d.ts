import mysql from 'mysql2';
/**
 * Get database configuration from environment variables.
 * Environment files are loaded based on NODE_ENV:
 * - For local development (NODE_ENV=development):
 *   - .env
 *   - .env.development
 *   - .env.development.local
 *
 * - For testing (NODE_ENV=test):
 *   - .env
 *   - .env.test
 *   - .env.test.local
 *
 * - For production (NODE_ENV=production):
 *   - .env
 *   - .env.production
 *   - .env.production.local
 *
 * Required environment variables:
 * - DB_HOST: Database host
 * - DB_USER: Database user
 * - DB_PASSWORD: Database password
 * - DB_DATABASE: Database name
 *
 * Optional environment variables (with defaults):
 * - DB_PORT: Database port (default: 3306)
 * - DB_CONNECTION_LIMIT: Max connections (default: 10)
 * - DB_QUEUE_LIMIT: Connection queue limit (default: 0)
 * - DB_WAIT_FOR_CONNECTIONS: Wait for connections (default: false)
 */
export declare function getDbConfigFromEnv(): mysql.PoolOptions;
