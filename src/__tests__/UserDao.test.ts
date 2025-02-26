import debug_func from "debug";
import { getDbConfigFromEnv } from "../dao/DbConfigLoader";
import { DbUtil } from '../dao/DbUtil';
import { InsertModel } from '../dao/Types';
import { User } from './User';
import { UserDao } from './UserDao';

const debug = debug_func("DAO");

describe('UserDao', () => {
    let userDao: UserDao;
    let testUser: InsertModel<User>;

    beforeAll(async () => {
        await DbUtil.initialize(getDbConfigFromEnv());

        userDao = new UserDao();
    });

    afterAll(async () => {
        await DbUtil.endPoolAsync();
    });

    beforeEach(async () => {
        // Clear table data
        await DbUtil.executeAsync('DELETE FROM user');

        // Prepare test user data with all possible fields from schema
        testUser = {
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            first_name: 'Test',
            last_name: 'User',
            phone: '+1234567890',
            is_active: true,
            role: 'user',
            last_login: new Date(),
            created_at: new Date(),
            updated_at: new Date()
        };
    });

    describe('Create operations', () => {
        it('should insert a new user with UUID and timestamps', async () => {
            const beforeInsert = new Date();
            const insertId = await userDao.insertWithUuidAsync(testUser);
            const afterInsert = new Date();

            const insertedUser = await userDao.getByIdAsync(insertId!);
            expect(insertedUser).toBeDefined();

            // Test all fields including timestamps
            expect(insertedUser!.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(insertedUser!.username).toBe(testUser.username);
            expect(insertedUser!.email).toBe(testUser.email);
            expect(insertedUser!.first_name).toBe(testUser.first_name);
            expect(insertedUser!.last_name).toBe(testUser.last_name);
            expect(insertedUser!.phone).toBe(testUser.phone);
            expect(Boolean(insertedUser!.is_active)).toBe(testUser.is_active);
            expect(insertedUser!.role).toBe(testUser.role);
            expect(insertedUser!.last_login).toBeInstanceOf(Date);

            // Timestamp checks - round to seconds for MySQL DATETIME compatibility
            const beforeInsertSeconds = Math.floor(beforeInsert.getTime() / 1000) * 1000;
            const afterInsertSeconds = Math.ceil(afterInsert.getTime() / 1000) * 1000;
            const createdAtTime = insertedUser!.created_at.getTime();
            const updatedAtTime = insertedUser!.updated_at.getTime();

            expect(createdAtTime).toBeGreaterThanOrEqual(beforeInsertSeconds);
            expect(createdAtTime).toBeLessThanOrEqual(afterInsertSeconds);
            expect(updatedAtTime).toBe(createdAtTime);
        });
    });

    describe('Read operations', () => {
        let insertedId: number;
        let insertedUuid: string;

        beforeEach(async () => {
            insertedId = await userDao.insertWithUuidAsync(testUser) || 0;
            const user = await userDao.getByIdAsync(insertedId);
            insertedUuid = user!.uuid;
        });

        it('should get user by ID', async () => {
            const user = await userDao.getByIdAsync(insertedId);
            expect(user).toBeDefined();
            expect(user!.username).toBe(testUser.username);
        });

        it('should get user by UUID', async () => {
            const user = await userDao.getByUuidAsync(insertedUuid);
            expect(user).toBeDefined();
            expect(user!.username).toBe(testUser.username);
        });

        it('should return null for non-existent ID', async () => {
            const user = await userDao.getByIdAsync(99999);
            expect(user).toBeNull();
        });

        it('should return null for non-existent UUID', async () => {
            const user = await userDao.getByUuidAsync('non-existent-uuid');
            expect(user).toBeNull();
        });
    });

    describe('Update operations', () => {
        let insertedUser: User;
        let originalCreatedAt: Date;
        let originalUpdatedAt: Date;

        beforeEach(async () => {
            const insertedId = await userDao.insertWithUuidAsync(testUser) || 0;
            insertedUser = (await userDao.getByIdAsync(insertedId))!;
            originalCreatedAt = insertedUser.created_at;
            originalUpdatedAt = insertedUser.updated_at;
            // Wait 2 seconds to ensure updated_at will be different
            await new Promise(resolve => setTimeout(resolve, 2000));
        });

        it('should update user by ID and update timestamps correctly', async () => {
            const beforeUpdate = new Date();
            const updatedData = {
                ...insertedUser,
                username: 'updated_username',
                email: 'updated@example.com',
                first_name: 'Updated',
                last_name: 'Name',
                phone: '+9876543210',
                is_active: false,
                role: 'admin' as const,
                last_login: new Date(),
                updated_at: new Date()  // Manually set update time
            };

            await userDao.updateAsync(updatedData);
            const afterUpdate = new Date();
            const updatedUser = await userDao.getByIdAsync(insertedUser.id);

            // Test all updated fields
            expect(updatedUser).toBeDefined();
            expect(updatedUser!.username).toBe('updated_username');
            expect(updatedUser!.email).toBe('updated@example.com');
            expect(updatedUser!.first_name).toBe('Updated');
            expect(updatedUser!.last_name).toBe('Name');
            expect(updatedUser!.phone).toBe('+9876543210');
            expect(Boolean(updatedUser!.is_active)).toBe(false);
            expect(updatedUser!.role).toBe('admin');
            expect(updatedUser!.last_login).toBeInstanceOf(Date);
            expect(updatedUser!.uuid).toBe(insertedUser.uuid);

            // Timestamp checks
            const beforeUpdateSeconds = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
            const afterUpdateSeconds = Math.ceil(afterUpdate.getTime() / 1000) * 1000;
            const updatedAtTime = updatedUser!.updated_at.getTime();

            expect(updatedUser!.created_at.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedAtTime).not.toBe(originalUpdatedAt.getTime());
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateSeconds);
            expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateSeconds);
        });

        it('should update user by UUID and update timestamps correctly', async () => {
            const beforeUpdate = new Date();
            const updatedData = {
                ...insertedUser,
                username: 'updated_by_uuid',
                email: 'updated_uuid@example.com',
                updated_at: new Date()  // Manually set update time
            };

            await userDao.updateByUuidAsync(updatedData);
            const afterUpdate = new Date();
            const updatedUser = await userDao.getByUuidAsync(insertedUser.uuid);

            expect(updatedUser).toBeDefined();
            expect(updatedUser!.username).toBe('updated_by_uuid');
            expect(updatedUser!.email).toBe('updated_uuid@example.com');
            expect(updatedUser!.id).toBe(insertedUser.id);

            // Timestamp checks
            const beforeUpdateSeconds = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
            const afterUpdateSeconds = Math.ceil(afterUpdate.getTime() / 1000) * 1000;
            const updatedAtTime = updatedUser!.updated_at.getTime();

            expect(updatedUser!.created_at.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedAtTime).not.toBe(originalUpdatedAt.getTime());
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateSeconds);
            expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateSeconds);
        });
    });

    describe('Delete operations', () => {
        let insertedUser: User;

        beforeEach(async () => {
            const insertedId = await userDao.insertWithUuidAsync(testUser) || 0;
            insertedUser = (await userDao.getByIdAsync(insertedId))!;
        });

        it('should delete user by ID', async () => {
            await userDao.deleteByIdAsync(insertedUser.id);
            const deletedUser = await userDao.getByIdAsync(insertedUser.id);
            expect(deletedUser).toBeNull();
        });

        it('should delete user by UUID', async () => {
            await userDao.deleteByUuidAsync(insertedUser.uuid);
            const deletedUser = await userDao.getByUuidAsync(insertedUser.uuid);
            expect(deletedUser).toBeNull();
        });
    });
}); 