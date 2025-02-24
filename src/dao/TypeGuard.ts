import debug_func from "debug";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
const debug = debug_func("DAO");

// type guard: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
/** 判断是否为OkPacket类型 */
export function isOkPacket(value: any): value is ResultSetHeader {
    return value &&
        (value.constructor.name === "OkPacket" ||
            value.constructor.name === "ResultSetHeader");
}

/** 判断是否为RowDataPacket[]类型 */
export function isRowDataPacketList(value: any): value is RowDataPacket[] {
    debug("constructor.name:", value[0].constructor.name);
    debug("value:", value);
    debug("Array.isArray(value):", Array.isArray(value));
    debug("value.length >= 0:", value.length >= 0);
    debug("!value[0]:", !value[0]);
    debug("value[0].constructor.name:", value[0].constructor.name);

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
