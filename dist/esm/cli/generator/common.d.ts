import type { Database } from './Types';
export declare enum SQLVersion {
    MYSQL = 2,
    UNKNOWN = 3
}
export declare function getSQLVersion(connection: string): SQLVersion;
export declare function getDatabase(connection: string): Database;
export declare function transformTypeName(typename: string): string;
export declare function transformColumnName(columnName: string): string;
export declare function formatNameWithCase(name: string): string;
/**
 * Convert a string to CamelCase (First letter uppercase)
 */
export declare function toCamelCase(input: string): string;
