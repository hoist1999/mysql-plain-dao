import sqlstring from "sqlstring";
import { OrderBy, SortCondition } from "./Types";

/** Utility class for constructing SQL statements
 */
export class SqlUtil {
  static like(field: string, condition_value: string) {
    const like_str = `${sqlstring.escapeId(field)} LIKE ${sqlstring.escape(
      "%" + condition_value + "%"
    )}`;
    return like_str;
  }

  static equal(field: string, condition_value: string | number) {
    const like_str = `${sqlstring.escapeId(field)} = ${sqlstring.escape(
      condition_value
    )}`;
    return like_str;
  }

  static not_equal(field: string, condition_value: string) {
    const like_str = `${sqlstring.escapeId(field)} != ${sqlstring.escape(
      condition_value
    )}`;
    return like_str;
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
    let pager_sql = sqlstring.format(` LIMIT ?,?`, [start, pageSizeInt]);
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
    let pager_sql = sqlstring.format(` LIMIT ?,?`, [startInt, lengthInt]);
    return pager_sql;
  }

  // Get ORDER BY clause
  static orderBy(conditions: SortCondition | string) {
    if (typeof conditions === "string") {
      return conditions;
    } else {
      // Add sorting conditions if needed
      const { order = OrderBy.ASC, field = "" } = conditions;
      let order_sql = "";
      if (order && field) {
        let escape_field = sqlstring.escape(field);
        escape_field = escape_field.substring(1, escape_field.length - 1); // Remove surrounding quotes

        order_sql = ` ORDER BY ${escape_field} `;
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
