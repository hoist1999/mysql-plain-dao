import { BaseDAOWithUUID } from '../dao/BaseDAOWithUUID';
import { User } from './User';

export class UserDao extends BaseDAOWithUUID<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }
} 