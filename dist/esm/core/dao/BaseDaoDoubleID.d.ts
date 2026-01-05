import { BaseDaoUUID, BaseDaoUUIDOption } from "./BaseDaoUUID";
import type { PlainObject } from "../types/Types";
export interface BaseDaoDoubleIDOption extends BaseDaoUUIDOption {
    id_field?: string;
}
/** DAO class for tables with both UUID and auto-increment ID */
export declare class BaseDaoDoubleID<T extends PlainObject, InsertModelType extends PlainObject> extends BaseDaoUUID<T, InsertModelType> {
    protected id_field: string;
    constructor(option: BaseDaoDoubleIDOption);
    /** Get single record by ID */
    getByIdAsync(id: number): Promise<T | null>;
    /** Update record with provided object */
    updateAsync(item: T): Promise<number | null>;
    /** Delete record by ID */
    deleteByIdAsync(id: number): Promise<number | null>;
    /**
     * Get the numeric ID from the database using UUID
     * @param uuid The UUID value
     * @returns The numeric ID or null if not found
     */
    getIdFromUUIDAsync(uuid: string): Promise<number | null>;
    /**
     * Get the UUID from the database using ID
     * @param id The numeric ID
     * @returns The UUID or null if not found
     */
    getUUIDFromIdAsync(id: number): Promise<string | null>;
}
