"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDaoUUID = void 0;
const mysql2_1 = require("mysql2");
const uuid_1 = require("uuid");
const CommonDao_1 = require("./CommonDao");
const DbUtil_1 = require("../database/DbUtil");
/** DAO class for tables with UUID as primary key */
class BaseDaoUUID extends CommonDao_1.CommonDao {
    uuid_field;
    constructor(option) {
        super(option);
        this.uuid_field = option.uuid_field !== undefined ? option.uuid_field : "uuid";
    }
    /**
     * Insert data with application-generated UUID
     * @returns The generated UUID
     */
    async insertAsync(item) {
        const { [this.uuid_field]: uuid, ...newInsertItem } = item;
        const generatedUuid = (0, uuid_1.v4)();
        const sql = (0, mysql2_1.format)(`INSERT INTO ${this.table_name} SET ${this.uuid_field} = ?, ?`, [generatedUuid, newInsertItem]);
        await DbUtil_1.DbUtil.executeInsertAsync(sql);
        return generatedUuid;
    }
    /** Get single record by UUID */
    async getByUuidAsync(uuid) {
        const sql = `SELECT * FROM ${this.table_name} WHERE ${this.uuid_field} = ?`;
        const item = await DbUtil_1.DbUtil.executeGetSingleAsync(sql, [uuid]);
        if (item) {
            DbUtil_1.DbUtil.parseJson(item, "json_data");
        }
        return item;
    }
    /** Update record with provided object */
    async updateAsync(item) {
        const { [this.uuid_field]: uuid, ...updateItem } = item;
        const sql = (0, mysql2_1.format)(`UPDATE ${this.table_name} SET ? WHERE ${this.uuid_field} = ?`, [updateItem, uuid]);
        return await DbUtil_1.DbUtil.executeUpdateAsync(sql);
    }
    /** Bulk insert data: More efficient than inserting one by one.
     * Execute a single SQL statement for all insertions.
     * ~1.374s for 100k records
     * @returns Array of inserted items with their UUIDs */
    async bulkInsertAsync(item_list) {
        if (!item_list || item_list.length == 0) {
            return [];
        }
        const items_with_uuid = item_list.map(item => ({
            [this.uuid_field]: (0, uuid_1.v4)(),
            ...item
        }));
        const keys = [this.uuid_field, ...Object.keys(item_list[0])];
        // Double map to convert object array to SQL values
        const values_str = items_with_uuid
            .map((item) => `(${(0, mysql2_1.escape)(item[this.uuid_field])}, ${Object.values(item)
            .filter((_val, index) => index > 0) // Skip the UUID as it's already added
            .map((val) => (0, mysql2_1.escape)(val))
            .join(",")})`)
            .join(",");
        let sql = `INSERT INTO ${this.table_name}(${keys.map(k => (0, mysql2_1.escapeId)(k)).join(',')}) VALUES ${values_str}`;
        await DbUtil_1.DbUtil.queryAsync(sql);
        return items_with_uuid;
    }
    /** Delete record by UUID */
    async deleteByUuidAsync(uuid) {
        const sql = `DELETE FROM ${this.table_name} WHERE ${this.uuid_field} = ?`;
        let result = await DbUtil_1.DbUtil.executeAsync(sql, [uuid]);
        return result;
    }
}
exports.BaseDaoUUID = BaseDaoUUID;
//# sourceMappingURL=BaseDaoUUID.js.map