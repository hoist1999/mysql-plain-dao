import { BaseDaoWithUUID } from '../../dao/BaseDaoWithUUID';
import type { User } from './User';

export class UserDao extends BaseDaoWithUUID<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }
} 