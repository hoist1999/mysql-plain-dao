"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbUtil = exports.DatabaseError = void 0;
const debug_1 = __importDefault(require("debug"));
const lodash_1 = __importDefault(require("lodash"));
const promise_1 = __importDefault(require("mysql2/promise"));
const debug = (0, debug_1.default)("DAO");
class DatabaseError extends Error {
    sql;
    params;
    originalError;
    constructor(message, sql, params, originalError) {
        super(message);
        this.sql = sql;
        this.params = params;
        this.originalError = originalError;
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
// Define a Symbol for the pool key
const POOL_KEY = Symbol.for('mysql-plain-dao:pool');
/**
 * Database CRUD utility class for MySQL/MariaDB
 * Provides connection pooling and type-safe database operations
 */
class DbUtil {
    static getGlobalPool() {
        return global[POOL_KEY];
    }
    static setGlobalPool(pool) {
        global[POOL_KEY] = pool;
    }
    /**
     * Initialize database connection pool
     * Supports both connection URI string and PoolOptions object
     *
     * @example Using connection URI
     * ```typescript
     * DbUtil.initialize({ uri: 'mysql://user:pass@localhost:3306/db_name' });
     * ```
     *
     * @example Using PoolOptions
     * ```typescript
     * DbUtil.initialize({
     *   host: 'localhost',
     *   user: 'root',
     *   password: 'password',
     *   database: 'db_name',
     *   connectionLimit: 10,
     *   queueLimit: 0
     * });
     * ```
     *
     * Default options:
     * - connectionLimit: 10
     * - queueLimit: 0
     * - waitForConnections: true
     * - decimalNumbers: true (converts MySQL DECIMAL to JS number)
     * - namedPlaceholders: true (enables :name style parameters)
     */
    static initialize(config) {
        if (this.getGlobalPool()) {
            return;
        }
        const poolConfig = {
            namedPlaceholders: true,
            debug: false,
            ...config,
        };
        // mysql2 debug dumps handshake packets and stack traces; opt in with MYSQL2_DEBUG=1
        if (process.env.MYSQL2_DEBUG !== '1') {
            poolConfig.debug = false;
        }
        const pool = promise_1.default.createPool(poolConfig);
        this.setGlobalPool(pool);
    }
    /**
     * Get the database connection pool
     * @returns The database connection pool
     */
    static async getPool() {
        if (!this.getGlobalPool()) {
            throw new Error('Database pool not initialized. Call DbUtil.initialize() first.');
        }
        return this.getGlobalPool();
    }
    /**
     * Get a database connection from the pool
     */
    static async getConnection() {
        const pool = await this.getPool();
        const conn = await pool.getConnection();
        return conn;
    }
    /** Release all connections and end the pool */
    static async endPoolAsync() {
        const pool = this.getGlobalPool();
        if (pool) {
            await pool.end();
            delete global[POOL_KEY];
            debug("Pool ended");
        }
    }
    /** Execute SQL using TEXT protocol without prepared statements.
     *
     * @description
     * - Uses MySQL TEXT protocol (simple query)
     * - No prepared statements, performs direct query execution
     * - Better performance for:
     *   - Very large SQL statements
     *   - Queries with many parameters
     *   - One-time query execution
     * - Less protection against SQL injection compared to executeAsync()
     *
     * @example
     * ```typescript
     * // Basic SELECT query
     * const [rows] = await DbUtil.queryAsync(
     *   'SELECT * FROM large_table WHERE status = "active"'
     * );
     *
     * // Complex query with multiple JOINs
     * const [rows] = await DbUtil.queryAsync(`
     *   SELECT u.*, p.*, a.*
     *   FROM users u
     *   LEFT JOIN profiles p ON u.id = p.user_id
     *   LEFT JOIN addresses a ON u.id = a.user_id
     *   WHERE u.status = ? AND p.verified = ?
     * `, ['active', true]);
     *
     * // Bulk INSERT
     * const values = users.map(u => `('${u.name}', '${u.email}')`).join(',');
     * const [result] = await DbUtil.queryAsync(`
     *   INSERT INTO users (name, email) VALUES ${values}
     * `);
     * ```
     */
    static async queryAsync(sql, paras) {
        try {
            debug("=== Executing SQL Query: Query Method ===");
            debug("sql:", sql);
            debug("paras:", paras);
            const conn = await this.getConnection();
            let result = await conn.query(sql, paras);
            // Return the connection back to the pool
            // This is crucial to prevent connection leaks and pool exhaustion
            conn.release();
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("=== Error Executing Database Query ===");
            console.error(message);
            console.error("sql:", sql);
            console.error("paras:", paras);
            throw error;
        }
    }
    /** Execute SQL using binary protocol with prepared statements.
     *
     * @description
     * - Uses MySQL binary protocol with prepared statements
     * - Provides strong SQL injection protection
     * - Better performance for:
     *   - Repeated execution of the same SQL
     *   - Queries with few parameters
     *   - When parameter values contain special characters
     * - Automatically handles parameter escaping
     *
     * @see {@link https://github.com/sidorares/node-mysql2/issues/796#issuecomment-397326698}
     *
     * @example
     * ```typescript
     * // Basic SELECT with placeholder
     * const [rows] = await DbUtil.executeAsync<UserRow[]>(
     *   'SELECT * FROM users WHERE id = ?',
     *   [userId]
     * );
     *
     * // INSERT with named parameters
     * const [result] = await DbUtil.executeAsync<ResultSetHeader>(
     *   'INSERT INTO users (name, email) VALUES (:name, :email)',
     *   { name: 'John', email: 'john@example.com' }
     * );
     *
     * // UPDATE with multiple conditions
     * const [result] = await DbUtil.executeAsync<ResultSetHeader>(
     *   'UPDATE users SET status = ? WHERE created_at < ? AND verified = ?',
     *   ['inactive', '2023-01-01', false]
     * );
     *
     * // Repeated execution (prepared statement is reused)
     * for (const user of users) {
     *   await DbUtil.executeAsync(
     *     'INSERT INTO audit_log (user_id, action) VALUES (?, ?)',
     *     [user.id, 'login']
     *   );
     * }
     * ```
     */
    static async executeAsync(sql, paras) {
        try {
            debug("=== Executing SQL Query: Execute Method ===");
            debug("sql:", sql);
            debug("paras:", paras);
            const conn = await this.getConnection();
            let result = await conn.execute(sql, paras);
            // Return the connection back to the pool
            // This is crucial to prevent connection leaks and pool exhaustion
            conn.release();
            debug("result:", result);
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("=== Error Executing Database Query ===");
            console.error(message);
            console.error("sql:", sql);
            console.error("paras:", paras);
            throw new DatabaseError('Database query execution failed', sql, paras, error instanceof Error ? error : undefined);
        }
    }
    /** Insert data and return the inserted ID
     *
     * @description
     * Uses prepared statements for safe parameter handling
     *
     * @returns
     * - The auto-generated ID of the inserted row
     * - null if the insert operation failed or no ID was generated
     *
     * @example
     * ```typescript
     * // Basic INSERT
     * const userId = await DbUtil.executeInsertAsync(
     *   'INSERT INTO users (name, email) VALUES (?, ?)',
     *   ['John Doe', 'john@example.com']
     * );
     *
     * // INSERT with named parameters
     * const orderId = await DbUtil.executeInsertAsync(
     *   'INSERT INTO orders (user_id, total, status) VALUES (:userId, :total, :status)',
     *   { userId: 1, total: 99.99, status: 'pending' }
     * );
     * ```
     */
    static async executeInsertAsync(sql, paras) {
        const [result] = await this.executeAsync(sql, paras);
        // 只需要检查 result 存在即可，因为成功的 INSERT 一定会返回 ResultSetHeader
        if (result) {
            return result.insertId;
        }
        return null;
    }
    /** Delete data and return the number of affected rows
     *
     * @description
     * Returns the number of rows affected by the DELETE operation
     * Returns null if no rows were affected
     *
     * @example
     * ```typescript
     * // Delete single record
     * const affected = await DbUtil.executeDeleteAsync(
     *   'DELETE FROM users WHERE id = ?',
     *   [userId]
     * );
     *
     * // Delete multiple records with conditions
     * const deleted = await DbUtil.executeDeleteAsync(
     *   'DELETE FROM orders WHERE status = ? AND created_at < ?',
     *   ['completed', '2023-01-01']
     * );
     * ```
     */
    static async executeDeleteAsync(sql, paras) {
        const [result] = await this.executeAsync(sql, paras);
        if (!result)
            return 0;
        else {
            return result.affectedRows;
        }
    }
    /** Update data and return the number of affected rows
     *
     * @description
     * Returns the number of rows affected by the UPDATE operation
     * Returns null if no rows were affected
     *
     * @example
     * ```typescript
     * // Update single record
     * const affected = await DbUtil.executeUpdateAsync(
     *   'UPDATE users SET status = ? WHERE id = ?',
     *   ['active', userId]
     * );
     *
     * // Update multiple records with named parameters
     * const updated = await DbUtil.executeUpdateAsync(
     *   'UPDATE products SET price = :newPrice WHERE category = :category',
     *   { newPrice: 29.99, category: 'books' }
     * );
     * ```
     */
    static async executeUpdateAsync(sql, paras) {
        const [result] = await this.executeAsync(sql, paras);
        if (!result) {
            return 0;
        }
        else {
            return result.affectedRows;
        }
    }
    /** Get a list of records matching the query
     *
     * @description
     * Returns an array of records matching the query
     * Returns empty array if no records found
     *
     * @example
     * ```typescript
     * // Get all active users
     * interface User {
     *   id: number;
     *   name: string;
     *   email: string;
     * }
     *
     * const users = await DbUtil.executeGetListAsync<User>(
     *   'SELECT * FROM users WHERE status = ?',
     *   ['active']
     * );
     *
     * // Get orders with conditions
     * interface Order {
     *   id: number;
     *   total: number;
     *   status: string;
     * }
     *
     * const orders = await DbUtil.executeGetListAsync<Order>(
     *   'SELECT * FROM orders WHERE user_id = :userId AND total > :minTotal',
     *   { userId: 1, minTotal: 100 }
     * );
     * ```
     */
    static async executeGetListAsync(sql, paras) {
        const [rows] = await this.executeAsync(sql, paras);
        return (rows.length > 0 ? rows : []);
    }
    /** Get a single record matching the query
     *
     * @description
     * Returns a single record matching the query
     * Returns null if no record found
     * Throws DatabaseError if multiple records found
     *
     * @example
     * ```typescript
     * // Get user by id
     * interface User {
     *   id: number;
     *   name: string;
     *   email: string;
     * }
     *
     * const user = await DbUtil.executeGetSingleAsync<User>(
     *   'SELECT * FROM users WHERE id = ?',
     *   [userId]
     * );
     *
     * // Get order with named parameters
     * interface Order {
     *   id: number;
     *   status: string;
     *   total: number;
     * }
     *
     * const order = await DbUtil.executeGetSingleAsync<Order>(
     *   'SELECT * FROM orders WHERE order_number = :orderNum',
     *   { orderNum: 'ORD-2024-001' }
     * );
     * ```
     */
    static async executeGetSingleAsync(sql, paras) {
        const [rows] = await this.executeAsync(sql, paras);
        if (rows.length === 0) {
            return null;
        }
        else if (rows.length === 1) {
            return rows[0];
        }
        else {
            throw new DatabaseError('Multiple results found when single result expected', sql, paras);
        }
    }
    /**
     * Get a single string value from the first column of the first row
     *
     * @description
     * Useful for queries that return a single string value like:
     * - Getting a user's name
     * - Getting a status value
     * - Getting a single text field
     *
     * @throws {DatabaseError} When:
     * - Multiple rows are returned
     * - The value is not a string
     *
     * @returns
     * - The string value if found
     * - null if no rows found or value is null
     *
     * @example Get user's name
     * ```typescript
     * const name = await DbUtil.executeGetStringAsync(
     *   'SELECT name FROM users WHERE id = ?',
     *   [userId]
     * );
     * ```
     */
    static async executeGetStringAsync(sql, paras) {
        const [rows, fields] = await this.executeAsync(sql, paras);
        if (rows.length === 0)
            return null;
        if (rows.length > 1) {
            throw new DatabaseError('Multiple results found when single result expected', sql, paras);
        }
        const field_name = fields[0].name;
        const val = rows[0][field_name];
        if (val === null || val === undefined)
            return null;
        if (lodash_1.default.isString(val))
            return val;
        throw new DatabaseError('Return value is not of type string', sql, paras);
    }
    /**
     * Get a single number value from the first column of the first row
     *
     * @description
     * Useful for queries that return a single numeric value like:
     * - COUNT() results
     * - SUM() results
     * - Numeric field values
     *
     * @throws {DatabaseError} When:
     * - Multiple rows are returned
     * - The value is not a number
     *
     * @returns
     * - The number value if found
     * - null if no rows found or value is null
     *
     * @example Get total count
     * ```typescript
     * const count = await DbUtil.executeGetNumberAsync(
     *   'SELECT COUNT(*) FROM orders WHERE status = ?',
     *   ['pending']
     * );
     * ```
     */
    static async executeGetNumberAsync(sql, paras) {
        const [rows, fields] = await this.executeAsync(sql, paras);
        if (rows.length === 0)
            return null;
        if (rows.length > 1) {
            throw new DatabaseError('Multiple results found when single result expected', sql, paras);
        }
        const field_name = fields[0].name;
        const val = rows[0][field_name];
        if (val === null || val === undefined)
            return null;
        if (lodash_1.default.isNumber(val))
            return val;
        throw new DatabaseError('Return value is not of type number', sql, paras);
    }
    /**
     * Parse JSON data stored as LONGTEXT in MariaDB
     * @param data Single record or array of records containing JSON fields
     * @param field_name_data Field name(s) containing JSON data
     * @returns Parsed record(s) with JSON fields
     */
    static parseJson(data, field_name_data = "json_data") {
        if (!data) {
            return null;
        }
        let row_list;
        let field_list = null;
        if (!Array.isArray(data)) {
            row_list = [data];
        }
        else {
            row_list = data;
        }
        if (!Array.isArray(field_name_data)) {
            field_list = [field_name_data];
        }
        else {
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
    static removeFieldFromList(list, field) {
        for (let row of list) {
            delete row[field];
        }
        return list;
    }
    static async withTransaction(callback) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            // Return the connection back to the pool
            // This is crucial to prevent connection leaks and pool exhaustion
            connection.release();
        }
    }
}
exports.DbUtil = DbUtil;
//# sourceMappingURL=DbUtil.js.map