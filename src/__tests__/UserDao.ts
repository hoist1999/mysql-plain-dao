import { BaseDAOWithUUID } from '../dao/BaseDAOWithUUID.js';
import { User } from './User.js';

export class UserDao extends BaseDAOWithUUID<User> {
    constructor() {
        super({
            table_name: 'user',
        });
    }
} 