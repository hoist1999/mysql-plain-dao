import { escapeId, format } from "mysql2";
import { OrderBy } from "../types/Types";
/** Utility class for constructing SQL statements
 */
export class SqlUtil {
    static like(field, condition_value) {
        return format(`${escapeId(field)} LIKE ?`, ["%" + condition_value + "%"]);
    }
    static equal(field, condition_value) {
        return format(`${escapeId(field)} = ?`, [condition_value]);
    }
    static not_equal(field, condition_value) {
        return format(`${escapeId(field)} != ?`, [condition_value]);
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
        let pager_sql = format(` LIMIT ?,?`, [start, pageSizeInt]);
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
        let pager_sql = format(` LIMIT ?,?`, [startInt, lengthInt]);
        return pager_sql;
    }
    // Get ORDER BY clause
    static orderBy(conditions) {
        if (typeof conditions === "string") {
            return conditions;
        }
        else {
            const { order = OrderBy.ASC, field = "" } = conditions;
            let order_sql = "";
            if (order && field) {
                order_sql = ` ORDER BY ${escapeId(field)} `;
                if (order === OrderBy.DESC) {
                    order_sql += " DESC ";
                }
                else if (order === OrderBy.ASC) {
                    order_sql += " ASC ";
                }
            }
            return order_sql;
        }
    }
}
//# sourceMappingURL=SqlUtil.js.map