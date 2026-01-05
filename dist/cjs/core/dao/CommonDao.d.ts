import type { PagerParams, ParasType, PlainObject } from "../types/Types";
export interface CommonDaoOption {
    table_name: string;
    json_columns?: string[];
}
/**
 * CommonDao is a base class for all DAO layers, provides basic capabilities upon inheritance
 */
export declare class CommonDao<T extends PlainObject> {
    protected table_name: string;
    protected json_columns: string[];
    constructor(option: CommonDaoOption);
    /** Get data collection */
    protected executeGetListAsync(sql: string, paras?: ParasType): Promise<T[]>;
    /** Get single data record */
    protected executeGetSingleAsync(sql: string, paras?: ParasType): Promise<T | null>;
    /** Get all data records */
    getListAsync(): Promise<Array<T>>;
    getMaxSortOrderAsync(sort_order_field?: string): Promise<number>;
    /**
     * Get total count of records
     * @returns Total count of records
     */
    getTotalCountAsync(): Promise<number>;
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
    getPagerDataAsync(fields: string[] | string, where_str: string | undefined, { orderPara, current, pageSize, }: Omit<PagerParams, "searchParams">, join_table_str?: string): Promise<{
        list: T[];
        total: number;
    }>;
}
