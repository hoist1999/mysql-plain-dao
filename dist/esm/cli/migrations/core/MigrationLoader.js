import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import debug_func from 'debug';
const debug = debug_func('Migrations');
/**
 * Load migration files from directory
 */
export async function loadMigrationFiles(dir) {
    try {
        const files = await readdir(dir);
        const migrationFiles = [];
        for (const file of files) {
            // Only process .sql files
            if (extname(file) !== '.sql') {
                continue;
            }
            const name = basename(file, '.sql');
            // Validate naming pattern: timestamp_name
            if (!/^\d{8}_\d{6}_/.test(name)) {
                debug(`Skipping file with invalid naming pattern: ${file}`);
                continue;
            }
            const timestamp = name.substring(0, 15); // YYYYMMDD_HHmmss
            const fullPath = join(dir, file);
            // Check if file exists and is readable
            try {
                await stat(fullPath);
            }
            catch {
                debug(`Skipping unreadable file: ${file}`);
                continue;
            }
            migrationFiles.push({
                name,
                path: fullPath,
                timestamp,
            });
        }
        // Sort by name (which includes timestamp)
        migrationFiles.sort((a, b) => a.name.localeCompare(b.name));
        debug(`Loaded ${migrationFiles.length} migration files from ${dir}`);
        return migrationFiles;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Migrations directory not found: ${dir}\n` +
                `Please create the directory or specify a different path with --migrations-dir`);
        }
        throw error;
    }
}
/**
 * Load SQL content from a migration file
 */
export async function loadMigrationSQL(filePath) {
    try {
        const sql = await readFile(filePath, 'utf-8');
        return sql.trim();
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to read migration file ${filePath}: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=MigrationLoader.js.map