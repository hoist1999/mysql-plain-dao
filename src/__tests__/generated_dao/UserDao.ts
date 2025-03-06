/* tslint:disable */

import { BaseDaoDoubleId } from '../../dao/BaseDaoDoubleId';
import type { User } from './User';

export class UserDao extends BaseDaoDoubleId<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }

    // You can add your own methods below
}
