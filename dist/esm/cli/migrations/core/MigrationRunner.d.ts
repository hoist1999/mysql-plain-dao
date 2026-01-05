import type { MigrationFile } from './Types';
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
export declare function runMigrations(migrationsDir: string, options?: {
    to?: string;
    dryRun?: boolean;
}): Promise<void>;
/**
 * Get migration status
 *
 * @param migrationsDir - Path to the directory containing migration SQL files
 * @returns Promise that resolves to an object containing:
 *   - files: Array of all migration files found in the directory
 *   - applied: Set of migration names that have been applied to the database
 *   - pending: Array of migration files that have not been applied yet
 */
export declare function getMigrationStatus(migrationsDir: string): Promise<{
    files: MigrationFile[];
    applied: Set<string>;
    pending: MigrationFile[];
}>;
