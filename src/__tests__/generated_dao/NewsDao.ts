/* tslint:disable */

import { BaseDao } from '../../dao/BaseDao';
import type { News } from './News';

export class NewsDao extends BaseDao<News> {
    constructor() {
        super({
            table_name: 'news',
        });
    }

    // You can add your own methods below
}
