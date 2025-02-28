export interface ColumnDefinition {
    udtName: string,
    nullable: boolean,
    tsType?: string
}

export interface TableDefinition {
    [columnName: string]: ColumnDefinition
}

export interface Database {
    connectionString: string
    query(queryString: string): Promise<Object[]>
    getDefaultSchema(): string
    getEnumTypes(schema?: string): any
    getTableDefinition(tableName: string, tableSchema: string): Promise<TableDefinition>
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