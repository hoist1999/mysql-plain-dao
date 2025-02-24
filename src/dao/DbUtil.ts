import debug_func from "debug";
import { isNumber, isString } from "lodash";
import mysql from "mysql2/promise";
import SqlString from "sqlstring";
import { ParasType } from "./Types";

const debug = debug_func("DAO");

export class DatabaseError extends Error {
    constructor(
        message: string,
        public sql?: string,
        public params?: ParasType,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export type QueryResult<T> = T extends Array<infer U> ? U[] : T;

// Type definitions for database configuration
interface ConnectionConfig {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
}

interface PoolConfig {
    min?: number;
    max?: number;
    waitForConnections?: boolean;
    queueLimit?: number;
}

interface DatabaseOptions {
    connection: ConnectionConfig | string;
    pool?: PoolConfig;
    debug?: boolean;
    decimalNumbers?: boolean;
    namedPlaceholders?: boolean;
}

/** Database CRUD utility class
 *  @author hoist1999
 */
export class DbUtil {
    private static pool: mysql.Pool | null = null;
    private static options: DatabaseOptions;

    /**
     * Initialize database connection
     * @example
     * ```typescript
     * // Using connection string
     * DbUtil.initialize({
     *   connection: 'mysql://user:pass@localhost:3306/db_name'
     * });
     * 
     * // Using connection config
     * DbUtil.initialize({
     *   connection: {
     *     host: 'localhost',
     *     user: 'root',
     *     password: 'password',
     *     database: 'db_name'
     *   },
     *   pool: {
     *     min: 2,
     *     max: 10
     *   }
     * });
     * ```
     */
    static initialize(options: DatabaseOptions) {
        this.options = {
            debug: false,
            decimalNumbers: true,
            namedPlaceholders: true,
            ...options,
        };

        // Reset pool if exists
        if (this.pool) {
            this.pool.end();
            this.pool = null;
        }
    }

    private static parseConnectionConfig(config: ConnectionConfig | string): mysql.PoolOptions {
        if (typeof config === 'string') {
            // Parse connection URL
            const url = new URL(config);
            return {
                host: url.hostname,
                port: parseInt(url.port || '3306'),
                user: url.username,
                password: url.password,
                database: url.pathname.slice(1), // Remove leading slash from pathname
            };
        }

        return {
            host: config.host || '127.0.0.1',
            port: config.port || 3306,
            user: config.user || 'root',
            password: config.password,
            database: config.database,
        };
    }


    /** 
     * Get connection pool
     * Database configuration is loaded from environment files (.env, .env.test, .env.production)
     */
    static async getPool() {
        if (!this.pool) {
            if (!this.options) {
                throw new DatabaseError("Database not initialized. Call initialize() first");
            }

            const connection = this.parseConnectionConfig(this.options.connection);
            const pool = this.options.pool || {};

            const poolConfig: mysql.PoolOptions = {
                ...connection,
                waitForConnections: pool.waitForConnections ?? true,
                connectionLimit: pool.max ?? 10,
                queueLimit: pool.queueLimit ?? 0,
                decimalNumbers: this.options.decimalNumbers,
                namedPlaceholders: this.options.namedPlaceholders,
            };

            if (this.options.debug) {
                debug('Pool configuration:', poolConfig);
            }

            this.pool = mysql.createPool(poolConfig);
        }
        return this.pool;
    }

    /** Release the database connection pool */
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
            console.error("=== Error Executing Database Query ===");
            console.error(error);
            console.error("sql:", sql);
            console.error("paras:", paras);
            throw error;
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
            throw new DatabaseError(
                'Database query execution failed',
                sql,
                paras,
                error instanceof Error ? error : undefined
            );
        }
    }

    /** Insert data and return the inserted ID */
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

    /** Delete data and return the number of affected rows */
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

    /** Update data and return the number of affected rows */
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

    /** Get a list of records matching the query */
    static async executeGetListAsync<T extends Record<string, any>>(
        sql: string,
        paras?: ParasType
    ): Promise<QueryResult<T[]>> {
        const [rows] = await DbUtil.executeAsync<mysql.RowDataPacket[]>(sql, paras);
        return (rows.length > 0 ? rows : []) as QueryResult<T[]>;
    }

    /** Get a single record matching the query */
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

    /** Get a single value from the first column of the first row */
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

    /**
     * Parse JSON data stored as LONGTEXT in MariaDB
     * @param data Single record or array of records containing JSON fields
     * @param field_name_data Field name(s) containing JSON data
     * @returns Parsed record(s) with JSON fields
     */
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
     * @param sql SQL query that returns a count (e.g., SELECT count(*) AS total FROM ...)
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

    static async withTransaction<T>(
        callback: (connection: mysql.PoolConnection) => Promise<T>
    ): Promise<T> {
        const pool = await this.getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Create a new instance with specific configuration
     * Useful for managing multiple database connections
     */
    static createInstance(options: DatabaseOptions): typeof DbUtil {
        const NewDbUtil = class extends DbUtil { };
        NewDbUtil.initialize(options);
        return NewDbUtil;
    }
}
