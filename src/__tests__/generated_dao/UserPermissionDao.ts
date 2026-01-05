/* tslint:disable */

import { BaseDao } from '../../core/dao/BaseDao';
import type { UserPermission, InsertUserPermission } from './UserPermission';

export class UserPermissionDao extends BaseDao<UserPermission, InsertUserPermission> {
    constructor() {
        super({
            table_name: 'user_permission',
        });
    }

    // You can add your own methods below
}
