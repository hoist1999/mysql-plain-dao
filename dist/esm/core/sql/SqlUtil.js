import { escapeId, format } from "mysql2";
import { OrderBy } from "../types/Types";
/** SQL 语句构建工具类 */
export class SqlUtil {
    static like(field, condition_value) {
        return format(`${escapeId(field)} LIKE ?`, ["%" + condition_value + "%"]);
    }
    /**
     * 构建 IN 查询条件的 SQL 片段
     * @param field 字段名，将被自动转义以防止 SQL 注入
     * @param condition_values 查询值，可以是以下类型：
     *   - string[] | number[]：字符串或数字数组
     *   - string | number：单个字符串或数字
     */
    static in(field, condition_values) {
        const params = Array.isArray(condition_values)
            ? condition_values
            : [condition_values];
        return format(`${escapeId(field)} IN (${params.map(() => "?").join(",")})`, params);
    }
    static equal(field, condition_value) {
        return format(`${escapeId(field)} = ?`, [condition_value]);
    }
    static not_equal(field, condition_value) {
        return format(`${escapeId(field)} != ?`, [condition_value]);
    }
    /**
     * 构建分页 LIMIT 子句（基于页码）
     * @param current 当前页码（从 1 开始）
     * @param pageSize 每页条数
     */
    static limitPager(current, pageSize) {
        const currentInt = typeof current === "string" ? parseInt(current) : current;
        const pageSizeInt = typeof pageSize === "string" ? parseInt(pageSize) : pageSize;
        let start = pageSizeInt * (currentInt - 1);
        let pager_sql = format(` LIMIT ?,?`, [start, pageSizeInt]);
        return pager_sql;
    }
    /**
     * 构建 LIMIT 子句（基于起始位置）
     * @param start 起始行索引（从 0 开始）
     * @param length 返回行数
     */
    static limit(start, length) {
        const startInt = typeof start === "string" ? parseInt(start) : start;
        const lengthInt = typeof length === "string" ? parseInt(length) : length;
        let pager_sql = format(` LIMIT ?,?`, [startInt, lengthInt]);
        return pager_sql;
    }
    // 构建 ORDER BY 子句
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
    /**
     * 基于 PagerParams 构建分页 LIMIT 子句
     * @param params 分页参数
     */
    static limitPagination(params) {
        const current = params.current ?? 1;
        const pageSize = params.pageSize ?? 10;
        const offset = (current - 1) * pageSize;
        return ` LIMIT ${offset}, ${pageSize}`;
    }
}
//# sourceMappingURL=SqlUtil.js.map