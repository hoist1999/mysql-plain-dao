/* tslint:disable */

import type { Book } from './Book';
import { BaseDaoUUID } from '../../dao/BaseDaoUUID';

export class BookDao extends BaseDaoUUID<Book> {
    constructor() {
        super({
            table_name: 'book',
        });
    }

    // You can add your own methods below
}
