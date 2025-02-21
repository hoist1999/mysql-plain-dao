import SqlString from "sqlstring";
import { InsertModel, ParasType, PlainObject, SortCondition } from "../Types";
import { DbUtil } from "./DbUtil";
import { SqlUtil } from "./SqlUtil";

export interface Option {
    table_name: string;
    json_columns?: string[];
}

export interface PagerParams {
    /** Current page number */
    current?: number | string;
    /** Page size */
    pageSize?: number | string;
    /** Sort order */
    orderPara?: SortCondition | string;
    /** Search parameters from form */
    searchParams?: Record<string, string>;
}

/** Base class for all DAO layers, provides basic CRUD capabilities upon inheritance
 * @author hoist1999
 */
export class BaseDAO<T extends PlainObject> {
    protected option: Option;

    constructor(option: Option) {
        const DEFAULT_OPTION: Partial<Option> = {
            json_columns: [],
        };

        this.option = {
            ...DEFAULT_OPTION,
            ...option,
        };
    }

    /** Get current table name */
    getTableName() {
        return this.option.table_name;
    }

    /** Get data collection */
    protected async executeGetListAsync(
        sql: string,
        paras?: ParasType
    ): Promise<T[]> {
        return await DbUtil.executeGetListAsync(sql, paras);
    }

    /** Get single data record */
    protected async executeGetSingleAsync(
        sql: string,
        paras?: ParasType
    ): Promise<T | null> {
        return await DbUtil.executeGetSingleAsync(sql, paras);
    }

    /** Insert data */
    async insertAsync(item: InsertModel<T>): Promise<number | null> {
        const sql = SqlString.format(
            `INSERT INTO ${this.option.table_name} SET ?`,
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
                        .map((val) => SqlString.escape(val))
                        .join(",")})`
            )
            .join(",");

        let sql = ` INSERT INTO ${this.option.table_name}(${SqlString.escapeId(
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
        // console.log(Object.keys(obj));
        // for (var key in obj) {
        //     console.log({key});
        // }
    }

    /** Get all data records */
    async getListAsync(): Promise<Array<T>> {
        const sql = `SELECT * FROM ${this.option.table_name} `;
        const item_list = await DbUtil.executeGetListAsync<T>(sql);
        DbUtil.parseJson(item_list, "json_data");

        return item_list;
    }

    /** Get single record by ID */
    async getByIdAsync(id: number): Promise<T | null> {
        const sql = `SELECT * FROM ${this.option.table_name} WHERE id = ?`;
        const item = await DbUtil.executeGetSingleAsync<T>(sql, [id]);
        if (item) {
            DbUtil.parseJson(item, "json_data");
        }
        return item;
    }

    /** Update record with provided object */
    async updateAsync(item: T): Promise<number | null> {
        const { id, ...update_item } = item;
        const sql = SqlString.format(
            `UPDATE ${this.option.table_name} SET ? WHERE id = ?`,
            [update_item, id]
        );

        return await DbUtil.executeUpdateAsync(sql);
    }

    /** Delete record by ID */
    async deleteByIdAsync(id: number): Promise<number | null> {
        const sql = `DELETE FROM ${this.option.table_name} WHERE id = ?`;
        let result = await DbUtil.executeDeleteAsync(sql, [id]);
        return result;
    }

    /**
     * Get maximum sort order value plus one
     * @returns Next available sort order
     */
    async getMaxSortOrderAsync(): Promise<number> {
        let sql = SqlString.format(
            `SELECT max(sort_order) AS max_sorder FROM ??`,
            [this.option.table_name]
        );
        let current_max_sort_order = await DbUtil.executeGetNumberAsync(sql) ?? 0;
        return current_max_sort_order + 1;
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
    protected async getPagerDataAsync(
        fields: string[] | string,
        where_str = "",
        {
            orderPara,
            current = 1,
            pageSize = 10,
        }: Omit<PagerParams, "searchParams">,
        join_table_str: string = ""
    ) {
        const fieldsStr = Array.isArray(fields)
            ? SqlString.escapeId(fields)
            : fields;

        let sql_list = `
            SELECT ${fieldsStr}
            FROM ${this.option.table_name}
            ${join_table_str}
            ${where_str}
            ${SqlUtil.orderBy(orderPara || '')}
            ${SqlUtil.limitPager(current, pageSize)}
        `;

        // TODO: Add JSON handling
        // ${DbUtil.sql_order_by(conditions)}

        const list = (await DbUtil.executeGetListAsync(sql_list)) as Array<T>;
        // DbUtil.parse_json(list, "json_data");

        // Get total count
        let sql_total = ` SELECT count(*) AS total FROM ${this.option.table_name} ${where_str} `;
        let total = await DbUtil.getTotalAsync(sql_total);

        return { list, total };
    }
}
