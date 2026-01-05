"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLVersion = void 0;
exports.getSQLVersion = getSQLVersion;
exports.getDatabase = getDatabase;
exports.transformTypeName = transformTypeName;
exports.transformColumnName = transformColumnName;
exports.formatNameWithCase = formatNameWithCase;
exports.toCamelCase = toCamelCase;
const lodash_1 = __importDefault(require("lodash"));
const schemaMysql_1 = require("./schemaMysql");
var SQLVersion;
(function (SQLVersion) {
    SQLVersion[SQLVersion["MYSQL"] = 2] = "MYSQL";
    SQLVersion[SQLVersion["UNKNOWN"] = 3] = "UNKNOWN";
})(SQLVersion || (exports.SQLVersion = SQLVersion = {}));
function getSQLVersion(connection) {
    if (/^mysql:\/\//i.test(connection)) {
        return SQLVersion.MYSQL;
    }
    else {
        return SQLVersion.UNKNOWN;
    }
}
function getDatabase(connection) {
    switch (getSQLVersion(connection)) {
        case SQLVersion.MYSQL:
            return new schemaMysql_1.MysqlDatabase(connection);
        default:
            throw new Error(`SQL version unsupported in connection: ${connection}`);
    }
}
function transformTypeName(typename) {
    return typename;
}
function transformColumnName(columnName) {
    return columnName;
}
function formatNameWithCase(name) {
    return lodash_1.default.camelCase(name);
}
/**
 * Convert a string to CamelCase (First letter uppercase)
 */
function toCamelCase(input) {
    const camelCased = lodash_1.default.camelCase(input);
    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
}
//# sourceMappingURL=common.js.map