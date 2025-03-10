import { escapeId, format } from "mysql2";
import { DbUtil } from "./DbUtil";
import { SqlUtil } from "./SqlUtil";
import type { PagerParams, ParasType, PlainObject } from "./Types";

export interface CommonDaoOption {
    table_name: string;
    json_columns?: string[];
}

/** 
 * CommonDao is a base class for all DAO layers, provides basic capabilities upon inheritance
 */
export class CommonDao<T extends PlainObject> {
    protected table_name: string;
    protected json_columns: string[];


    constructor(option: CommonDaoOption) {
        this.table_name = option.table_name;
        this.json_columns = option.json_columns !== undefined ? option.json_columns : [];
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
        return await DbUtil.executeGetSingleAsync<T>(sql, paras);
    }


    /** Get all data records */
    async getListAsync(): Promise<Array<T>> {
        let sql = format(
            `SELECT * FROM ??`,
            [this.table_name]
        );

        const item_list = await DbUtil.executeGetListAsync<T>(sql);
        DbUtil.parseJson(item_list, "json_data");

        return item_list;
    }

    /**
     * Get maximum sort order value plus one
     * @returns Next available sort order
     */
    async getMaxSortOrderAsync(): Promise<number> {
        let sql = format(
            `SELECT max(sort_order) AS max_sorder FROM ??`,
            [this.table_name]
        );
        let current_max_sort_order = await DbUtil.executeGetNumberAsync(sql) ?? 0;
        return current_max_sort_order + 1;
    }

    /**
     * Get total count of records
     * @returns Total count of records
     */
    async getTotalCountAsync(): Promise<number> {
        let sql = format(
            `SELECT count(*) AS total FROM ??`,
            [this.table_name]
        );
        return await DbUtil.executeGetNumberAsync(sql) ?? 0;
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
            ? escapeId(fields)
            : fields;

        let sql_list = `
            SELECT ${fieldsStr}
            FROM ${this.table_name}
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
        let sql_total = ` SELECT count(*) AS total FROM ${this.table_name} ${where_str} `;
        let total = await DbUtil.executeGetNumberAsync(sql_total) ?? 0;

        return { list, total };
    }

}
