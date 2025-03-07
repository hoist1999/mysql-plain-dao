import { BaseDaoDoubleID } from '../../dao/BaseDaoDoubleID';
/* tslint:disable */

import type { User } from './User';

export class UserDao extends BaseDaoDoubleID<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }

    // You can add your own methods below
}
