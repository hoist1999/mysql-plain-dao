/* tslint:disable */

import { BaseDao } from '../../core/dao/BaseDao';
import type { News, InsertNews } from './News';

export class NewsDao extends BaseDao<News, InsertNews> {
    constructor() {
        super({
            table_name: 'news',
        });
    }

    // You can add your own methods below
}
