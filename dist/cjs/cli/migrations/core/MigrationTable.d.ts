/**
 * Migration record type
 */
export interface MigrationRecord {
    id: number;
    name: string;
    applied_at: Date;
    duration_ms: number;
}
/**
 * Create the migrations table if it doesn't exist
 * Throws error if table exists but has incorrect structure
 */
export declare function ensureMigrationsTable(): Promise<void>;
/**
 * Get all applied migrations from database
 */
export declare function getAppliedMigrations(): Promise<MigrationRecord[]>;
/**
 * Check if a migration has been applied
 */
export declare function isMigrationApplied(name: string): Promise<boolean>;
/**
 * Record a migration as applied
 */
export declare function recordMigrationApplied(name: string, appliedAt: Date, durationMs: number): Promise<void>;
