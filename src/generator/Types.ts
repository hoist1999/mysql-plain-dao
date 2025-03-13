export interface ColumnDefinition {
    udtName: string,
    nullable: boolean,
    tsType?: string,
    isPrimaryKey: boolean,
    isUnique: boolean,
    characterMaximumLength?: number,
    comment?: string
}

export interface TableDefinition {
    [columnName: string]: ColumnDefinition
}

export interface TableMetadata {
    comment?: string;
    columns: TableDefinition;
}

export interface Database {
    connectionString: string
    query(queryString: string): Promise<Object[]>
    getDefaultSchema(): string
    getEnumTypes(schema?: string, tableName?: string): any
    getTableDefinition(tableName: string, tableSchema: string): Promise<TableMetadata>
    getTableTypes(tableName: string, tableSchema: string, options: CliOptions): Promise<TableDefinition>
    getSchemaTables(schemaName: string): Promise<string[]>
    getPrimaryKey(schema: string, table: string): Promise<{ dataType: string } | null>
    close(): Promise<void>
}


export type GenerateType = 'model' | 'dao' | 'all';

export type CliOptions = {
    writeHeader?: boolean, // write schemats description header
    generateType?: GenerateType
    modelDir?: string
    daoDir?: string
    outputDir?: string
}