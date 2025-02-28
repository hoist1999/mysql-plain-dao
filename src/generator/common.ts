import _ from 'lodash'
import { CliOptions, Database, TableDefinition } from './Types'
import { MysqlDatabase } from './schemaMysql'

export enum SQLVersion {
    MYSQL = 2,
    UNKNOWN = 3
}

export function getSQLVersion(connection: string): SQLVersion {
    if (/^mysql:\/\//i.test(connection)) {
        return SQLVersion.MYSQL
    } else {
        return SQLVersion.UNKNOWN
    }
}

export function getDatabase(connection: string): Database {
    switch (getSQLVersion(connection)) {
        case SQLVersion.MYSQL:
            return new MysqlDatabase(connection)
        default:
            throw new Error(`SQL version unsupported in connection: ${connection}`)
    }
}

export function transformTypeName(typename: string) {
    return typename;
}

export function transformColumnName(columnName: string) {
    return columnName;
}

function nameIsReservedKeyword(name: string): boolean {
    const reservedKeywords = [
        'string',
        'number',
        'package'
    ]
    return reservedKeywords.indexOf(name) !== -1
}

function normalizeName(name: string, options: CliOptions): string {
    if (nameIsReservedKeyword(name)) {
        return name + '_'
    } else {
        return name
    }
}

export function generateTableInterface(tableNameRaw: string, tableDefinition: TableDefinition, options: CliOptions) {
    return ''
    // const tableName = options.transformTypeName(tableNameRaw)
    // let members = ''
    // Object.keys(tableDefinition).map(c => options.transformColumnName(c)).forEach((columnName) => {
    //     members += `${columnName}: ${tableName}Fields.${normalizeName(columnName, options)};\n`
    // })
    // return `
    //     export interface ${normalizeName(tableName, options)} {
    //     ${members}
    //     }
    // `
}

export function generateEnumType(enumObject: any, options: CliOptions) {
    let enumString = ''
    for (let enumNameRaw in enumObject) {
        const enumName = transformTypeName(enumNameRaw)
        enumString += `export type ${enumName} = `
        enumString += enumObject[enumNameRaw].map((v: string) => `'${v}'`).join(' | ')
        enumString += ';\n'
    }
    return enumString
}

export function generateTableTypes(tableNameRaw: string, tableDefinition: TableDefinition, options: CliOptions) {
    const tableName = formatNameWithCase(tableNameRaw);
    let fields = '';
    
    Object.entries(tableDefinition).forEach(([columnNameRaw, column]) => {
        const columnName = transformColumnName(columnNameRaw);
        const normalizedName = normalizeName(columnName, options);
        const type = column.tsType || 'any';
        const nullable = column.nullable ? ' | null' : '';
        const optionalModifier = column.nullable ? '?' : '';

        fields += `    ${normalizedName}${optionalModifier}: ${type}${nullable};\n`;
    });

    return `
export interface ${tableName} {
${fields}}
`;
}

export function formatNameWithCase(name: string): string {
    // Capitalize first letter, leave rest unchanged
    return name.charAt(0).toUpperCase() + name.slice(1);
}

