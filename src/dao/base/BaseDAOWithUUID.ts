import SqlString from "sqlstring";
import { InsertModel, PlainObject } from "../Types";
import { BaseDAO, Option } from "./BaseDAO";
import { DbUtil } from "./DbUtil";


/** 所有数据层DAO的基类，继承后立即获得基本的CRUD能力
 * （在整型PrimaryKey基础上，增加一列UUID提高数据安全性）
 * @author hoist1999
 */
export class BaseDAOWithUUID<T extends PlainObject> extends BaseDAO<T> {
	constructor(option: Option) {
		super(option);
	}

	/** 插入数据 */
	async insertWithUuidAsync(item: InsertModel<T>): Promise<number | null> {
		const { uuid, ...newInsertItem } = item;
		const sql = SqlString.format(`INSERT INTO ${this.option.table_name} SET uuid = uuid(), ?`, newInsertItem);
		const insertId = await DbUtil.executeInsertAsync(sql);
		return insertId;
	}

	/** 使用uuid查询获得单个数据对象 */
	async getByUuidAsync(uuid: string): Promise<T | null> {
		const sql = `SELECT * FROM ${this.option.table_name} WHERE uuid = ?`;
		const item = await DbUtil.executeGetSingleAsync<T>(sql, [uuid]);
		if (item) {
			DbUtil.parseJson(item, "json_data");
		}
		return item;
	}

	/** 使用uuid用传入对象更新数据行 */
	async updateByUuidAsync(item: T) {
		const { uuid, ...updateItem } = item;
		const sql = SqlString.format(
			`UPDATE ${this.option.table_name} SET ? WHERE uuid = ?`,
			[updateItem, uuid]
		);
		await DbUtil.executeAsync(sql);
	}

	/** 根据uuid删除数据行 */
	async deleteByUuidAsync(uuid: string) {
		const sql = `DELETE FROM ${this.option.table_name} WHERE uuid = ?`;
		let result = await DbUtil.executeAsync(sql, [uuid]);
		return result;
	}
}
