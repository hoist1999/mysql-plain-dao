import { type SortCondition, type PagerParams } from "../types/Types";
/** SQL 语句构建工具类 */
export declare class SqlUtil {
    static like(field: string, condition_value: string): string;
    /**
     * 构建 IN 查询条件的 SQL 片段
     * @param field 字段名，将被自动转义以防止 SQL 注入
     * @param condition_values 查询值，可以是以下类型：
     *   - string[] | number[]：字符串或数字数组
     *   - string | number：单个字符串或数字
     */
    static in(field: string, condition_values: string[] | string | number[] | number): string;
    static equal(field: string, condition_value: string | number): string;
    static not_equal(field: string, condition_value: string): string;
    /**
     * 构建分页 LIMIT 子句（基于页码）
     * @param current 当前页码（从 1 开始）
     * @param pageSize 每页条数
     */
    static limitPager(current: number | string, pageSize: number | string): string;
    /**
     * 构建 LIMIT 子句（基于起始位置）
     * @param start 起始行索引（从 0 开始）
     * @param length 返回行数
     */
    static limit(start: number | string, length: number | string): string;
    static orderBy(conditions: SortCondition | string): string;
    /**
     * 基于 PagerParams 构建分页 LIMIT 子句
     * @param params 分页参数
     */
    static limitPagination(params: PagerParams): string;
}
