import { DbUtil } from '../dao/base/DbUtil';
import { UserDao } from './UserDao';
import { User } from './User';
import { InsertModel } from '../dao/Types';

describe('UserDao', () => {
    let userDao: UserDao;

    beforeAll(async () => {
        // 确保环境变量设置正确
        process.env.DB_HOST = 'localhost';
        process.env.DB_USER = 'root';
        process.env.DB_PASSWORD = 'test123';
        process.env.DB_DATABASE = 'test_db';

        userDao = new UserDao();
    });

    afterAll(async () => {
        await DbUtil.relaseConnectionPoolAsync();
    });

    beforeEach(async () => {
        // 清理表数据
        await DbUtil.executeAsync('DELETE FROM user');
    });

    it('should insert a new user', async () => {
        const user: InsertModel<User> = {
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            first_name: 'Test',
            last_name: 'User',
            is_active: true,
            role: 'user'
        };

        const insertId = await userDao.insertAsync(user);
        expect(insertId).toBeDefined();
        expect(insertId).toBeGreaterThan(0);

        const insertedUser = await userDao.getByIdAsync(insertId || 0);
        expect(insertedUser).toBeDefined();
        expect(insertedUser!.username).toBe(user.username);
        expect(insertedUser!.email).toBe(user.email);
    });
}); 