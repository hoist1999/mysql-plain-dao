import { format } from "mysql2";
import { BaseDaoUuid, BaseDaoUuidOption } from "./BaseDaoUuid";
import { DbUtil } from "./DbUtil";
import type { PlainObject } from "./Types";

export interface BaseDaoDoubleIdOption extends BaseDaoUuidOption {
}

/** DAO class for tables with both UUID and auto-increment ID */
export class BaseDaoDoubleId<T extends PlainObject> extends BaseDaoUuid<T> {
	constructor(option: BaseDaoDoubleIdOption) {
		super(option);
	}

	/** Get single record by ID */
	async getByIdAsync(id: number): Promise<T | null> {
		const sql = `SELECT * FROM ${this.tableName} WHERE ${this.idField} = ?`;
		const item = await DbUtil.executeGetSingleAsync<T>(sql, [id]);
		if (item) {
			DbUtil.parseJson(item, "json_data");
		}
		return item;
	}

	/** Update record with provided object */
	async updateAsync(item: T): Promise<number | null> {
		const { [this.idField]: id, ...update_item } = item;
		const sql = format(
			`UPDATE ${this.tableName} SET ? WHERE ${this.idField} = ?`,
			[update_item, id]
		);

		return await DbUtil.executeUpdateAsync(sql);
	}

	/** Delete record by ID */
	async deleteByIdAsync(id: number): Promise<number | null> {
		const sql = `DELETE FROM ${this.tableName} WHERE ${this.idField} = ?`;
		let result = await DbUtil.executeDeleteAsync(sql, [id]);
		return result;
	}
}
