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

export function transformTypeName(camelCase: Boolean, typename: string) {
    return camelCase ? _.upperFirst(_.camelCase(typename)) : typename
}


export function transformColumnName(camelCase: Boolean, columnName: string) {
    return columnName;
    //return this.options.camelCase ? camelCase(columnName) : columnName
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
        const enumName = transformTypeName(options.camelCase, enumNameRaw)
        enumString += `export type ${enumName} = `
        enumString += enumObject[enumNameRaw].map((v: string) => `'${v}'`).join(' | ')
        enumString += ';\n'
    }
    return enumString
}

export function generateTableTypes(tableNameRaw: string, tableDefinition: TableDefinition, options: CliOptions) {
    const tableName = transformTypeName(options.camelCase, tableNameRaw)
    let fields = ''
    Object.keys(tableDefinition).forEach((columnNameRaw) => {
        let type = tableDefinition[columnNameRaw].tsType
        let nullable = tableDefinition[columnNameRaw].nullable ? '| null' : ''
        let optionalProperty = tableDefinition[columnNameRaw].nullable ? '?' : ''

        const columnName = transformColumnName(options.camelCase, columnNameRaw)
        fields += `${normalizeName(columnName, options)} ${optionalProperty}: ${type}${nullable};\n`
    })

    return `
        export interface ${tableName} {
        ${fields}
        }
    `
}

