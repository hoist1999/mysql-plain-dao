import { Command, Option } from 'commander';
import { DbUtil } from '../../../core/database/DbUtil';
import { getMigrationStatus } from '../core/MigrationRunner';
import { parseConnectionString } from '../utils/connectionParser';
import { getDbConfigFromEnv } from '../../../core/database/DbConfigLoader';
import { resolve } from 'path';
export function createMigrateStatusCommand() {
    const command = new Command('status');
    command
        .description('Show migration status')
        .addOption(new Option('-c, --conn <connection>', 'Database connection string (MySQL). If not provided, will use DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE from .env file')
        .env('DAO_CONN'))
        .addOption(new Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations'))
        .action(async (options) => {
        try {
            // Initialize database connection
            // If connection string is provided, use it; otherwise, try to load from .env file
            let dbConfig;
            if (options.conn) {
                // Use connection string if provided
                dbConfig = parseConnectionString(options.conn);
            }
            else {
                // Try to load from environment variables (DB_HOST, DB_USER, etc.)
                try {
                    dbConfig = getDbConfigFromEnv();
                }
                catch (error) {
                    throw new Error('Database connection not provided. Please either:\n' +
                        '  1. Use -c/--conn option with connection string: mysql://user:pass@host:port/database\n' +
                        '  2. Or set DAO_CONN environment variable\n' +
                        '  3. Or set DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE in .env file\n' +
                        `Error: ${error.message}`);
                }
            }
            DbUtil.initialize(dbConfig);
            // Resolve migrations directory
            const migrationsDir = resolve(process.cwd(), options.migrationsDir);
            // Get status
            const status = await getMigrationStatus(migrationsDir);
            // Display status
            console.log('Migration Status:');
            console.log('');
            if (status.files.length === 0) {
                console.log('No migration files found.');
            }
            else {
                for (const file of status.files) {
                    if (status.applied.has(file.name)) {
                        // Find applied migration record for details
                        const appliedMigrations = await DbUtil.executeGetListAsync('SELECT applied_at, duration_ms FROM migrations WHERE name = ?', [file.name]);
                        if (appliedMigrations.length > 0) {
                            const record = appliedMigrations[0];
                            const appliedAt = new Date(record.applied_at).toLocaleString();
                            console.log(`✅ ${file.name} (applied at ${appliedAt}, duration: ${record.duration_ms}ms)`);
                        }
                        else {
                            console.log(`✅ ${file.name}`);
                        }
                    }
                    else {
                        console.log(`⏳ ${file.name} (pending)`);
                    }
                }
            }
            console.log('');
            console.log(`Total: ${status.files.length} migration(s), ${status.applied.size} applied, ${status.pending.length} pending`);
            // Clean up
            await DbUtil.endPoolAsync();
            process.exit(0);
        }
        catch (error) {
            console.error('\n❌ Failed to get migration status:');
            if (error.message) {
                console.error(error.message);
            }
            else {
                console.error('An unexpected error occurred.');
            }
            if (error.stack) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=migrateStatus.js.map