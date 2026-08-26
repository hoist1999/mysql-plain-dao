import { ensureMigrationsTable, getAppliedMigrations, recordMigrationApplied } from './MigrationTable';
import { loadMigrationFiles, loadMigrationSQL } from './MigrationLoader';
import { getDbConfigFromEnv } from '../../../core/database/DbConfigLoader';
import mysql from 'mysql2/promise';
import debug_func from 'debug';
const debug = debug_func('Migrations');
/**
 * Run pending migrations
 *
 * @param migrationsDir - Path to the directory containing migration SQL files
 * @param options - Migration execution options
 * @param options.to - Optional. Run migrations up to and including this migration name (e.g., '20250105_120000_create_users')
 * @param options.dryRun - Optional. If true, only show what would be executed without actually running migrations
 * @param options.dbConfig - Optional. Database configuration. If not provided, will be loaded from environment variables.
 * @returns Promise that resolves when all migrations are completed
 * @throws Error if a migration fails or if the specified migration name in --to option is not found
 */
export async function runMigrations(migrationsDir, options = {}) {
    // Ensure migrations table exists
    await ensureMigrationsTable();
    // Load migration files
    const migrationFiles = await loadMigrationFiles(migrationsDir);
    if (migrationFiles.length === 0) {
        console.log('No migration files found.');
        return;
    }
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    const appliedNames = new Set(appliedMigrations.map(m => m.name));
    // Filter pending migrations
    let pendingMigrations = migrationFiles.filter(m => !appliedNames.has(m.name));
    // Apply --to filter if specified
    if (options.to) {
        const toIndex = pendingMigrations.findIndex(m => m.name === options.to);
        if (toIndex === -1) {
            throw new Error(`Migration '${options.to}' not found in pending migrations`);
        }
        pendingMigrations = pendingMigrations.slice(0, toIndex + 1);
    }
    if (pendingMigrations.length === 0) {
        console.log('No pending migrations.');
        return;
    }
    // Dry run mode
    if (options.dryRun) {
        console.log('Dry run mode - would execute the following migrations:');
        pendingMigrations.forEach(m => {
            console.log(`  - ${m.name}`);
        });
        return;
    }
    // Execute migrations
    console.log(`Running ${pendingMigrations.length} migration(s)...`);
    for (const migrationFile of pendingMigrations) {
        const startTime = Date.now();
        try {
            console.log(`Executing migration: ${migrationFile.name}`);
            // Load SQL content from file
            const sql = await loadMigrationSQL(migrationFile.path);
            if (!sql) {
                throw new Error('Migration file is empty');
            }
            // Execute SQL with support for multiple statements
            // Use a dedicated connection with multipleStatements enabled
            const dbConfig = options.dbConfig || getDbConfigFromEnv();
            // Create connection config with multipleStatements enabled
            // PoolOptions extends ConnectionOptions, so we can use it directly
            // but we need to remove pool-specific options
            const { connectionLimit, queueLimit, waitForConnections, ...baseConfig } = dbConfig;
            const connectionConfig = {
                ...baseConfig,
                multipleStatements: true, // Enable multiple statement execution
                // mysql2 debug dumps handshake packets and stack traces; opt in with MYSQL2_DEBUG=1
                debug: process.env.MYSQL2_DEBUG === '1',
            };
            const connection = await mysql.createConnection(connectionConfig);
            try {
                await connection.beginTransaction();
                // Execute SQL with multiple statements support
                await connection.query(sql);
                await connection.commit();
            }
            catch (error) {
                await connection.rollback();
                throw error;
            }
            finally {
                await connection.end();
            }
            // Record migration as applied
            const durationMs = Date.now() - startTime;
            const appliedAt = new Date();
            await recordMigrationApplied(migrationFile.name, appliedAt, durationMs);
            console.log(`✅ Migration ${migrationFile.name} completed (${durationMs}ms)`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const nodeEnv = process.env.NODE_ENV || '';
            const isTestEnv = nodeEnv.startsWith('test');
            // Don't output error messages in test environment (intentional failures are expected)
            if (!isTestEnv) {
                console.error(`❌ Migration ${migrationFile.name} failed`);
                console.error(`   Error: ${errorMsg}`);
            }
            throw new Error(`Migration ${migrationFile.name} failed: ${errorMsg}`);
        }
    }
    console.log('✨ All migrations completed successfully!');
}
/**
 * Get migration status
 *
 * @param migrationsDir - Path to the directory containing migration SQL files
 * @returns Promise that resolves to an object containing:
 *   - files: Array of all migration files found in the directory
 *   - applied: Set of migration names that have been applied to the database
 *   - pending: Array of migration files that have not been applied yet
 */
export async function getMigrationStatus(migrationsDir) {
    await ensureMigrationsTable();
    const files = await loadMigrationFiles(migrationsDir);
    const appliedMigrations = await getAppliedMigrations();
    const appliedNames = new Set(appliedMigrations.map(m => m.name));
    const pending = files.filter(f => !appliedNames.has(f.name));
    return {
        files,
        applied: appliedNames,
        pending,
    };
}
//# sourceMappingURL=MigrationRunner.js.map