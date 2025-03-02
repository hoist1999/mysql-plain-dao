/* tslint:disable */

import { BaseDAO } from 'mysql-plain-dao';
import { User } from './User';

export class UserDao extends BaseDAO<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }
}
