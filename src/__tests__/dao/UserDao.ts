import { BaseDAOWithUUID } from '../../dao/BaseDAOWithUUID';
import type { User } from './User';

export class UserDao extends BaseDAOWithUUID<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }
} 