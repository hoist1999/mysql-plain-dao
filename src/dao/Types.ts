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

export interface PagerParams {
    /** Current page number */
    current?: number;
    /** Page size */
    pageSize?: number;
    /** Sort order */
    orderPara?: SortCondition | string;
    /** Search parameters from form */
    searchParams?: Record<string, string>;
}


/** Used when inserting new data into database: ignores id and uuid values */
export type InsertModel<T> = Omit<T, "id" | "uuid">;