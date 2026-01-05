import { format } from "mysql2";
import { BaseDaoUUID } from "./BaseDaoUUID";
import { DbUtil } from "../database/DbUtil";
/** DAO class for tables with both UUID and auto-increment ID */
export class BaseDaoDoubleID extends BaseDaoUUID {
    id_field;
    constructor(option) {
        super(option);
        this.id_field = option.id_field !== undefined ? option.id_field : 'id';
    }
    /** Get single record by ID */
    async getByIdAsync(id) {
        const sql = `SELECT * FROM ${this.table_name} WHERE ${this.id_field} = ?`;
        const item = await DbUtil.executeGetSingleAsync(sql, [id]);
        if (item) {
            DbUtil.parseJson(item, "json_data");
        }
        return item;
    }
    /** Update record with provided object */
    async updateAsync(item) {
        const { [this.id_field]: id, ...update_item } = item;
        const sql = format(`UPDATE ${this.table_name} SET ? WHERE ${this.id_field} = ?`, [update_item, id]);
        return await DbUtil.executeUpdateAsync(sql);
    }
    /** Delete record by ID */
    async deleteByIdAsync(id) {
        const sql = `DELETE FROM ${this.table_name} WHERE ${this.id_field} = ?`;
        let result = await DbUtil.executeDeleteAsync(sql, [id]);
        return result;
    }
    /**
     * Get the numeric ID from the database using UUID
     * @param uuid The UUID value
     * @returns The numeric ID or null if not found
     */
    async getIdFromUUIDAsync(uuid) {
        let sql = ` SELECT ${this.id_field} FROM ${this.table_name} WHERE ${this.uuid_field} = ? `;
        let para = [uuid];
        const id = await DbUtil.executeGetNumberAsync(sql, para);
        return id;
    }
    /**
     * Get the UUID from the database using ID
     * @param id The numeric ID
     * @returns The UUID or null if not found
     */
    async getUUIDFromIdAsync(id) {
        let sql = ` SELECT ${this.uuid_field} FROM ${this.table_name} WHERE ${this.id_field} = ? `;
        let para = [id];
        const uuid = await DbUtil.executeGetStringAsync(sql, para);
        return uuid;
    }
}
//# sourceMappingURL=BaseDaoDoubleID.js.map