import { type SortCondition } from "../types/Types";
/** Utility class for constructing SQL statements
 */
export declare class SqlUtil {
    static like(field: string, condition_value: string): string;
    static equal(field: string, condition_value: string | number): string;
    static not_equal(field: string, condition_value: string): string;
    /**
     * Get LIMIT clause for pagination
     * @param current Current page number (starting from 1)
     * @param pageSize Number of items per page
     */
    static limitPager(current: number | string, pageSize: number | string): string;
    /**
     * Get LIMIT clause
     * @param start Starting row index (starting from 0)
     * @param length Number of rows to return
     */
    static limit(start: number | string, length: number | string): string;
    static orderBy(conditions: SortCondition | string): string;
}
