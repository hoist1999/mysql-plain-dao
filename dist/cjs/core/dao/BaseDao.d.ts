import { CommonDao, CommonDaoOption } from "./CommonDao";
import type { PlainObject } from "../types/Types";
export interface BaseDaoOption extends CommonDaoOption {
    id_field?: string;
}
/** Base DAO class for tables with auto-increment ID */
export declare class BaseDao<T extends PlainObject, InsertModelType extends PlainObject> extends CommonDao<T> {
    protected id_field: string;
    constructor(option: BaseDaoOption);
    /** Insert data */
    insertAsync(item: InsertModelType): Promise<number | null>;
    /** Bulk insert data: More efficient than inserting one by one.
     * Execute a single SQL statement for all insertions.
     * ~1.374s for 100k records */
    bulkInsertAsync(item_list: Array<InsertModelType>): Promise<void>;
    /** Get single record by ID */
    getByIdAsync(id: number): Promise<T | null>;
    /** Update record with provided object */
    updateAsync(item: T): Promise<number | null>;
    /** Delete record by ID */
    deleteByIdAsync(id: number): Promise<number | null>;
}
