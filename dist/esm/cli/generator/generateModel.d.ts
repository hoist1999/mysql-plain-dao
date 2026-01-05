import type { CliOptions, Database } from './Types';
export declare function generateAndWriteModels(db: Database, tables: string[], schema: string, options: CliOptions): Promise<void>;
export declare function buildHeader(db: Database, tables: string[], schema: string | null, options: CliOptions): string;
export declare function typescriptOfTable(db: Database | string, table: string, schema: string, options: CliOptions): Promise<string>;
export declare function formatTypeScript(content: string): Promise<string>;
export declare function generateEnumType(enumObject: any, options: CliOptions): string;
export declare function normalizeName(name: string, options: CliOptions): string;
