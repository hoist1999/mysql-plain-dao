import type { CliOptions, Database } from './Types';
export declare function generateAndWriteDaos(db: Database, tables: string[], schema: string, options: CliOptions): Promise<void>;
