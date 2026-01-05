import { Command, Option } from 'commander';
import { DbUtil } from '../../../core/database/DbUtil';
import { runMigrations } from '../core/MigrationRunner';
import { parseConnectionString } from '../utils/connectionParser';
import { resolve } from 'path';

export function createMigrateUpCommand(): Command {
  const command = new Command('up');

  command
    .description('Run pending migrations')
    .addOption(
      new Option('-c, --conn <connection>', 'Database connection string (MySQL)')
        .env('DAO_CONN')
        .makeOptionMandatory()
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
        const dbConfig = parseConnectionString(options.conn);
        DbUtil.initialize(dbConfig);

        // Resolve migrations directory
        const migrationsDir = resolve(process.cwd(), options.migrationsDir);

        // Run migrations
        await runMigrations(migrationsDir, {
          to: options.to,
          dryRun: options.dryRun,
        });

        // Clean up
        await DbUtil.endPoolAsync();
        process.exit(0);
      } catch (error: any) {
        console.error('\n❌ Migration failed:');
        if (error.message) {
          console.error(error.message);
        } else {
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

