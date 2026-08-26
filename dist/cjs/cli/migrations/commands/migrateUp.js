"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMigrateUpCommand = createMigrateUpCommand;
const commander_1 = require("commander");
const DbUtil_1 = require("../../../core/database/DbUtil");
const MigrationRunner_1 = require("../core/MigrationRunner");
const connectionParser_1 = require("../utils/connectionParser");
const DbConfigLoader_1 = require("../../../core/database/DbConfigLoader");
const path_1 = require("path");
function createMigrateUpCommand(commandName = 'migrate-up') {
    const command = new commander_1.Command(commandName);
    command
        .description('Run pending migrations')
        .addOption(new commander_1.Option('-c, --conn <connection>', 'Database connection string (MySQL). If not provided, will use DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE from .env file')
        .env('DAO_CONN'))
        .addOption(new commander_1.Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations'))
        .addOption(new commander_1.Option('--to <name>', 'Run migrations up to and including this one'))
        .addOption(new commander_1.Option('--dry-run', 'Show what would be executed without running'))
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
            // Run migrations
            await (0, MigrationRunner_1.runMigrations)(migrationsDir, {
                to: options.to,
                dryRun: options.dryRun,
                dbConfig: dbConfig,
            });
            // Clean up
            await DbUtil_1.DbUtil.endPoolAsync();
            process.exit(0);
        }
        catch (error) {
            console.error('\n❌ Migration failed:');
            console.error(error.message || 'An unexpected error occurred.');
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=migrateUp.js.map