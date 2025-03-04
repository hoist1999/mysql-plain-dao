import type { InsertModel, PlainObject } from "./Types";
import { BaseDao, type BaseDaoOption } from "./BaseDao";
import { DbUtil } from "./DbUtil";
import { escapeId, format, escape } from "mysql2";
import { v4 as uuidv4 } from 'uuid';

export interface BaseDaoWithUuidOption extends BaseDaoOption {
	/**
	 * The field name for UUID in the database table
	 * Default is 'uuid' if not specified
	 * Example: 'uuid', 'guid', 'unique_id'
	 */
	uuidField?: string;

	/**
	 * Whether to use an auto-increment number ID as primary key along with UUID
	 * - If true: table will have both UUID and auto-increment ID
	 * - If false: table will use UUID as primary key
	 * Default is false
	 */
	alsoUseNumberId?: boolean;
}

/** Base class for all DAO layers with UUID support
 * Extends basic CRUD capabilities by adding UUID column for enhanced data security
 */
export class BaseDaoWithUUID<T extends PlainObject> extends BaseDao<T> {
	protected uuid_field: string;
	protected also_use_number_id: boolean;

	constructor(option: BaseDaoWithUuidOption) {
		super(option);
		this.uuid_field = option.uuidField !== undefined ? option.uuidField : "uuid";
		this.also_use_number_id = option.alsoUseNumberId !== undefined ? option.alsoUseNumberId : false;
	}

	/** 
	 * Insert data with application-generated UUID
	 * @returns The generated UUID
	 */
	async insertWithUuidAsync(item: InsertModel<T>): Promise<string> {
		const { [this.uuid_field]: uuid, ...newInsertItem } = item;
		const generatedUuid = uuidv4();
		const sql = format(
			`INSERT INTO ${this.tableName} SET ${this.uuid_field} = ?, ?`,
			[generatedUuid, newInsertItem]
		);
		await DbUtil.executeInsertAsync(sql);
		return generatedUuid;
	}

	/** Bulk insert data: More efficient than inserting one by one.
	 * Execute a single SQL statement for all insertions.
	 * ~1.374s for 100k records */
	async bulkInsertWithUuidAsync(item_list: Array<T | InsertModel<T>>) {
		if (!item_list || item_list.length == 0) {
			return;
		}

		const keys = [this.uuid_field, ...Object.keys(item_list[0])];

		// Double map to convert object array to SQL values
		const values_str = item_list
			.map(
				(item) =>
					`(uuid(), ${Object.values(item)
						.map((val) => escape(val))
						.join(",")})`
			)
			.join(",");

		let sql = `INSERT INTO ${this.tableName}(${keys.map(k => escapeId(k)).join(',')}) VALUES ${values_str}`;

		await DbUtil.queryAsync(sql);
	}

	/** Get single record by UUID */
	async getByUuidAsync(uuid: string): Promise<T | null> {
		const sql = `SELECT * FROM ${this.tableName} WHERE ${this.uuid_field} = ?`;
		const item = await DbUtil.executeGetSingleAsync<T>(sql, [uuid]);
		if (item) {
			DbUtil.parseJson(item, "json_data");
		}
		return item;
	}

	/** Update record by UUID with provided object */
	async updateByUuidAsync(item: T) {
		const { [this.uuid_field]: uuid, ...updateItem } = item;
		const sql = format(
			`UPDATE ${this.tableName} SET ? WHERE ${this.uuid_field} = ?`,
			[updateItem, uuid]
		);
		await DbUtil.executeAsync(sql);
	}

	/** Delete record by UUID */
	async deleteByUuidAsync(uuid: string) {
		const sql = `DELETE FROM ${this.tableName} WHERE ${this.uuid_field} = ?`;
		let result = await DbUtil.executeAsync(sql, [uuid]);
		return result;
	}
}
