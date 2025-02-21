import { DbUtil } from '../dao/base/DbUtil';
import { UserDao } from './UserDao';
import { User } from './User';
import { InsertModel } from '../dao/Types';
import { getDBConfig } from './DbConfig';

describe('UserDao', () => {
    let userDao: UserDao;

    beforeAll(async () => {
        // Use configuration from DbConfig
        const config = getDBConfig();
        process.env.DB_HOST = config.host;
        process.env.DB_USER = config.user;
        process.env.DB_PASSWORD = config.password;
        process.env.DB_DATABASE = config.database;
        process.env.DB_PORT = String(config.port);

        userDao = new UserDao();
    });

    afterAll(async () => {
        await DbUtil.relaseConnectionPoolAsync();
    });

    beforeEach(async () => {
        // Clear table data
        await DbUtil.executeAsync('DELETE FROM user');
    });

    it('should insert a new user', async () => {
        const user: InsertModel<User> = {
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            is_active: true,
            role: 'user',
            created_at: new Date(),
            updated_at: new Date()
        };

        const insertId = await userDao.insertAsync(user);
        expect(insertId).toBeDefined();
        expect(insertId).toBeGreaterThan(0);

        const insertedUser = await userDao.getByIdAsync(insertId || 0);
        expect(insertedUser).toBeDefined();
        expect(insertedUser!.uuid).toBeTruthy();
        expect(insertedUser!.username).toBe(user.username);
        expect(insertedUser!.email).toBe(user.email);
        expect(insertedUser!.role).toBe(user.role);
        expect(insertedUser!.is_active).toBe(user.is_active);
        expect(insertedUser!.created_at).toBeInstanceOf(Date);
        expect(insertedUser!.updated_at).toBeInstanceOf(Date);
    });
}); 