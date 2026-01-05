import { escape, escapeId, format } from "mysql2";
import { v4 as uuidv4 } from 'uuid';
import { CommonDao, CommonDaoOption } from "./CommonDao";
import { DbUtil } from "../database/DbUtil";
import type { PlainObject } from "../types/Types";

export interface BaseDaoUUIDOption extends CommonDaoOption {
	uuid_field?: string;
}

/** DAO class for tables with UUID as primary key */
export class BaseDaoUUID<T extends PlainObject, InsertModelType extends PlainObject> extends CommonDao<T> {
	protected uuid_field: string;

	constructor(option: BaseDaoUUIDOption) {
		super(option);
		this.uuid_field = option.uuid_field !== undefined ? option.uuid_field : "uuid";
	}

	/** 
	 * Insert data with application-generated UUID
	 * @returns The generated UUID
	 */
	async insertAsync(item: InsertModelType): Promise<string> {
		const { [this.uuid_field]: uuid, ...newInsertItem } = item;
		const generatedUuid = uuidv4();
		const sql = format(
			`INSERT INTO ${this.table_name} SET ${this.uuid_field} = ?, ?`,
			[generatedUuid, newInsertItem]
		);
		await DbUtil.executeInsertAsync(sql);
		return generatedUuid;
	}

	/** Get single record by UUID */
	async getByUuidAsync(uuid: string): Promise<T | null> {
		const sql = `SELECT * FROM ${this.table_name} WHERE ${this.uuid_field} = ?`;
		const item = await DbUtil.executeGetSingleAsync<T>(sql, [uuid]);
		if (item) {
			DbUtil.parseJson(item, "json_data");
		}
		return item;
	}

	/** Update record with provided object */
	async updateAsync(item: T): Promise<number | null> {
		const { [this.uuid_field]: uuid, ...updateItem } = item;
		const sql = format(
			`UPDATE ${this.table_name} SET ? WHERE ${this.uuid_field} = ?`,
			[updateItem, uuid]
		);
		return await DbUtil.executeUpdateAsync(sql);
	}

	/** Bulk insert data: More efficient than inserting one by one.
	 * Execute a single SQL statement for all insertions.
	 * ~1.374s for 100k records 
	 * @returns Array of inserted items with their UUIDs */
	async bulkInsertAsync(item_list: Array<InsertModelType>): Promise<Array<T>> {
		if (!item_list || item_list.length == 0) {
			return [];
		}

		const items_with_uuid = item_list.map(item => ({
			[this.uuid_field]: uuidv4(),
			...item
		})) as Array<T>;

		const keys = [this.uuid_field, ...Object.keys(item_list[0])];

		// Double map to convert object array to SQL values
		const values_str = items_with_uuid
			.map(
				(item) =>
					`(${escape(item[this.uuid_field])}, ${Object.values(item)
						.filter((_val, index) => index > 0) // Skip the UUID as it's already added
						.map((val) => escape(val))
						.join(",")})`
			)
			.join(",");

		let sql = `INSERT INTO ${this.table_name}(${keys.map(k => escapeId(k)).join(',')}) VALUES ${values_str}`;

		await DbUtil.queryAsync(sql);
		return items_with_uuid;
	}

	/** Delete record by UUID */
	async deleteByUuidAsync(uuid: string) {
		const sql = `DELETE FROM ${this.table_name} WHERE ${this.uuid_field} = ?`;
		let result = await DbUtil.executeAsync(sql, [uuid]);
		return result;
	}
}
