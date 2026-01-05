"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.getMigrationStatus = getMigrationStatus;
const DbUtil_1 = require("../../../core/database/DbUtil");
const MigrationTable_1 = require("./MigrationTable");
const MigrationLoader_1 = require("./MigrationLoader");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('Migrations');
/**
 * Run pending migrations
 *
 * @param migrationsDir - Path to the directory containing migration SQL files
 * @param options - Migration execution options
 * @param options.to - Optional. Run migrations up to and including this migration name (e.g., '20250105_120000_create_users')
 * @param options.dryRun - Optional. If true, only show what would be executed without actually running migrations
 * @returns Promise that resolves when all migrations are completed
 * @throws Error if a migration fails or if the specified migration name in --to option is not found
 */
async function runMigrations(migrationsDir, options = {}) {
    // Ensure migrations table exists
    await (0, MigrationTable_1.ensureMigrationsTable)();
    // Load migration files
    const migrationFiles = await (0, MigrationLoader_1.loadMigrationFiles)(migrationsDir);
    if (migrationFiles.length === 0) {
        console.log('No migration files found.');
        return;
    }
    // Get applied migrations
    const appliedMigrations = await (0, MigrationTable_1.getAppliedMigrations)();
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
            const sql = await (0, MigrationLoader_1.loadMigrationSQL)(migrationFile.path);
            if (!sql) {
                throw new Error('Migration file is empty');
            }
            // Execute SQL within a transaction
            // Use query() instead of execute() to support multi-statement SQL
            await DbUtil_1.DbUtil.withTransaction(async (conn) => {
                await conn.query(sql);
            });
            // Record migration as applied
            const durationMs = Date.now() - startTime;
            const appliedAt = new Date();
            await (0, MigrationTable_1.recordMigrationApplied)(migrationFile.name, appliedAt, durationMs);
            console.log(`✅ Migration ${migrationFile.name} completed (${durationMs}ms)`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            const nodeEnv = process.env.NODE_ENV || '';
            const isTestEnv = nodeEnv.startsWith('test');
            // Don't output error messages in test environment (intentional failures are expected)
            if (!isTestEnv) {
                console.error(`❌ Migration ${migrationFile.name} failed`);
                console.error(`   Error: ${errorMsg}`);
                // Only show stack trace in development, not in production
                if (errorStack && nodeEnv !== 'production') {
                    console.error(`   Stack: ${errorStack}`);
                }
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
async function getMigrationStatus(migrationsDir) {
    await (0, MigrationTable_1.ensureMigrationsTable)();
    const files = await (0, MigrationLoader_1.loadMigrationFiles)(migrationsDir);
    const appliedMigrations = await (0, MigrationTable_1.getAppliedMigrations)();
    const appliedNames = new Set(appliedMigrations.map(m => m.name));
    const pending = files.filter(f => !appliedNames.has(f.name));
    return {
        files,
        applied: appliedNames,
        pending,
    };
}
//# sourceMappingURL=MigrationRunner.js.map