"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMigrateUpCommand = createMigrateUpCommand;
const commander_1 = require("commander");
const DbUtil_1 = require("../../../core/database/DbUtil");
const MigrationRunner_1 = require("../core/MigrationRunner");
const connectionParser_1 = require("../utils/connectionParser");
const path_1 = require("path");
function createMigrateUpCommand() {
    const command = new commander_1.Command('up');
    command
        .description('Run pending migrations')
        .addOption(new commander_1.Option('-c, --conn <connection>', 'Database connection string (MySQL)')
        .env('DAO_CONN')
        .makeOptionMandatory())
        .addOption(new commander_1.Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations'))
        .addOption(new commander_1.Option('--to <name>', 'Run migrations up to and including this one'))
        .addOption(new commander_1.Option('--dry-run', 'Show what would be executed without running'))
        .action(async (options) => {
        try {
            // Initialize database connection
            const dbConfig = (0, connectionParser_1.parseConnectionString)(options.conn);
            DbUtil_1.DbUtil.initialize(dbConfig);
            // Resolve migrations directory
            const migrationsDir = (0, path_1.resolve)(process.cwd(), options.migrationsDir);
            // Run migrations
            await (0, MigrationRunner_1.runMigrations)(migrationsDir, {
                to: options.to,
                dryRun: options.dryRun,
            });
            // Clean up
            await DbUtil_1.DbUtil.endPoolAsync();
            process.exit(0);
        }
        catch (error) {
            console.error('\n❌ Migration failed:');
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
//# sourceMappingURL=migrateUp.js.map