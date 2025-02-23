import debug_func from "debug";
import dotenvFlow from 'dotenv-flow';
import { isString } from "lodash";
import mysql from "mysql2/promise";
import SqlString from "sqlstring";
import { isNumber, isOkPacket, isRowDataPacketList } from "../TypeGuard";
import { ParasType } from "../Types";


dotenvFlow.config();

const debug = debug_func("TEST");

/** Database CRUD utility class
 *  @author hoist1999
 */
export class DbUtil {
    private static pool: mysql.Pool | null = null;

    /** 
     * Get connection pool
     * Database configuration is set in .env .env.test .env.production files
    */
    static async getPool() {
        if (!this.pool) {
            if (!process.env.DB_PASSWORD) {
                throw new Error("DB_PASSWORD is not set");
            }

            if (!process.env.DB_DATABASE) {
                throw new Error("DB_DATABASE is not set");
            }

            debug({
                host: process.env.DB_HOST || '127.0.0.1',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
                connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
                queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
            });

            this.pool = mysql.createPool({
                host: process.env.DB_HOST || '127.0.0.1',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
                connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
                queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),

                // timezone: "+08:00",

                // Enable this option to convert decimal data type to number (float)
                // https://github.com/sidorares/node-mysql2/blob/bc280518b4bac3212ecfe48c20955354fff38aa6/documentation/Readme.md#known-incompatibilities-with-node-mysql
                decimalNumbers: true,

                // https://github.com/sidorares/node-mysql2/blob/07a429d9765dcbb24af4264654e973847236e0de/documentation/Extras.md
                // Enable named parameter support: connection.execute('select :x + :y as z', { x: 1, y: 2 })
                namedPlaceholders: true,
            });
        }
        return this.pool;
    }

    /** Release connection pool */
    static async relaseConnectionPoolAsync() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null; // Clear pool reference
        }
    }

    /** Execute using query method, sends to MySQL using TEXT protocol.
     * No internal preparation,
     * Advantageous when executing very large SQL statements. */
    static async queryAsync(sql: string, paras?: ParasType) {
        try {
            debug("=== Executing SQL Query: Query Method ===");
            debug("sql:", sql);
            debug("paras:", paras);
            const pool = await this.getPool();
            let result = await pool.query(sql, paras);
            return result;
        } catch (error) {
            debug("=== Error Executing Database Query ===");
            debug("sql:", sql);
            debug("paras:", paras);
            debug("Error: ", error);
            return null;
        }
    }

    /** Execute using execute method, sends to MySQL using binary protocol with prepared statements.
     * Similar performance to query with few placeholders, advantageous for repeated SQL execution.
     * Query performs better with many placeholders.
     * Reference: https://github.com/sidorares/node-mysql2/issues/796#issuecomment-397326698
     */
    static async executeAsync<T extends mysql.QueryResult>(sql: string, paras?: ParasType): Promise<[T, mysql.FieldPacket[]]> {
        try {
            debug("=== Executing SQL Query: Execute Method ===");
            debug("sql:", sql);
            debug("paras:", paras);
            const pool = await this.getPool();
            let result = await pool.query<T>(sql, paras);
            debug("result:", result);
            return result;
        } catch (error) {
            console.error("=== Error Executing Database Query ===");
            console.error(error);
            console.error("sql:", sql);
            console.error("paras:", paras);
            throw error;
        }
    }

    /** Insert data */
    static async executeInsertAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        const [result] = await DbUtil.executeAsync<mysql.ResultSetHeader>(sql, paras);
        if (!result) return null;
        else {
            return result.insertId;
        }
    }

    /** Delete data */
    static async executeDeleteAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        const [result] = await DbUtil.executeAsync<mysql.ResultSetHeader>(sql, paras);
        if (!result) return null;
        {
            return result.affectedRows;
        }
    }

    static async executeUpdateAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        const [result] = await DbUtil.executeAsync<mysql.ResultSetHeader>(sql, paras);
        if (!result) {
            return null;
        }
        else {
            return result.affectedRows;
        }
    }

    /** Get data collection */
    static async executeGetListAsync<T>(
        sql: string,
        paras?: ParasType
    ): Promise<T[]> {
        const [rows] = await DbUtil.executeAsync<mysql.RowDataPacket[]>(sql, paras);
        if (rows.length > 0) {
            return rows as Array<T>;
        }
        else {
            return [];
        }
    }

    /** Get single row */
    static async executeGetSingleAsync<T>(
        sql: string,
        paras?: ParasType
    ): Promise<T | null> {
        const [rows] = await DbUtil.executeAsync<mysql.RowDataPacket[]>(sql, paras);
        if (rows.length === 0) {
            return null
        }
        else if (rows.length === 1) {
            return rows[0] as T;
        }
        else {
            throw new Error(`Database query returned more than one result, please check SQL: ${sql}`);
        }
    }

    /** Get single value */
    static async executeGetValueAsync(
        sql: string,
        paras?: ParasType
    ): Promise<string | number | null> {
        const [rows, fields] = await DbUtil.executeAsync<mysql.RowDataPacket[]>(sql, paras);

        if (rows.length === 1) {
            const field_name = fields[0].name;
            let val = rows[0][field_name] || null
            return val;
        } else if (rows.length === 0) {
            return null;
        }
        else if (rows.length > 1) {
            throw new Error(`Database query returned more than one result, please check SQL: ${sql}`);
        }

        return null;
    }

    static async executeGetStringAsync(
        sql: string,
        paras?: ParasType
    ): Promise<string | null> {
        let val = await DbUtil.executeGetValueAsync(sql, paras);
        if (isString(val)) {
            return val;
        } else if (!val) {
            return null;
        } else {
            throw new Error("Return value is not of type string");
        }
    }

    static async executeGetNumberAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        let val = await DbUtil.executeGetValueAsync(sql, paras);
        if (isNumber(val)) {
            return val;
        } else if (!val) {
            return null;
        } else {
            throw new Error("Return value is not of type number");
        }
    }

    // MariaDB doesn't have a native JSON type, only LONGTEXT, so manual parsing is needed
    // Both data and field_name_data can accept single items or arrays
    static parseJson(
        data: Record<string, any> | Array<Record<string, any>>,
        field_name_data: string | string[] = "json_data"
    ) {
        if (!data) {
            return null;
        }

        let row_list: Record<string, any>[];
        let field_list = null;

        if (!Array.isArray(data)) {
            row_list = [data];
        } else {
            row_list = data;
        }

        if (!Array.isArray(field_name_data)) {
            field_list = [field_name_data];
        } else {
            field_list = field_name_data;
        }

        for (let row of row_list) {
            for (let field_name of field_list) {
                if (row[field_name]) {
                    row[field_name] = row[field_name]
                        ? JSON.parse(row[field_name])
                        : row[field_name];
                }
            }
        }

        return row_list;
    }

    static removeFieldFromList(list: any[], field: string) {
        for (let row of list) {
            delete row[field];
        }
        return list;
    }

    /**
     * Get total count of results
     * @param sql e.g., SELECT count(*) AS total FROM ...
     */
    static async getTotalAsync(sql: string): Promise<number> {
        let total = await DbUtil.executeGetNumberAsync(sql);
        return total ?? 0;
    }

    /**
     * Get maximum sort order value plus one for a table
     * @param table_name Table name
     * @returns Next available sort order
     */
    static async getMaxSortOrderAsync(table_name: string): Promise<number> {
        let sql = SqlString.format(
            `SELECT max(sort_order) AS max_sorder FROM ??`,
            [table_name]
        );
        let current_max_sort_order = await DbUtil.executeGetNumberAsync(sql);
        return (current_max_sort_order ?? 0) + 1;
    }

    /**
     * Find real integer ID from database using UUID
     * @param target_type Target table name
     * @param target_uuid UUID value
     * @returns Integer ID
     */
    static async getIdFromUUIDAsync(target_type: string, target_uuid: string) {
        let sql = ` SELECT id FROM ?? WHERE uuid = ? `;
        let para = [target_type, target_uuid];
        let merge_sql = SqlString.format(sql, para);

        interface IdResult {
            id: number;
        }
        const result_list = await DbUtil.executeGetListAsync<IdResult>(merge_sql);
        if (Array.isArray(result_list)) {
            if (result_list.length === 1) {
                return result_list[0].id;
            } else if (result_list.length > 1) {
                debug("Error: UUID is not unique");
            }
        }
        return null;
    }
}
