import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// https://dev.to/ankittanna/how-to-create-a-type-for-complex-json-object-in-typescript-d81
export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

export interface PagerCondition {
    order: 'descend' | 'ascend';
    field: string;
}

export type ParasType = any | any[] | { [param: string]: any };

export type ResultType = RowDataPacket[][] | RowDataPacket[] | ResultSetHeader | ResultSetHeader[] | ResultSetHeader;

export type Primitive =
    | bigint
    | boolean
    | null
    | number
    | string
    | symbol
    | undefined
    | Date;

export type PlainObject = Record<string, any>;


export enum OrderBy {
    DESC = "descend",
    ASC = "asc",
}

export interface SortCondition {
    order?: OrderBy;
    field?: string;
}


//用户账户状态
export enum UserStatus {
    NEW_REGISTER = "new_register",
    ENABLED = "enabled",
    DISABLED = "disabled",
}

/** 数据库插入新数据时候使用：忽略id和uuid值 */
export type InsertModel<T> = Omit<T, "id" | "uuid">;

export interface DiggingResultRow {
    keyword: string;
    monthly_volume?: number;
    rank?: string;
    search_count?: number;
    low_exact?: number;
    median_exact?: number;
    high_exact?: number;
}



export type ConfigValue =
    | string
    | number
    | boolean
    | Date
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

export interface TaskTag {
    task_tag: string;
}