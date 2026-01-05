import dotenvFlow from 'dotenv-flow';
import debug_func from 'debug';
const debug = debug_func('DAO');
const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
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
export function getDbConfigFromEnv() {
    // Load environment variables based on NODE_ENV
    dotenvFlow.config({
        node_env: process.env.NODE_ENV || 'development'
    });
    // Check required environment variables
    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            throw new Error(`${envVar} is not set in environment variables. Please check your .env files.`);
        }
    }
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT) || 3306,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 0,
        waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
        debug: process.env.NODE_ENV === 'development'
    };
    debug('DB Config:', {
        ...config,
        password: config.password ? '****** (hidden)' : 'empty' // Hide password in logs
    });
    return config;
}
//# sourceMappingURL=DbConfigLoader.js.map