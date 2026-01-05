import { format } from "mysql2";
import { BaseDaoUUID, BaseDaoUUIDOption } from "./BaseDaoUUID";
import { DbUtil } from "../database/DbUtil";
import type { PlainObject } from "../types/Types";

export interface BaseDaoDoubleIDOption extends BaseDaoUUIDOption {
	id_field?: string;
}

/** DAO class for tables with both UUID and auto-increment ID */
export class BaseDaoDoubleID<T extends PlainObject, InsertModelType extends PlainObject> extends BaseDaoUUID<T, InsertModelType> {
	protected id_field: string;

	constructor(option: BaseDaoDoubleIDOption) {
		super(option);
		this.id_field = option.id_field !== undefined ? option.id_field : 'id';
	}

	/** Get single record by ID */
	async getByIdAsync(id: number): Promise<T | null> {
		const sql = `SELECT * FROM ${this.table_name} WHERE ${this.id_field} = ?`;
		const item = await DbUtil.executeGetSingleAsync<T>(sql, [id]);
		if (item) {
			DbUtil.parseJson(item, "json_data");
		}
		return item;
	}

	/** Update record with provided object */
	async updateAsync(item: T): Promise<number | null> {
		const { [this.id_field]: id, ...update_item } = item;
		const sql = format(
			`UPDATE ${this.table_name} SET ? WHERE ${this.id_field} = ?`,
			[update_item, id]
		);

		return await DbUtil.executeUpdateAsync(sql);
	}

	/** Delete record by ID */
	async deleteByIdAsync(id: number): Promise<number | null> {
		const sql = `DELETE FROM ${this.table_name} WHERE ${this.id_field} = ?`;
		let result = await DbUtil.executeDeleteAsync(sql, [id]);
		return result;
	}

	/**
	 * Get the numeric ID from the database using UUID
	 * @param uuid The UUID value
	 * @returns The numeric ID or null if not found
	 */
	async getIdFromUUIDAsync(uuid: string): Promise<number | null> {
		let sql = ` SELECT ${this.id_field} FROM ${this.table_name} WHERE ${this.uuid_field} = ? `;
		let para = [uuid];

		const id = await DbUtil.executeGetNumberAsync(sql, para);
		return id;
	}


	/**
	 * Get the UUID from the database using ID
	 * @param id The numeric ID
	 * @returns The UUID or null if not found
	 */
	async getUUIDFromIdAsync(id: number): Promise<string | null> {
		let sql = ` SELECT ${this.uuid_field} FROM ${this.table_name} WHERE ${this.id_field} = ? `;
		let para = [id];

		const uuid = await DbUtil.executeGetStringAsync(sql, para);
		return uuid;
	}
}
