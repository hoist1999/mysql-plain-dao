import _ from 'lodash';
import { MysqlDatabase } from './schemaMysql';
export var SQLVersion;
(function (SQLVersion) {
    SQLVersion[SQLVersion["MYSQL"] = 2] = "MYSQL";
    SQLVersion[SQLVersion["UNKNOWN"] = 3] = "UNKNOWN";
})(SQLVersion || (SQLVersion = {}));
export function getSQLVersion(connection) {
    if (/^mysql:\/\//i.test(connection)) {
        return SQLVersion.MYSQL;
    }
    else {
        return SQLVersion.UNKNOWN;
    }
}
export function getDatabase(connection) {
    switch (getSQLVersion(connection)) {
        case SQLVersion.MYSQL:
            return new MysqlDatabase(connection);
        default:
            throw new Error(`SQL version unsupported in connection: ${connection}`);
    }
}
export function transformTypeName(typename) {
    return typename;
}
export function transformColumnName(columnName) {
    return columnName;
}
export function formatNameWithCase(name) {
    return _.camelCase(name);
}
/**
 * Convert a string to CamelCase (First letter uppercase)
 */
export function toCamelCase(input) {
    const camelCased = _.camelCase(input);
    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
}
//# sourceMappingURL=common.js.map