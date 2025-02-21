import { OkPacket, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { ResultType } from "./Types";

// type guard: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
/** 判断是否为OkPacket类型 */
export function isOkPacket(value: any): value is ResultSetHeader {
    return value && 
           (value.constructor.name === "OkPacket" || 
            value.constructor.name === "ResultSetHeader");
}

/** 判断是否为RowDataPacket[]类型 */
export function isRowDataPacketList(value: any): value is RowDataPacket[] {
    return Array.isArray(value) && value.length >= 0 && 
           (!value[0] || value[0].constructor.name === "RowDataPacket");
}

/** 测试是否为number */
export function isNumber(x: any): x is number {
    //https://www.typescriptlang.org/docs/handbook/advanced-types.html#typeof-type-guards
    return typeof x === "number";
}

/** 测试是否为string */
export function isString(x: any): x is string {
    return typeof x === "string";
}
