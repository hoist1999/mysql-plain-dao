import { parse as urlParse } from 'url';
/**
 * Parse MySQL connection string to PoolOptions
 * Supports format: mysql://user:password@host:port/database
 */
export function parseConnectionString(connectionString) {
    try {
        const url = urlParse(connectionString, true);
        if (!url.hostname) {
            throw new Error('Invalid connection string: missing hostname');
        }
        const config = {
            host: url.hostname,
            user: url.auth?.split(':')[0] || 'root',
            password: url.auth?.split(':')[1] || '',
            database: url.pathname ? url.pathname.slice(1) : undefined,
            port: url.port ? parseInt(url.port, 10) : 3306,
            namedPlaceholders: true,
        };
        return config;
    }
    catch (error) {
        throw new Error(`Failed to parse connection string: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=connectionParser.js.map