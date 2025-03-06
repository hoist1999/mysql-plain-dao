import { escape, escapeId, format } from "mysql2";
import { CommonDao } from "./CommonDao";
import { DbUtil } from "./DbUtil";
import type { InsertModel, PlainObject } from "./Types";

export interface BaseDaoOption {
    table_name: string;
    json_columns?: string[];
    id_field?: string;
}

/** Base DAO class for tables with auto-increment ID */
export class BaseDao<T extends PlainObject> extends CommonDao<T> {
    constructor(option: BaseDaoOption) {
        super(option);
    }

    /** Insert data */
    async insertAsync(item: InsertModel<T>): Promise<number | null> {
        const sql = format(
            `INSERT INTO ${this.table_name} SET ?`,
            item
        );
        const insertId = await DbUtil.executeInsertAsync(sql);
        return insertId;
    }

    /** Bulk insert data: More efficient than inserting one by one.
     * Execute a single SQL statement for all insertions.
     * ~1.374s for 100k records */
    async bulkInsertAsync(item_list: Array<T | InsertModel<T>>) {
        if (!item_list || item_list.length == 0) {
            return;
        }

        const keys = Object.keys(item_list[0]);

        // Double map to convert object array to SQL values
        const values_str = item_list
            .map(
                (item) =>
                    `(${Object.values(item)
                        .map((val) => escape(val))
                        .join(",")})`
            )
            .join(",");

        let sql = ` INSERT INTO ${this.table_name}(${escapeId(
            keys
        )}) VALUES ${values_str}`;

        await DbUtil.queryAsync(sql);

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
    async getByIdAsync(id: number): Promise<T | null> {
        const sql = `SELECT * FROM ${this.table_name} WHERE ${this.id_field} = ?`;
        const item = await DbUtil.executeGetSingleAsync<T>(sql, [id]);
        if (item) {
            DbUtil.parseJson(item, "json_data");
        }
        return item;
    }

    /** Update record with provided object */
    async updateAsync(item: T): Promise<number | null> {
        const { [this.id_field]: id, ...update_item } = item;
        const sql = format(
            `UPDATE ${this.table_name} SET ? WHERE ${this.id_field} = ?`,
            [update_item, id]
        );

        return await DbUtil.executeUpdateAsync(sql);
    }

    /** Delete record by ID */
    async deleteByIdAsync(id: number): Promise<number | null> {
        const sql = `DELETE FROM ${this.table_name} WHERE ${this.id_field} = ?`;
        let result = await DbUtil.executeDeleteAsync(sql, [id]);
        return result;
    }
}
