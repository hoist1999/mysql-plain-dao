"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDao = void 0;
const mysql2_1 = require("mysql2");
const CommonDao_1 = require("./CommonDao");
const DbUtil_1 = require("../database/DbUtil");
/** Base DAO class for tables with auto-increment ID */
class BaseDao extends CommonDao_1.CommonDao {
    id_field;
    constructor(option) {
        super(option);
        this.id_field = option.id_field !== undefined ? option.id_field : 'id';
    }
    /** Insert data */
    async insertAsync(item) {
        const sql = (0, mysql2_1.format)(`INSERT INTO ${this.table_name} SET ?`, item);
        const insertId = await DbUtil_1.DbUtil.executeInsertAsync(sql);
        return insertId;
    }
    /** Bulk insert data: More efficient than inserting one by one.
     * Execute a single SQL statement for all insertions.
     * ~1.374s for 100k records */
    async bulkInsertAsync(item_list) {
        if (!item_list || item_list.length == 0) {
            return;
        }
        const keys = Object.keys(item_list[0]);
        // Double map to convert object array to SQL values
        const values_str = item_list
            .map((item) => `(${Object.values(item)
            .map((val) => (0, mysql2_1.escape)(val))
            .join(",")})`)
            .join(",");
        let sql = ` INSERT INTO ${this.table_name}(${(0, mysql2_1.escapeId)(keys)}) VALUES ${values_str}`;
        await DbUtil_1.DbUtil.queryAsync(sql);
        // Keep this comment for reference:
        // Note: Object.keys order is crucial for correct insertion
        // Tested that it matches the order used in sqlstring
        // Test code for key order:
        // var obj = {
        //     a : 1,
        //     b : 2,
        //     d : 3,
        //     c : 4,
        // }
        // debug(Object.keys(obj));
        // for (var key in obj) {
        //     debug({key});
        // }
    }
    /** Get single record by ID */
    async getByIdAsync(id) {
        const sql = `SELECT * FROM ${this.table_name} WHERE ${this.id_field} = ?`;
        const item = await DbUtil_1.DbUtil.executeGetSingleAsync(sql, [id]);
        if (item) {
            DbUtil_1.DbUtil.parseJson(item, "json_data");
        }
        return item;
    }
    /** Update record with provided object */
    async updateAsync(item) {
        const { [this.id_field]: id, ...update_item } = item;
        const sql = (0, mysql2_1.format)(`UPDATE ${this.table_name} SET ? WHERE ${this.id_field} = ?`, [update_item, id]);
        return await DbUtil_1.DbUtil.executeUpdateAsync(sql);
    }
    /** Delete record by ID */
    async deleteByIdAsync(id) {
        const sql = `DELETE FROM ${this.table_name} WHERE ${this.id_field} = ?`;
        let result = await DbUtil_1.DbUtil.executeDeleteAsync(sql, [id]);
        return result;
    }
}
exports.BaseDao = BaseDao;
//# sourceMappingURL=BaseDao.js.map