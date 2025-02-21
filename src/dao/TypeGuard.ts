import { OkPacket, RowDataPacket } from "mysql2/promise";
import { ResultType } from "./Types";

// type guard: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
/** 判断是否为OkPacket类型 */
export function isOkPacket(value: ResultType): value is OkPacket {
    return (value as OkPacket).insertId !== undefined;
}

/** 判断是否为RowDataPacket[]类型 */
export function isRowDataPacketList(value: ResultType): value is RowDataPacket[] {
    return (value as RowDataPacket[]).length !== undefined;
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
