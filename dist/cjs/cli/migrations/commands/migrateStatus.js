"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMigrateStatusCommand = createMigrateStatusCommand;
const commander_1 = require("commander");
const DbUtil_1 = require("../../../core/database/DbUtil");
const MigrationRunner_1 = require("../core/MigrationRunner");
const connectionParser_1 = require("../utils/connectionParser");
const DbConfigLoader_1 = require("../../../core/database/DbConfigLoader");
const path_1 = require("path");
function createMigrateStatusCommand(commandName = 'migrate-status') {
    const command = new commander_1.Command(commandName);
    command
        .description('Show migration status')
        .addOption(new commander_1.Option('-c, --conn <connection>', 'Database connection string (MySQL). If not provided, will use DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE from .env file')
        .env('DAO_CONN'))
        .addOption(new commander_1.Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations'))
        .action(async (options) => {
        try {
            // Initialize database connection
            // If connection string is provided, use it; otherwise, try to load from .env file
            let dbConfig;
            if (options.conn) {
                // Use connection string if provided
                dbConfig = (0, connectionParser_1.parseConnectionString)(options.conn);
            }
            else {
                // Try to load from environment variables (DB_HOST, DB_USER, etc.)
                try {
                    dbConfig = (0, DbConfigLoader_1.getDbConfigFromEnv)();
                }
                catch (error) {
                    throw new Error('Database connection not provided. Please either:\n' +
                        '  1. Use -c/--conn option with connection string: mysql://user:pass@host:port/database\n' +
                        '  2. Or set DAO_CONN environment variable\n' +
                        '  3. Or set DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE in .env file\n' +
                        `Error: ${error.message}`);
                }
            }
            DbUtil_1.DbUtil.initialize(dbConfig);
            // Resolve migrations directory
            const migrationsDir = (0, path_1.resolve)(process.cwd(), options.migrationsDir);
            // Get status
            const status = await (0, MigrationRunner_1.getMigrationStatus)(migrationsDir);
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
                        const appliedMigrations = await DbUtil_1.DbUtil.executeGetListAsync('SELECT applied_at, duration_ms FROM migrations WHERE name = ?', [file.name]);
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
            await DbUtil_1.DbUtil.endPoolAsync();
            process.exit(0);
        }
        catch (error) {
            console.error('\n❌ Failed to get migration status:');
            console.error(error.message || 'An unexpected error occurred.');
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=migrateStatus.js.map