/* tslint:disable */

import { BaseDAO } from 'mysql-plain-dao';
import type { User } from './User';

export class UserDao extends BaseDAO<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }

    // You can add your own methods below
}
