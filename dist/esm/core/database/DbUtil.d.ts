import mysql from "mysql2/promise";
import type { ParasType } from "../types/Types";
export declare class DatabaseError extends Error {
    sql?: string | undefined;
    params?: ParasType | undefined;
    originalError?: Error | undefined;
    constructor(message: string, sql?: string | undefined, params?: ParasType | undefined, originalError?: Error | undefined);
}
export type QueryResult<T> = T extends Array<infer U> ? U[] : T;
/**
 * Database CRUD utility class for MySQL/MariaDB
 * Provides connection pooling and type-safe database operations
 */
export declare class DbUtil {
    private static getGlobalPool;
    private static setGlobalPool;
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
    static initialize(config: mysql.PoolOptions): void;
    /**
     * Get the database connection pool
     * @returns The database connection pool
     */
    static getPool(): Promise<mysql.Pool>;
    /**
     * Get a database connection from the pool
     */
    static getConnection(): Promise<mysql.PoolConnection>;
    /** Release all connections and end the pool */
    static endPoolAsync(): Promise<void>;
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
    static queryAsync(sql: string, paras?: ParasType): Promise<[mysql.QueryResult, mysql.FieldPacket[]]>;
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
    static executeAsync<T extends mysql.QueryResult>(sql: string, paras?: ParasType): Promise<[T, mysql.FieldPacket[]]>;
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
    static executeInsertAsync(sql: string, paras?: ParasType): Promise<number | null>;
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
    static executeDeleteAsync(sql: string, paras?: ParasType): Promise<number>;
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
    static executeUpdateAsync(sql: string, paras?: ParasType): Promise<number>;
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
    static executeGetListAsync<T extends Record<string, any>>(sql: string, paras?: ParasType): Promise<QueryResult<T[]>>;
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
    static executeGetSingleAsync<T>(sql: string, paras?: ParasType): Promise<T | null>;
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
    static executeGetStringAsync(sql: string, paras?: ParasType): Promise<string | null>;
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
    static executeGetNumberAsync(sql: string, paras?: ParasType): Promise<number | null>;
    /**
     * Parse JSON data stored as LONGTEXT in MariaDB
     * @param data Single record or array of records containing JSON fields
     * @param field_name_data Field name(s) containing JSON data
     * @returns Parsed record(s) with JSON fields
     */
    static parseJson(data: Record<string, any> | Array<Record<string, any>>, field_name_data?: string | string[]): Record<string, any>[] | null;
    static removeFieldFromList(list: any[], field: string): any[];
    static withTransaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T>;
}
