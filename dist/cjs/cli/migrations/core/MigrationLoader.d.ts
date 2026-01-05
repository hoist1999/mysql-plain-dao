import type { MigrationFile } from './Types';
/**
 * Load migration files from directory
 */
export declare function loadMigrationFiles(dir: string): Promise<MigrationFile[]>;
/**
 * Load SQL content from a migration file
 */
export declare function loadMigrationSQL(filePath: string): Promise<string>;
