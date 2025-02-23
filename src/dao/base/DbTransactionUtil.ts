import debug_func from "debug";
import { Connection } from "mysql2/promise";
import { ParasType } from "../Types";
import { DbUtil } from "./DbUtil";

const debug = debug_func("TEST");

/** Database transaction utility class
 *  @author Assistant 2024
 */
export class DbTransactionUtil {
    /**
     * Execute a series of database operations within a transaction
     * @param callback Function containing operations to execute within the transaction
     * @returns Result of the transaction execution
     * @example
     * ```typescript
     * try {
     *     const result = await DbTransactionUtil.executeInTransaction(async (connection) => {
     *         // Execute first operation
     *         await DbTransactionUtil.executeQueryInTransaction(
     *             connection,
     *             "INSERT INTO table1 (field1) VALUES (?)",
     *             ["value1"]
     *         );
     * 
     *         // Execute second operation
     *         await DbTransactionUtil.executeQueryInTransaction(
     *             connection,
     *             "UPDATE table2 SET field2 = ? WHERE id = ?",
     *             ["value2", 1]
     *         );
     * 
     *         // Return result
     *         return "success";
     *     });
     * 
     *     debug("Transaction executed successfully:", result);
     * } catch (error) {
     *     console.error("Transaction execution failed:", error);
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
            debug("=== Transaction Started ===");

            const result = await callback(connection);

            await connection.commit();
            debug("=== Transaction Committed Successfully ===");

            return result;
        } catch (error) {
            await connection.rollback();
            debug("=== Transaction Rolled Back ===");
            debug("Error:", error);
            throw error;
        } finally {
            connection.release();
            debug("=== Connection Released ===");
        }
    }

    /**
     * Execute SQL query within a transaction
     * @param connection Database connection
     * @param sql SQL statement
     * @param params SQL parameters
     * @returns Query result
     */
    static async executeQueryInTransaction(
        connection: Connection,
        sql: string,
        params?: ParasType
    ) {
        try {
            debug("=== Executing SQL Query in Transaction ===");
            debug("sql:", sql);
            debug("params:", params);

            const result = await connection.execute(sql, params);
            return result;
        } catch (error) {
            debug("=== Error Executing SQL Query in Transaction ===");
            debug("sql:", sql);
            debug("params:", params);
            debug("Error:", error);
            throw error;
        }
    }
}
