import type { CliOptions, Database, TableDefinition, TableMetadata } from './Types';
export declare class MysqlDatabase implements Database {
    connectionString: string;
    private db;
    private defaultSchema;
    constructor(connectionString: string);
    private static mapTableDefinitionToType;
    private static parseMysqlEnumeration;
    private static getEnumNameFromColumn;
    query(queryString: string): Promise<any[]>;
    getEnumTypes(schema?: string, tableName?: string): Promise<any>;
    getTableDefinition(tableName: string, tableSchema: string): Promise<TableMetadata>;
    getTableTypes(tableName: string, tableSchema: string, options: CliOptions): Promise<TableDefinition>;
    getSchemaTables(schemaName: string): Promise<string[]>;
    queryAsync(queryString: string, escapedValues?: Array<string>): Promise<any[]>;
    getDefaultSchema(): string;
    getPrimaryKey(schema: string, table: string): Promise<{
        dataType: string;
    } | null>;
    close(): Promise<void>;
}
