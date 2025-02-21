import SqlString from "sqlstring";
import { InsertModel, ParasType, PlainObject, SortCondition } from "../Types";
import { DbUtil } from "./DbUtil";
import { SqlUtil } from "./SqlUtil";

export interface Option {
    table_name: string;
    json_columns?: string[];
}

export interface PagerParams {
    /** 当前页面数字 */
    current?: number | string;
    /** 页面大小 */
    pageSize?: number | string;
    /** 排序方式 */
    orderPara?: SortCondition | string;
    /** Form表单中的搜索条件 */
    searchParams?: Record<string, string>;
}

/** 所有数据层DAO的基类，继承后立即获得基本的CRUD能力
 * @author hoist1999
 */
export class BaseDAO<T extends PlainObject> {
    protected option: Option;

    constructor(option: Option) {
        const DEFAULT_OPTION: Partial<Option> = {
            json_columns: [],
        };

        this.option = {
            ...DEFAULT_OPTION,
            ...option,
        };
    }

    /** 获得当前DAO对应的表名 */
    getTableName() {
        return this.option.table_name;
    }

    /** 获得数据集合 */
    protected async executeGetListAsync(
        sql: string,
        paras?: ParasType
    ): Promise<T[]> {
        return await DbUtil.executeGetListAsync(sql, paras);
    }

    /** 获得单个数据 */
    protected async executeGetSingleAsync(
        sql: string,
        paras?: ParasType
    ): Promise<T | null> {
        return await DbUtil.executeGetSingleAsync(sql, paras);
    }

    /** 插入数据 */
    async insertAsync(item: InsertModel<T>): Promise<number | null> {
        const sql = SqlString.format(
            `INSERT INTO ${this.option.table_name} SET ?`,
            item
        );
        const insertId = await DbUtil.executeInsertAsync(sql);
        return insertId;
    }

    /** 批量插入数据：比逐条插入的效率更高。
     * 拼好SQL后一次向mysql执行操作。
     * 10万条插入大约：1.374s */
    async bulkInsertAsync(item_list: Array<T | InsertModel<T>>) {
        if (!item_list || item_list.length == 0) {
            return;
        }
        // console.time('bulk_insert: 组装SQL时间');

        const keys = Object.keys(item_list[0]);

        //两层map，将对象数组转化为SQL的值
        const values_str = item_list
            .map(
                (item) =>
                    `(${Object.values(item)
                        .map((val) => SqlString.escape(val))
                        .join(",")})`
            )
            .join(",");

        let sql = ` INSERT INTO ${this.option.table_name}(${SqlString.escapeId(
            keys
        )}) VALUES ${values_str}`;
        // console.timeEnd('bulk_insert: 组装SQL时间');

        //console.log({ sql });

        // console.time('bulk_insert: SQL执行时间');
        await DbUtil.queryAsync(sql);
        // console.time('bulk_insert: SQL执行时间');

        // 下面注释不要删除：
        // 其他：因为Object.keys的顺序对插入的正确影响很大，我特别测试了，和sqlstring中的产生的一致。
        // //测试顺序Object.keys的key顺序和for in(sqlstring中使用的）的一致
        // var obj = {
        //     a : 1,
        //     b : 2,
        //     d : 3,
        //     c : 4,
        // }

        // console.log(Object.keys(obj));

        // for (var key in obj) {
        //     console.log({key});
        // }
    }

    /** 获得所有的数据列表 */
    async getListAsync(): Promise<Array<T>> {
        const sql = `SELECT * FROM ${this.option.table_name} `;
        const item_list = await DbUtil.executeGetListAsync<T>(sql);
        DbUtil.parseJson(item_list, "json_data");

        return item_list;
    }

    /** 使用id查询获得单个数据对象 */
    async getByIdAsync(id: number): Promise<T | null> {
        const sql = `SELECT * FROM ${this.option.table_name} WHERE id = ?`;
        const item = await DbUtil.executeGetSingleAsync<T>(sql, [id]);
        if (item) {
            DbUtil.parseJson(item, "json_data");
        }
        return item;
    }

    /** 传入对象以更新数据行 */
    async updateAsync(item: T): Promise<number | null> {
        const { id, ...update_item } = item;
        const sql = SqlString.format(
            `UPDATE ${this.option.table_name} SET ? WHERE id = ?`,
            [update_item, id]
        );

        return await DbUtil.executeUpdateAsync(sql);
    }

    /** 根据id删除数据行 */
    async deleteByIdAsync(id: number): Promise<number | null> {
        const sql = `DELETE FROM ${this.option.table_name} WHERE id = ?`;
        let result = await DbUtil.executeDeleteAsync(sql, [id]);
        return result;
    }

    /**
     * 获得当前表的排序列最大值加一
     * @param table_name
     * @returns
     */
    async getMaxSortOrderAsync(): Promise<number> {
        let sql = SqlString.format(
            `SELECT max(sort_order) AS max_sorder FROM ??`,
            [this.option.table_name]
        );
        let current_max_sort_order = await DbUtil.executeGetNumberAsync(sql) ?? 0;
        return current_max_sort_order + 1;
    }

    /**
     * 获取分页数据
     * 如果要用LEFT JOIN
     * 参考WarehouseDao的实现
     * @param fields 需要返回的列名称的数组
     * @param param1 分页的参数
     * @returns `{ list, total }`
     */
    protected async getPagerDataAsync(
        fields: string[] | string,
        where_str = "",
        {
            orderPara,
            current = 1,
            pageSize = 10,
        }: Omit<PagerParams, "searchParams">,
        join_table_str: string = ""
    ) {
        const fieldsStr = Array.isArray(fields)
            ? SqlString.escapeId(fields)
            : fields;

        let sql_list = `
			SELECT ${fieldsStr}
			FROM ${this.option.table_name}
            ${join_table_str}
			${where_str}
			${SqlUtil.orderBy(orderPara || '')}
			${SqlUtil.limitPager(current, pageSize)}
		`;


        //TODO：增加对json的处理
        //${DbUtil.sql_order_by(conditions)}

        const list = (await DbUtil.executeGetListAsync(sql_list)) as Array<T>;
        //DbUtil.parse_json(list, "json_data");

        //数据记录数量
        let sql_total = ` SELECT count(*) AS total FROM ${this.option.table_name} ${where_str} `;
        let total = await DbUtil.getTotalAsync(sql_total);

        return { list, total };
    }
}
