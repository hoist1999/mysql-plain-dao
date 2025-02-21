import debug_func from "debug";
import dotenvFlow from 'dotenv-flow';
import { isString } from "lodash";
import mysql from "mysql2/promise";
import SqlString from "sqlstring";
import { isNumber, isOkPacket, isRowDataPacketList } from "../TypeGuard";
import { ParasType } from "../Types";
dotenvFlow.config();

const debug = debug_func("VCU");

/** 操作数据库CRUD工具类
 *  @author hoist1999
 */
export class DbUtil {
    private static pool: mysql.Pool | null = null;

    /** 
     * 获取连接池 
     * 数据库的配置在.env .env.test .env.production 文件中配置
    */
    static async getPool() {
        if (!this.pool) {
            if (!process.env.DB_PASSWORD) {
                throw new Error("DB_PASSWORD is not set");
            }

            if (!process.env.DB_DATABASE) {
                throw new Error("DB_DATABASE is not set");
            }

            this.pool = mysql.createPool({
                host: process.env.DB_HOST || '127.0.0.1',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
                connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
                queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),

                timezone: "+08:00",

                // 开启这个选项，decimal数据类型返回的会转化为数字类型（float）
                // https://github.com/sidorares/node-mysql2/blob/bc280518b4bac3212ecfe48c20955354fff38aa6/documentation/Readme.md#known-incompatibilities-with-node-mysql
                decimalNumbers: true,

                // https://github.com/sidorares/node-mysql2/blob/07a429d9765dcbb24af4264654e973847236e0de/documentation/Extras.md
                // 开启命名化参数的支持： connection.execute('select :x + :y as z', { x: 1, y: 2 })
                namedPlaceholders: true,
            });
        }
        return this.pool;
    }

    /** 结束连接池 */
    static async relaseConnectionPoolAsync() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null; // 清空pool引用
        }
    }

    /** query方式执行，以TEXT协议传送给mysql，
     * 内部不做prepared，
     * 在执行非常大的SQL语句时候有优势。 */
    static async queryAsync(sql: string, paras?: ParasType) {
        try {
            debug("===正在执行SQL查询: query方式 ===");
            debug("sql:", sql);
            debug("paras:", paras);
            const pool = await this.getPool();
            let result = await pool.query(sql, paras);
            return result;
        } catch (error) {
            debug("===执行数据库查询过程中发生错误===");
            debug("sql:", sql);
            debug("paras:", paras);
            debug("错误信息: ", error);
            return null;
        }
    }

    /** execute方式执行，以二进制协议传送给mysql，内部做prepared。
     * 占位参数少的情况下，和query的性能差不多，同一个SQL多次执行时有优势。
     * 占位参数多的情况下，用query性能会更好。
     * 参考：https://github.com/sidorares/node-mysql2/issues/796#issuecomment-397326698
     */
    static async executeAsync(sql: string, paras?: ParasType) {
        try {
            debug("===正在执行SQL查询: execute方式 ===");
            debug("sql:", sql);
            debug("paras:", paras);
            const pool = await this.getPool();
            let result = await pool.query(sql, paras);
            return result;
        } catch (error) {
            console.error("===执行数据库查询过程中发生错误===");
            console.error(error);
            console.error("sql:", sql);
            console.error("paras:", paras);
            return null;
        }
    }

    /** 插入数据 */
    static async executeInsertAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        const result = await DbUtil.executeAsync(sql, paras);
        if (!result) return null;
        const [rows] = result;
        if (isOkPacket(rows)) {
            return rows.insertId;
        }
        return null;
    }

    /** 删除数据 */
    static async executeDeleteAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        const result = await DbUtil.executeAsync(sql, paras);
        if (!result) return null;
        const [rows] = result;
        if (isOkPacket(rows)) {
            return rows.affectedRows;
        }
        return null;
    }

    /** 更新数据 */
    static async executeUpdateAsync(
        sql: string,
        paras?: ParasType
    ): Promise<number | null> {
        const result = await DbUtil.executeAsync(sql, paras);
        if (!result) return null;
        const [rows] = result;
        if (isOkPacket(rows)) {
            return rows.affectedRows;
        }
        return null;
    }

    /** 获得数据集合 */
    static async executeGetListAsync<T>(
        sql: string,
        paras?: ParasType
    ): Promise<T[]> {
        const result = await DbUtil.executeAsync(sql, paras);
        if (!result) return [];
        const [item_list] = result;
        if (isRowDataPacketList(item_list)) {
            return item_list as T[];
        }
        return [];
    }

    /** 获得单行数据 */
    static async executeGetSingleAsync<T>(
        sql: string,
        paras?: ParasType
    ): Promise<T | null> {
        const result = await DbUtil.executeAsync(sql, paras);
        if (!result) return null;
        const [item_list] = result;
        if (isRowDataPacketList(item_list)) {
            if (item_list.length === 1) {
                return item_list[0] as T;
            } else if (item_list.length === 0) {
                return null;
            }
            throw new Error(`数据库查询返回结果数量大于1，请检查SQL: ${sql}`);
        }
        return null;
    }

    /** 获得单个值 */
    static async executeGetValueAsync(
        sql: string,
        paras?: ParasType
    ): Promise<string | number | null> {
        const result = await DbUtil.executeAsync(sql, paras);
        if (!result) return null;
        const [item_list, fields] = result;

        if (isRowDataPacketList(item_list)) {
            if (item_list.length === 1) {
                const field_name = fields[0].name;
                let val = item_list ? item_list[0][field_name] : 0;
                return val;
            } else if (item_list.length === 0) {
                return null;
            }
            throw new Error(`数据库查询返回结果数量大于1，请检查SQL: ${sql}`);
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
            throw new Error("返回结果不是string类型");
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
            throw new Error("返回结果不是number类型");
        }
    }

    //Mariadb 自身没有JSON类型，只有LONGTEXT类型，所以只能手动做解释
    //data 和 field_name_data 均可以接受单个数据或者数组类型
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
     * 获得结果的总数量
     * @param sql 例如SELECT count(*) AS total FROM ...
     */
    static async getTotalAsync(sql: string): Promise<number> {
        let total = await DbUtil.executeGetNumberAsync(sql);
        return total ?? 0;
    }

    /**
     * 获得某个表的排序列最大值加一
     * @param table_name
     * @returns
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
     * 根据uuid，从数据库中查找到真实的整数id
     * @param target_type 需要查找UUID的目标表格名
     * @param target_uuid UUID值
     * @returns
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
                debug("发生错误，UUID不唯一");
            }
        }
        return null;
    }
}
