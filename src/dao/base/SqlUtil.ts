import sqlstring from "sqlstring";
import { OrderBy, SortCondition } from "../Types";

/** 用于构造SQL语句的工具类
 *  @author hoist1999
 */
export class SqlUtil {
  static like(field: string, condition_value: string) {
    const like_str = `${sqlstring.escapeId(field)} LIKE ${sqlstring.escape(
      "%" + condition_value + "%"
    )}`;
    return like_str;
  }

  static equal(field: string, condition_value: string| number) {
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
   * 获得Limit: 使用分页
   * @param current 当前页面，从1开始
   * @param pageSize 页面的大小
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
   * 获得Limit
   * @param start 数据开始行，从0开始
   * @param length 返回的数据行数
   */
  static limit(start: number | string, length: number | string) {
    const startInt = typeof start === "string" ? parseInt(start) : start;
    const lengthInt = typeof length === "string" ? parseInt(length) : length;
    let pager_sql = sqlstring.format(` LIMIT ?,?`, [startInt, lengthInt]);
    return pager_sql;
  }

  //获得排序的SQL
  static orderBy(conditions: SortCondition | string) {
    if (typeof conditions === "string") {
      return conditions;
    } else {
      //如果需要排序，那么添加排序的条件
      const { order = OrderBy.ASC, field = "" } = conditions;
      let order_sql = "";
      if (order && field) {
        let escape_field = sqlstring.escape(field);
        escape_field = escape_field.substring(1, escape_field.length - 1); //去掉两侧的单引号

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
