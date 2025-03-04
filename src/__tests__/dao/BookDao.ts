/* tslint:disable */

import { BaseDaoWithUUID } from '../../dao/BaseDaoWithUUID';
import type { Book } from './Book';

export class BookDao extends BaseDaoWithUUID<Book> {
    constructor() {
        super({
            table_name: 'book',
        });
    }

    // You can add your own methods below
}
