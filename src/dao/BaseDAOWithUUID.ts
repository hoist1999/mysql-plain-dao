import type { InsertModel, PlainObject } from "./Types";
import { BaseDAO, type Option } from "./BaseDAO";
import { DbUtil } from "./DbUtil";
import { format } from "mysql2";

/** Base class for all DAO layers with UUID support
 * Extends basic CRUD capabilities by adding UUID column for enhanced data security
 */
export class BaseDAOWithUUID<T extends PlainObject> extends BaseDAO<T> {
	constructor(option: Option) {
		super(option);
	}

	/** Insert data with auto-generated UUID */
	async insertWithUuidAsync(item: InsertModel<T>): Promise<number | null> {
		const { uuid, ...newInsertItem } = item;
		const sql = format(`INSERT INTO ${this.option.table_name} SET uuid = uuid(), ?`, newInsertItem);
		const insertId = await DbUtil.executeInsertAsync(sql);
		return insertId;
	}

	/** Get single record by UUID */
	async getByUuidAsync(uuid: string): Promise<T | null> {
		const sql = `SELECT * FROM ${this.option.table_name} WHERE uuid = ?`;
		const item = await DbUtil.executeGetSingleAsync<T>(sql, [uuid]);
		if (item) {
			DbUtil.parseJson(item, "json_data");
		}
		return item;
	}

	/** Update record by UUID with provided object */
	async updateByUuidAsync(item: T) {
		const { uuid, ...updateItem } = item;
		const sql = format(
			`UPDATE ${this.option.table_name} SET ? WHERE uuid = ?`,
			[updateItem, uuid]
		);
		await DbUtil.executeAsync(sql);
	}

	/** Delete record by UUID */
	async deleteByUuidAsync(uuid: string) {
		const sql = `DELETE FROM ${this.option.table_name} WHERE uuid = ?`;
		let result = await DbUtil.executeAsync(sql, [uuid]);
		return result;
	}
}
