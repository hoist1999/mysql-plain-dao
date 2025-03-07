/* tslint:disable */

import type { Book, InsertBook } from './Book';
import { BaseDaoUUID } from '../../dao/BaseDaoUUID';

export class BookDao extends BaseDaoUUID<Book, InsertBook> {
    constructor() {
        super({
            table_name: 'book',
        });
    }

    // You can add your own methods below
}
