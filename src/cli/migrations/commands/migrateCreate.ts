import { Command, Option } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

const MIGRATION_TEMPLATE = `-- Your migration SQL here
-- Example:
-- CREATE TABLE users (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   name VARCHAR(255) NOT NULL,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
`;

export function createMigrateCreateCommand(commandName: string = 'migrate-create'): Command {
  const command = new Command(commandName);

  command
    .description('Create a new migration file')
    .argument('<name>', 'Migration name (e.g., add_users_table)')
    .addOption(
      new Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations')
    )
    .action(async (name: string, options) => {
      try {
        // Validate name
        if (!/^[a-z0-9_]+$/i.test(name)) {
          throw new Error('Migration name can only contain letters, numbers, and underscores');
        }

        // Resolve migrations directory
        const migrationsDir = resolve(process.cwd(), options.migrationsDir);

        // Create directory if it doesn't exist
        if (!existsSync(migrationsDir)) {
          await mkdir(migrationsDir, { recursive: true });
        }

        // Generate timestamp
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

        // Generate filename
        const filename = `${timestamp}_${name}.sql`;
        const filepath = join(migrationsDir, filename);

        // Write file
        await writeFile(filepath, MIGRATION_TEMPLATE, 'utf-8');

        console.log(`✅ Created migration: ${filepath}`);
        process.exit(0);
      } catch (error: any) {
        console.error('\n❌ Failed to create migration:');
        console.error(error.message || 'An unexpected error occurred.');
        process.exit(1);
      }
    });

  return command;
}

