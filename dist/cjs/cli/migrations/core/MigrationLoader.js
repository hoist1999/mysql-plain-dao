"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMigrationFiles = loadMigrationFiles;
exports.loadMigrationSQL = loadMigrationSQL;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('Migrations');
/**
 * Load migration files from directory
 */
async function loadMigrationFiles(dir) {
    try {
        const files = await (0, promises_1.readdir)(dir);
        const migrationFiles = [];
        for (const file of files) {
            // Only process .sql files
            if ((0, path_1.extname)(file) !== '.sql') {
                continue;
            }
            const name = (0, path_1.basename)(file, '.sql');
            // Validate naming pattern: timestamp_name
            if (!/^\d{8}_\d{6}_/.test(name)) {
                debug(`Skipping file with invalid naming pattern: ${file}`);
                continue;
            }
            const timestamp = name.substring(0, 15); // YYYYMMDD_HHmmss
            const fullPath = (0, path_1.join)(dir, file);
            // Check if file exists and is readable
            try {
                await (0, promises_1.stat)(fullPath);
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
async function loadMigrationSQL(filePath) {
    try {
        const sql = await (0, promises_1.readFile)(filePath, 'utf-8');
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