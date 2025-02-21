import debug_func from "debug";
import { Connection } from "mysql2/promise";
import { ParasType } from "../Types";
import { DbUtil } from "./DbUtil";

const debug = debug_func("VCU");

/** 数据库事务工具类
 *  @author Assistant 2024
 */
export class DbTransactionUtil {
    /**
     * 在事务中执行一系列数据库操作
     * @param callback 在事务中要执行的操作函数
     * @returns 返回事务执行的结果
     * @example
     * ```typescript
     * try {
     *     const result = await DbTransactionUtil.executeInTransaction(async (connection) => {
     *         // 执行第一个操作
     *         await DbTransactionUtil.executeQueryInTransaction(
     *             connection,
     *             "INSERT INTO table1 (field1) VALUES (?)",
     *             ["value1"]
     *         );
     * 
     *         // 执行第二个操作
     *         await DbTransactionUtil.executeQueryInTransaction(
     *             connection,
     *             "UPDATE table2 SET field2 = ? WHERE id = ?",
     *             ["value2", 1]
     *         );
     * 
     *         // 返回结果
     *         return "success";
     *     });
     * 
     *     console.log("事务执行成功:", result);
     * } catch (error) {
     *     console.error("事务执行失败:", error);
     * }
     * ```
     */
    static async executeInTransaction<T>(
        callback: (connection: Connection) => Promise<T>
    ): Promise<T> {
        const pool = await DbUtil.getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            debug("=== 开始事务 ===");

            const result = await callback(connection);

            await connection.commit();
            debug("=== 事务提交成功 ===");

            return result;
        } catch (error) {
            await connection.rollback();
            debug("=== 事务回滚 ===");
            debug("错误信息:", error);
            throw error;
        } finally {
            connection.release();
            debug("=== 释放连接 ===");
        }
    }

    /**
     * 在事务中执行SQL查询
     * @param connection 数据库连接
     * @param sql SQL语句
     * @param params SQL参数
     * @returns 查询结果
     */
    static async executeQueryInTransaction(
        connection: Connection,
        sql: string,
        params?: ParasType
    ) {
        try {
            debug("=== 正在执行事务中的SQL查询 ===");
            debug("sql:", sql);
            debug("params:", params);

            const result = await connection.execute(sql, params);
            return result;
        } catch (error) {
            debug("=== 执行事务中的SQL查询时发生错误 ===");
            debug("sql:", sql);
            debug("params:", params);
            debug("错误信息:", error);
            throw error;
        }
    }
}
