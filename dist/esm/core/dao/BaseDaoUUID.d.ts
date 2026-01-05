import { CommonDao, CommonDaoOption } from "./CommonDao";
import type { PlainObject } from "../types/Types";
export interface BaseDaoUUIDOption extends CommonDaoOption {
    uuid_field?: string;
}
/** DAO class for tables with UUID as primary key */
export declare class BaseDaoUUID<T extends PlainObject, InsertModelType extends PlainObject> extends CommonDao<T> {
    protected uuid_field: string;
    constructor(option: BaseDaoUUIDOption);
    /**
     * Insert data with application-generated UUID
     * @returns The generated UUID
     */
    insertAsync(item: InsertModelType): Promise<string>;
    /** Get single record by UUID */
    getByUuidAsync(uuid: string): Promise<T | null>;
    /** Update record with provided object */
    updateAsync(item: T): Promise<number | null>;
    /** Bulk insert data: More efficient than inserting one by one.
     * Execute a single SQL statement for all insertions.
     * ~1.374s for 100k records
     * @returns Array of inserted items with their UUIDs */
    bulkInsertAsync(item_list: Array<InsertModelType>): Promise<Array<T>>;
    /** Delete record by UUID */
    deleteByUuidAsync(uuid: string): Promise<[import("mysql2").QueryResult, import("mysql2").FieldPacket[]]>;
}
