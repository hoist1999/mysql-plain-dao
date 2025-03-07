/* tslint:disable */

import { BaseDaoDoubleID } from '../../dao/BaseDaoDoubleID';
import type { InsertUser, User } from './User';

export class UserDao extends BaseDaoDoubleID<User, InsertUser> {
    constructor() {
        super({
            table_name: 'user',
        });
    }

    // You can add your own methods below
}
