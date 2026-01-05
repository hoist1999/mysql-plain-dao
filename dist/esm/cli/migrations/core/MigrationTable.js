import { DbUtil } from '../../../core/database/DbUtil';
import debug_func from 'debug';
const debug = debug_func('Migrations');
/**
 * Check if migrations table exists and has correct structure
 */
async function checkMigrationsTableStructure() {
    try {
        // Check if table exists
        const [tables] = await DbUtil.queryAsync("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'migrations'");
        const tablesArray = Array.isArray(tables) ? tables : [];
        if (tablesArray.length === 0) {
            return { exists: false, valid: false };
        }
        // Check table structure
        const [columns] = await DbUtil.queryAsync(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY 
       FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'migrations'
       ORDER BY ORDINAL_POSITION`);
        const columnsArray = Array.isArray(columns) ? columns : [];
        if (columnsArray.length === 0) {
            return { exists: true, valid: false };
        }
        // Expected columns: id, name, applied_at, duration_ms
        const expectedColumns = ['id', 'name', 'applied_at', 'duration_ms'];
        const actualColumns = columnsArray.map((c) => c.COLUMN_NAME);
        // Check if all required columns exist
        const hasAllColumns = expectedColumns.every(col => actualColumns.includes(col));
        // Check if id is primary key
        const idColumn = columnsArray.find((c) => c.COLUMN_NAME === 'id');
        const hasPrimaryKey = idColumn?.COLUMN_KEY === 'PRI';
        // Check if name has unique constraint
        const [indexes] = await DbUtil.queryAsync(`SHOW INDEX FROM migrations WHERE Column_name = 'name'`);
        const indexesArray = Array.isArray(indexes) ? indexes : [];
        const hasUniqueName = indexesArray.some((idx) => idx.Non_unique === 0);
        const valid = hasAllColumns && hasPrimaryKey && hasUniqueName;
        return { exists: true, valid };
    }
    catch (error) {
        // If we can't check, assume it doesn't exist
        return { exists: false, valid: false };
    }
}
/**
 * Create the migrations table if it doesn't exist
 * Throws error if table exists but has incorrect structure
 */
export async function ensureMigrationsTable() {
    const structureCheck = await checkMigrationsTableStructure();
    if (structureCheck.exists && !structureCheck.valid) {
        throw new Error('Migrations table exists but has incorrect structure. ' +
            'Please manually fix the table structure or drop and recreate it. ' +
            'Expected structure: id (BIGINT UNSIGNED PRIMARY KEY), name (VARCHAR(255) UNIQUE), ' +
            'applied_at (DATETIME), duration_ms (INT)');
    }
    if (structureCheck.exists && structureCheck.valid) {
        debug('Migrations table already exists and is valid');
        return;
    }
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL,
      duration_ms INT NOT NULL,
      UNIQUE KEY uk_migrations_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
    try {
        await DbUtil.queryAsync(createTableSQL);
        debug('Migrations table created');
    }
    catch (error) {
        throw new Error(`Failed to create migrations table: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get all applied migrations from database
 */
export async function getAppliedMigrations() {
    const sql = 'SELECT id, name, applied_at, duration_ms FROM migrations ORDER BY name ASC';
    const [rows] = await DbUtil.queryAsync(sql);
    return (Array.isArray(rows) ? rows : []);
}
/**
 * Check if a migration has been applied
 */
export async function isMigrationApplied(name) {
    const sql = 'SELECT COUNT(*) as count FROM migrations WHERE name = ?';
    const [rows] = await DbUtil.queryAsync(sql, [name]);
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return !!(result && result.count > 0);
}
/**
 * Record a migration as applied
 */
export async function recordMigrationApplied(name, appliedAt, durationMs) {
    const sql = 'INSERT INTO migrations (name, applied_at, duration_ms) VALUES (?, ?, ?)';
    await DbUtil.executeAsync(sql, [name, appliedAt, durationMs]);
    debug(`Recorded migration: ${name} (${durationMs}ms)`);
}
//# sourceMappingURL=MigrationTable.js.map