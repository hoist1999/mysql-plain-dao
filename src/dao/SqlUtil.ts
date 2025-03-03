import { escapeId, format } from "mysql2";
import { OrderBy, type SortCondition } from "./Types.js";

/** Utility class for constructing SQL statements
 */
export class SqlUtil {
  static like(field: string, condition_value: string) {
    return format(`${escapeId(field)} LIKE ?`, ["%" + condition_value + "%"]);
  }

  static equal(field: string, condition_value: string | number) {
    return format(`${escapeId(field)} = ?`, [condition_value]);
  }

  static not_equal(field: string, condition_value: string) {
    return format(`${escapeId(field)} != ?`, [condition_value]);
  }

  /**
   * Get LIMIT clause for pagination
   * @param current Current page number (starting from 1)
   * @param pageSize Number of items per page
   */
  static limitPager(current: number | string, pageSize: number | string) {
    const currentInt =
      typeof current === "string" ? parseInt(current) : current;
    const pageSizeInt =
      typeof pageSize === "string" ? parseInt(pageSize) : pageSize;
    let start = pageSizeInt * (currentInt - 1);
    let pager_sql = format(` LIMIT ?,?`, [start, pageSizeInt]);
    return pager_sql;
  }

  /**
   * Get LIMIT clause
   * @param start Starting row index (starting from 0)
   * @param length Number of rows to return
   */
  static limit(start: number | string, length: number | string) {
    const startInt = typeof start === "string" ? parseInt(start) : start;
    const lengthInt = typeof length === "string" ? parseInt(length) : length;
    let pager_sql = format(` LIMIT ?,?`, [startInt, lengthInt]);
    return pager_sql;
  }

  // Get ORDER BY clause
  static orderBy(conditions: SortCondition | string) {
    if (typeof conditions === "string") {
      return conditions;
    } else {
      const { order = OrderBy.ASC, field = "" } = conditions;
      let order_sql = "";
      if (order && field) {
        order_sql = ` ORDER BY ${escapeId(field)} `;
        if (order === OrderBy.DESC) {
          order_sql += " DESC ";
        } else if (order === OrderBy.ASC) {
          order_sql += " ASC ";
        }
      }
      return order_sql;
    }
  }
}
