import { Command, Option } from 'commander';
import { DbUtil } from '../../../core/database/DbUtil';
import { getMigrationStatus } from '../core/MigrationRunner';
import { parseConnectionString } from '../utils/connectionParser';
import { resolve } from 'path';

export function createMigrateStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Show migration status')
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
    .action(async (options) => {
      try {
        // Initialize database connection
        const dbConfig = parseConnectionString(options.conn);
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
        } else {
          for (const file of status.files) {
            if (status.applied.has(file.name)) {
              // Find applied migration record for details
              const appliedMigrations = await DbUtil.executeGetListAsync<{
                applied_at: Date;
                duration_ms: number;
              }>(
                'SELECT applied_at, duration_ms FROM migrations WHERE name = ?',
                [file.name]
              );
              
              if (appliedMigrations.length > 0) {
                const record = appliedMigrations[0];
                const appliedAt = new Date(record.applied_at).toLocaleString();
                console.log(`✅ ${file.name} (applied at ${appliedAt}, duration: ${record.duration_ms}ms)`);
              } else {
                console.log(`✅ ${file.name}`);
              }
            } else {
              console.log(`⏳ ${file.name} (pending)`);
            }
          }
        }

        console.log('');
        console.log(`Total: ${status.files.length} migration(s), ${status.applied.size} applied, ${status.pending.length} pending`);

        // Clean up
        await DbUtil.endPoolAsync();
        process.exit(0);
      } catch (error: any) {
        console.error('\n❌ Failed to get migration status:');
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

