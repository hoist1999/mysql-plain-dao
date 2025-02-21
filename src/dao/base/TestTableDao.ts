import { BaseDAOWithUUID } from '../base/BaseDAOWithUUID';
import { TestTable } from './TestTable';
/*
 * Table Name: test_table
 */
export class TestTableDao extends BaseDAOWithUUID<TestTable> {
	constructor() {
		super({
			table_name: 'test_table',
		});
	}
}
