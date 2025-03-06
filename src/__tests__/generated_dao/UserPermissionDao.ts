/* tslint:disable */

import { BaseDao } from '../../dao/BaseDao';
import type { UserPermission } from './UserPermission';

export class UserPermissionDao extends BaseDao<UserPermission> {
    constructor() {
        super({
            table_name: 'user_permission',
        });
    }

    // You can add your own methods below
}
