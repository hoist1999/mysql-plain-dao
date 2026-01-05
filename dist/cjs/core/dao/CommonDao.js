"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonDao = void 0;
const mysql2_1 = require("mysql2");
const DbUtil_1 = require("../database/DbUtil");
const SqlUtil_1 = require("../sql/SqlUtil");
/**
 * CommonDao is a base class for all DAO layers, provides basic capabilities upon inheritance
 */
class CommonDao {
    table_name;
    json_columns;
    constructor(option) {
        this.table_name = option.table_name;
        this.json_columns = option.json_columns !== undefined ? option.json_columns : [];
    }
    /** Get data collection */
    async executeGetListAsync(sql, paras) {
        return await DbUtil_1.DbUtil.executeGetListAsync(sql, paras);
    }
    /** Get single data record */
    async executeGetSingleAsync(sql, paras) {
        return await DbUtil_1.DbUtil.executeGetSingleAsync(sql, paras);
    }
    /** Get all data records */
    async getListAsync() {
        let sql = (0, mysql2_1.format)(`SELECT * FROM ??`, [this.table_name]);
        const item_list = await DbUtil_1.DbUtil.executeGetListAsync(sql);
        DbUtil_1.DbUtil.parseJson(item_list, "json_data");
        return item_list;
    }
    // get max sort order
    async getMaxSortOrderAsync(sort_order_field = "sort_order") {
        let sql = (0, mysql2_1.format)(`SELECT max(${sort_order_field}) AS max_sort_order FROM ??`, [this.table_name]);
        return await DbUtil_1.DbUtil.executeGetNumberAsync(sql) ?? 0;
    }
    /**
     * Get total count of records
     * @returns Total count of records
     */
    async getTotalCountAsync() {
        let sql = (0, mysql2_1.format)(`SELECT count(*) AS total FROM ??`, [this.table_name]);
        return await DbUtil_1.DbUtil.executeGetNumberAsync(sql) ?? 0;
    }
    /**
     * Get paginated data
     * For LEFT JOIN usage,
     * refer to WarehouseDao implementation
     * @param fields Array or string of column names to return
     * @param where_str WHERE clause
     * @param params Pagination parameters
     * @param join_table_str JOIN clause
     * @returns `{ list, total }`
     */
    async getPagerDataAsync(fields, where_str = "", { orderPara, current = 1, pageSize = 10, }, join_table_str = "") {
        const fieldsStr = Array.isArray(fields)
            ? (0, mysql2_1.escapeId)(fields)
            : fields;
        let sql_list = `
            SELECT ${fieldsStr}
            FROM ${this.table_name}
            ${join_table_str}
            ${where_str}
            ${SqlUtil_1.SqlUtil.orderBy(orderPara || '')}
            ${SqlUtil_1.SqlUtil.limitPager(current, pageSize)}
        `;
        // TODO: Add JSON handling
        // ${DbUtil.sql_order_by(conditions)}
        const list = (await DbUtil_1.DbUtil.executeGetListAsync(sql_list));
        // DbUtil.parse_json(list, "json_data");
        // Get total count
        let sql_total = ` SELECT count(*) AS total FROM ${this.table_name} ${where_str} `;
        let total = await DbUtil_1.DbUtil.executeGetNumberAsync(sql_total) ?? 0;
        return { list, total };
    }
}
exports.CommonDao = CommonDao;
//# sourceMappingURL=CommonDao.js.map