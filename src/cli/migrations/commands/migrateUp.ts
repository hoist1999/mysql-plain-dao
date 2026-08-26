import { Command, Option } from 'commander';
import { DbUtil } from '../../../core/database/DbUtil';
import { runMigrations } from '../core/MigrationRunner';
import { parseConnectionString } from '../utils/connectionParser';
import { getDbConfigFromEnv } from '../../../core/database/DbConfigLoader';
import { resolve } from 'path';

export function createMigrateUpCommand(commandName: string = 'migrate-up'): Command {
  const command = new Command(commandName);

  command
    .description('Run pending migrations')
    .addOption(
      new Option('-c, --conn <connection>', 'Database connection string (MySQL). If not provided, will use DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE from .env file')
        .env('DAO_CONN')
    )
    .addOption(
      new Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations')
    )
    .addOption(
      new Option('--to <name>', 'Run migrations up to and including this one')
    )
    .addOption(
      new Option('--dry-run', 'Show what would be executed without running')
    )
    .action(async (options) => {
      try {
        // Initialize database connection
        // If connection string is provided, use it; otherwise, try to load from .env file
        let dbConfig;
        if (options.conn) {
          // Use connection string if provided
          dbConfig = parseConnectionString(options.conn);
        } else {
          // Try to load from environment variables (DB_HOST, DB_USER, etc.)
          try {
            dbConfig = getDbConfigFromEnv();
          } catch (error: any) {
            throw new Error(
              'Database connection not provided. Please either:\n' +
              '  1. Use -c/--conn option with connection string: mysql://user:pass@host:port/database\n' +
              '  2. Or set DAO_CONN environment variable\n' +
              '  3. Or set DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE in .env file\n' +
              `Error: ${error.message}`
            );
          }
        }
        
        DbUtil.initialize(dbConfig);

        // Resolve migrations directory
        const migrationsDir = resolve(process.cwd(), options.migrationsDir);

        // Run migrations
        await runMigrations(migrationsDir, {
          to: options.to,
          dryRun: options.dryRun,
          dbConfig: dbConfig,
        });

        // Clean up
        await DbUtil.endPoolAsync();
        process.exit(0);
      } catch (error: any) {
        console.error('\n❌ Migration failed:');
        console.error(error.message || 'An unexpected error occurred.');
        process.exit(1);
      }
    });

  return command;
}

