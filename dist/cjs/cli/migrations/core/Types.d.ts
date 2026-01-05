import type { DbUtil } from '../../../core/database/DbUtil';
/**
 * Migration context passed to migration functions
 * @deprecated No longer used - migrations now use SQL files instead of TypeScript files
 */
export interface MigrationContext {
    /** DbUtil instance with all static methods */
    db: typeof DbUtil;
    /** Optional logger function for migration output */
    logger?: (msg: string) => void;
}
/**
 * Migration function signature
 * @deprecated No longer used - migrations now use SQL files instead of TypeScript files
 */
export type MigrationFunction = (ctx: MigrationContext) => Promise<void>;
/**
 * Migration file metadata
 */
export interface MigrationFile {
    /** Migration name (filename without extension) */
    name: string;
    /** Full file path */
    path: string;
    /** Timestamp from filename */
    timestamp: string;
}
/**
 * Migration record in database
 */
export interface MigrationRecord {
    id: number;
    name: string;
    applied_at: Date;
    duration_ms: number;
}
