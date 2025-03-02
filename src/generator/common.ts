import _ from 'lodash'
import type { Database } from './Types.js'
import { MysqlDatabase } from './schemaMysql.js'

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

export function formatNameWithCase(name: string): string {
    return _.camelCase(name);
}

/**
 * Convert a string to CamelCase (First letter uppercase)
 */
export function toCamelCase(input: string): string {
    const camelCased = _.camelCase(input);
    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
}
