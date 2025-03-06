/* tslint:disable */

import type { Book } from './Book';
import { BaseDaoUuid } from '../../dao/BaseDaoUuid';

export class BookDao extends BaseDaoUuid<Book> {
    constructor() {
        super({
            table_name: 'book',
        });
    }

    // You can add your own methods below
}
