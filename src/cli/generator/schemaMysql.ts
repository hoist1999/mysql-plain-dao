import debug from 'debug'
import _ from 'lodash'
import mysql from 'mysql2/promise'
import { parse as urlParse } from 'url'
import { transformTypeName } from './common'
import type { CliOptions, Database, TableDefinition, TableMetadata } from './Types'

export class MysqlDatabase implements Database {
    private db: mysql.Connection | null = null
    private defaultSchema: string

    constructor(public connectionString: string) {
        this.connectionString = connectionString;
        let url = urlParse(connectionString, true)
        if (url && url.pathname) {
            let database = url.pathname.slice(1)
            this.defaultSchema = database
        } else {
            this.defaultSchema = 'public'
        }
    }

    // uses the type mappings from https://github.com/mysqljs/ where sensible
    private static mapTableDefinitionToType(tableDefinition: TableDefinition, customTypes: string[], options: CliOptions): TableDefinition {
        if (!options) throw new Error()
        return _.mapValues(tableDefinition, column => {
            switch (column.udtName) {
                case 'char':
                case 'varchar':
                case 'text':
                case 'tinytext':
                case 'mediumtext':
                case 'longtext':
                case 'time':
                case 'geometry':
                case 'set':
                case 'enum':
                    // keep set and enum defaulted to string if custom type not mapped
                    column.tsType = 'string'
                    return column
                case 'integer':
                case 'int':
                case 'smallint':
                case 'mediumint':
                case 'bigint':
                case 'double':
                case 'decimal':
                case 'numeric':
                case 'float':
                case 'year':
                    column.tsType = 'number'
                    return column
                case 'tinyint':
                    column.tsType = 'boolean'
                    return column
                case 'json':
                    column.tsType = 'Object'
                    return column
                case 'date':
                case 'datetime':
                case 'timestamp':
                    column.tsType = 'Date'
                    return column
                case 'tinyblob':
                case 'mediumblob':
                case 'longblob':
                case 'blob':
                case 'binary':
                case 'varbinary':
                case 'bit':
                    column.tsType = 'Buffer'
                    return column
                default:
                    if (customTypes.indexOf(column.udtName) !== -1) {
                        column.tsType = transformTypeName(column.udtName)
                        return column
                    } else {
                        debug(`Type [${column.udtName}] has been mapped to [any] because no specific type has been found.`)
                        column.tsType = 'any'
                        return column
                    }
            }
        })
    }

    private static parseMysqlEnumeration(mysqlEnum: string): string[] {
        return mysqlEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`)
    }

    private static getEnumNameFromColumn(tableName: string, dataType: string, columnName: string): string {
        return `enum_${tableName}_${columnName}`
    }

    public query(queryString: string) {
        return this.queryAsync(queryString)
    }

    public async getEnumTypes(schema?: string, tableName?: string) {
        let enums: any = {}
        let whereClause = 'WHERE data_type IN (\'enum\', \'set\')'
        let params: string[] = []

        if (schema) {
            whereClause += ' AND table_schema = ?'
            params.push(schema)
        }

        if (tableName) {
            whereClause += ' AND table_name = ?'
            params.push(tableName)
        }

        const rawEnumRecords = await this.queryAsync(
            'SELECT table_name, column_name, column_type, data_type ' +
            'FROM information_schema.columns ' +
            whereClause,
            params
        )

        rawEnumRecords.forEach((enumItem: {
            table_name: string,
            column_name: string,
            column_type: string,
            data_type: string
        }) => {
            const enumName = MysqlDatabase.getEnumNameFromColumn(
                enumItem.table_name,
                enumItem.data_type,
                enumItem.column_name
            )
            const enumValues = MysqlDatabase.parseMysqlEnumeration(enumItem.column_type)
            enums[enumName] = enumValues
        })
        return enums
    }

    public async getTableDefinition(tableName: string, tableSchema: string): Promise<TableMetadata> {
        // First get the table comment
        const tableInfo = await this.queryAsync(
            `SELECT table_comment 
             FROM information_schema.tables 
             WHERE table_schema = ? AND table_name = ?`,
            [tableSchema, tableName]
        );

        // Get column information including comments
        const tableColumns = await this.queryAsync(
            `SELECT 
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_key,
                c.character_maximum_length,
                c.column_comment,
                CASE 
                    WHEN tc.constraint_type = 'UNIQUE' OR c.column_key = 'UNI' THEN 1 
                    ELSE 0 
                END as is_unique
            FROM information_schema.columns c
            LEFT JOIN information_schema.key_column_usage kcu
                ON c.table_schema = kcu.table_schema
                AND c.table_name = kcu.table_name
                AND c.column_name = kcu.column_name
            LEFT JOIN information_schema.table_constraints tc
                ON kcu.constraint_name = tc.constraint_name
                AND kcu.table_schema = tc.table_schema
                AND kcu.table_name = tc.table_name
            WHERE c.table_name = ? and c.table_schema = ?`,
            [tableName, tableSchema]
        );

        let tableDefinition: TableDefinition = {};

        tableColumns.forEach((schemaItem: {
            column_name: string;
            data_type: string;
            is_nullable: string;
            column_key: string;
            character_maximum_length: number;
            is_unique: number;
            column_comment: string;
        }) => {
            const columnName = schemaItem.column_name;
            const dataType = schemaItem.data_type;

            tableDefinition[columnName] = {
                udtName: /^(enum|set)$/i.test(dataType)
                    ? MysqlDatabase.getEnumNameFromColumn(
                        tableName,
                        dataType,
                        columnName
                    )
                    : dataType,
                nullable: schemaItem.is_nullable === 'YES',
                isPrimaryKey: schemaItem.column_key === 'PRI',
                isUnique: schemaItem.is_unique === 1,
                characterMaximumLength: schemaItem.character_maximum_length,
                comment: schemaItem.column_comment || undefined
            };
        });

        return {
            comment: tableInfo[0]?.table_comment || undefined,
            columns: tableDefinition
        };
    }

    public async getTableTypes(tableName: string, tableSchema: string, options: CliOptions) {
        const enumTypes: any = await this.getEnumTypes(tableSchema)
        let customTypes = _.keys(enumTypes)
        const tableMetadata = await this.getTableDefinition(tableName, tableSchema)
        return MysqlDatabase.mapTableDefinitionToType(tableMetadata.columns, customTypes, options)
    }

    public async getSchemaTables(schemaName: string): Promise<string[]> {
        const schemaTables = await this.queryAsync(
            'SELECT table_name ' +
            'FROM information_schema.columns ' +
            'WHERE table_schema = ? ' +
            'GROUP BY table_name',
            [schemaName]
        )
        return schemaTables.map((schemaItem: { table_name: string }) => schemaItem.table_name)
    }

    public async queryAsync(queryString: string, escapedValues?: Array<string>): Promise<any[]> {
        try {
            if (!this.db) {
                this.db = await mysql.createConnection(this.connectionString)
            }
            const [results] = await this.db.query(queryString, escapedValues)
            return results as any[]
        } catch (error: any) {
            // Handle specific MySQL errors
            if (error.code === 'ER_BAD_DB_ERROR') {
                throw new Error(`Database "${this.defaultSchema}" not found.\n` +
                    `This tool generates code from existing database. Please:\n` +
                    `1. Verify your connection string\n` +
                    `2. Ensure the database exists`);
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error(`Could not connect to MySQL server. Please check:\n` +
                    `1. MySQL server is running\n` +
                    `2. Connection details are correct (host, port)`);
            } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                throw new Error(`Access denied. Please verify your username and password.`);
            }
            throw error;
        }
    }

    public getDefaultSchema(): string {
        return this.defaultSchema
    }

    public async getPrimaryKey(schema: string, table: string): Promise<{ dataType: string } | null> {
        const result = await this.queryAsync(
            'SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS ' +
            'WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_KEY = "PRI"',
            [schema, table]
        );
        return result[0] ? { dataType: result[0].DATA_TYPE } : null;
    }

    public async close(): Promise<void> {
        if (this.db) {
            await this.db.end();
            this.db = null;
        }
    }
}
