"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlUtil = void 0;
const mysql2_1 = require("mysql2");
const Types_1 = require("../types/Types");
/** Utility class for constructing SQL statements
 */
class SqlUtil {
    static like(field, condition_value) {
        return (0, mysql2_1.format)(`${(0, mysql2_1.escapeId)(field)} LIKE ?`, ["%" + condition_value + "%"]);
    }
    static equal(field, condition_value) {
        return (0, mysql2_1.format)(`${(0, mysql2_1.escapeId)(field)} = ?`, [condition_value]);
    }
    static not_equal(field, condition_value) {
        return (0, mysql2_1.format)(`${(0, mysql2_1.escapeId)(field)} != ?`, [condition_value]);
    }
    /**
     * Get LIMIT clause for pagination
     * @param current Current page number (starting from 1)
     * @param pageSize Number of items per page
     */
    static limitPager(current, pageSize) {
        const currentInt = typeof current === "string" ? parseInt(current) : current;
        const pageSizeInt = typeof pageSize === "string" ? parseInt(pageSize) : pageSize;
        let start = pageSizeInt * (currentInt - 1);
        let pager_sql = (0, mysql2_1.format)(` LIMIT ?,?`, [start, pageSizeInt]);
        return pager_sql;
    }
    /**
     * Get LIMIT clause
     * @param start Starting row index (starting from 0)
     * @param length Number of rows to return
     */
    static limit(start, length) {
        const startInt = typeof start === "string" ? parseInt(start) : start;
        const lengthInt = typeof length === "string" ? parseInt(length) : length;
        let pager_sql = (0, mysql2_1.format)(` LIMIT ?,?`, [startInt, lengthInt]);
        return pager_sql;
    }
    // Get ORDER BY clause
    static orderBy(conditions) {
        if (typeof conditions === "string") {
            return conditions;
        }
        else {
            const { order = Types_1.OrderBy.ASC, field = "" } = conditions;
            let order_sql = "";
            if (order && field) {
                order_sql = ` ORDER BY ${(0, mysql2_1.escapeId)(field)} `;
                if (order === Types_1.OrderBy.DESC) {
                    order_sql += " DESC ";
                }
                else if (order === Types_1.OrderBy.ASC) {
                    order_sql += " ASC ";
                }
            }
            return order_sql;
        }
    }
}
exports.SqlUtil = SqlUtil;
//# sourceMappingURL=SqlUtil.js.map