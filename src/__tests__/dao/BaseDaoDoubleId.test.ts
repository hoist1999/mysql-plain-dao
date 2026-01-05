import { getDbConfigFromEnv } from "../../core/database/DbConfigLoader";
import { DbUtil } from '../../core/database/DbUtil';
import { InsertUser, User } from "../generated_dao/User";
import { UserDao } from "../generated_dao/UserDao";
import { BaseDaoDoubleID } from './../../core/dao/BaseDaoDoubleID';

// Test user table which has both uuid and id as primary key
describe('UserDao', () => {
    let userDao: UserDao = new UserDao();
    // Prepare test user data with all possible fields from schema
    let testUser: InsertUser = {
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

    beforeAll(async () => {
        await DbUtil.initialize(getDbConfigFromEnv());
    });

    afterAll(async () => {
        await DbUtil.endPoolAsync();
    });

    beforeEach(async () => {
        // Clear table data
        await DbUtil.executeAsync('DELETE FROM user');
    });

    describe('Create operations', () => {
        it('should insert a new user with UUID and timestamps', async () => {
            // Add small delay to avoid timestamp boundary issues
            await new Promise(resolve => setTimeout(resolve, 10));
            const beforeInsert = new Date();
            const insertedUuid = await userDao.insertAsync(testUser);
            const afterInsert = new Date();

            const insertedUser = await userDao.getByUuidAsync(insertedUuid);
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
            // Allow 1 second tolerance for MySQL DATETIME precision and processing delays
            const beforeInsertSeconds = Math.floor(beforeInsert.getTime() / 1000) * 1000 - 1000;
            const afterInsertSeconds = Math.ceil(afterInsert.getTime() / 1000) * 1000;
            const createdAtTime = insertedUser!.created_at!.getTime();
            const updatedAtTime = insertedUser!.updated_at!.getTime();

            expect(createdAtTime).toBeGreaterThanOrEqual(beforeInsertSeconds);
            expect(createdAtTime).toBeLessThanOrEqual(afterInsertSeconds);
            expect(updatedAtTime).toBe(createdAtTime);
        });
    });

    describe('Read operations', () => {
        let insertedId: number;
        let insertedUuid: string;

        beforeEach(async () => {
            insertedUuid = await userDao.insertAsync(testUser);
            const user = await userDao.getByUuidAsync(insertedUuid);
            insertedId = user!.id;
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
            const insertedUuid = await userDao.insertAsync(testUser);
            insertedUser = (await userDao.getByUuidAsync(insertedUuid))!;
            originalCreatedAt = insertedUser.created_at!;
            originalUpdatedAt = insertedUser.updated_at!;
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
            const updatedAtTime = updatedUser!.updated_at!.getTime();

            expect(updatedUser!.created_at!.getTime()).toBe(originalCreatedAt.getTime());
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

            await userDao.updateAsync(updatedData);
            const afterUpdate = new Date();
            const updatedUser = await userDao.getByUuidAsync(insertedUser.uuid);

            expect(updatedUser).toBeDefined();
            expect(updatedUser!.username).toBe('updated_by_uuid');
            expect(updatedUser!.email).toBe('updated_uuid@example.com');
            expect(updatedUser!.id).toBe(insertedUser.id);

            // Timestamp checks
            const beforeUpdateSeconds = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
            const afterUpdateSeconds = Math.ceil(afterUpdate.getTime() / 1000) * 1000;
            const updatedAtTime = updatedUser!.updated_at!.getTime();

            expect(updatedUser!.created_at!.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedAtTime).not.toBe(originalUpdatedAt.getTime());
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateSeconds);
            expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateSeconds);
        });
    });

    describe('Delete operations', () => {
        let insertedUser: User;

        beforeEach(async () => {
            const insertedUuid = await userDao.insertAsync(testUser);
            insertedUser = (await userDao.getByUuidAsync(insertedUuid))!;
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

    // bulk insert
    describe('Bulk insert operations', () => {
        it('should bulk insert users', async () => {
            // create 10 users
            const users = Array.from({ length: 10 }, (_, i) => ({
                ...testUser,
                username: `testuser${i}`,
                email: `testuser${i}@example.com`
            }));
            await userDao.bulkInsertAsync(users);

            // get all users
            const allUsers = await userDao.getListAsync();
            expect(allUsers.length).toBe(10);

            // clean user table
            await DbUtil.executeAsync('DELETE FROM user');
        });
    });


    // userdao with custom uuid field
    describe('UserDao with custom UUID field', () => {
        it('should bulk insert users with custom UUID field', async () => {
            class CustomUserDao extends BaseDaoDoubleID<User, InsertUser> {
                constructor() {
                    super({
                        table_name: 'user',
                        uuid_field: 'uuid',
                        id_field: 'id'
                    });
                }
            }

            const tempUserDao = new CustomUserDao();
            const insertedUuid = await tempUserDao.insertAsync(testUser);
            expect(insertedUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            const insertedUser = await tempUserDao.getByUuidAsync(insertedUuid);
            expect(insertedUser).toBeDefined();
            expect(insertedUser!.uuid).toBeDefined();
        });
    });

    // get id from uuid
    describe('Get ID from UUID', () => {
        it('should get ID from UUID', async () => {
            const insertedUuid = await userDao.insertAsync(testUser);
            const id = await userDao.getIdFromUUIDAsync(insertedUuid);
            expect(id).toBeDefined();
            expect(id).toBeGreaterThan(0);
        });
    });

    // get uuid from id
    describe('Get UUID from ID', () => {
        it('should get UUID from ID', async () => {
            const insertedUuid = await userDao.insertAsync(testUser);
            const id = await userDao.getIdFromUUIDAsync(insertedUuid);
            const uuid = await userDao.getUUIDFromIdAsync(id!);

            expect(uuid).toBeDefined();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });
    });

    // Custom DAO methods tests
    describe('Custom DAO methods', () => {
        beforeEach(async () => {
            // Clear table data
            await DbUtil.executeAsync('DELETE FROM user');

            // Insert test users with different dates and statuses
            const users = [
                {
                    ...testUser,
                    username: 'user1',
                    email: 'user1@test.com',
                    is_active: true,
                    last_login: new Date('2024-01-01T00:00:00Z'),
                    created_at: new Date('2024-01-01T00:00:00Z')
                },
                {
                    ...testUser,
                    username: 'user2',
                    email: 'user2@test.com',
                    is_active: false,
                    last_login: new Date('2024-01-15T00:00:00Z'),
                    created_at: new Date('2024-01-15T00:00:00Z')
                },
                {
                    ...testUser,
                    username: 'john_doe',
                    email: 'john@test.com',
                    is_active: true,
                    last_login: new Date('2024-02-01T00:00:00Z'),
                    created_at: new Date('2024-02-01T00:00:00Z')
                }
            ];

            await userDao.bulkInsertAsync(users);
        });

        describe('findActiveUsersAsync', () => {
            it('should find active users who logged in within the specified days', async () => {
                const users = await userDao.findActiveUsersAsync();
                expect(users.length).toBe(2); // Should find 2 active users
                expect(users.every(u => u.is_active)).toBe(true);
                expect(users[0].last_login).toBeInstanceOf(Date);
            });
        });

        describe('updateUserStatusAsync', () => {
            it('should update user status and record change time', async () => {
                const user = (await userDao.getListAsync())[0];
                const beforeUpdate = new Date();
                await userDao.updateUserStatusAsync(user.id, false);
                const afterUpdate = new Date();

                const updatedUser = await userDao.getByIdAsync(user.id);
                expect(updatedUser).toBeDefined();
                expect(Boolean(updatedUser!.is_active)).toBe(false);

                // Check if updated_at is set correctly - using second precision
                const beforeUpdateSeconds = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
                const afterUpdateSeconds = Math.ceil(afterUpdate.getTime() / 1000) * 1000;
                const updatedAtTime = updatedUser!.updated_at!.getTime();
                expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateSeconds);
                expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateSeconds);
            });
        });

        describe('getUserStatsByDateAsync', () => {
            it('should return correct user registration statistics', async () => {
                const startDate = new Date('2024-01-01T00:00:00Z');
                const endDate = new Date('2024-02-01T23:59:59Z');
                const stats = await userDao.getUserStatsByDateAsync(startDate, endDate);

                expect(stats).toBeDefined();
                expect(stats[0].date).toBeDefined();
                expect(stats[0].count).toBeGreaterThan(0);

                // Verify total count
                const totalUsers = stats.reduce((sum, stat) => sum + stat.count, 0);
                expect(totalUsers).toBe(3);
            });

            it('should return empty array for date range with no users', async () => {
                const startDate = new Date('2023-01-01');
                const endDate = new Date('2023-12-31');
                const stats = await userDao.getUserStatsByDateAsync(startDate, endDate);
                expect(stats).toEqual([]);
            });
        });

        describe('searchUsersAsync', () => {
            it('should search users by keyword', async () => {
                const results = await userDao.searchUsersAsync({ keyword: 'john' });
                expect(results).toHaveLength(1);
                expect(results[0].username).toBe('john_doe');
            });

            it('should search users by active status', async () => {
                const activeUsers = await userDao.searchUsersAsync({ isActive: true });
                expect(activeUsers.length).toBe(2);
                expect(activeUsers.every(u => u.is_active)).toBe(true);

                const inactiveUsers = await userDao.searchUsersAsync({ isActive: false });
                expect(inactiveUsers.length).toBe(1);
                expect(inactiveUsers.every(u => !u.is_active)).toBe(true);
            });

            it('should search users by start date', async () => {
                const results = await userDao.searchUsersAsync({
                    startDate: new Date('2024-01-15')
                });
                expect(results.length).toBe(2);
            });

            it('should respect limit parameter', async () => {
                const results = await userDao.searchUsersAsync({ limit: 2 });
                expect(results.length).toBe(2);
            });

            it('should handle SQL injection attempts safely', async () => {
                const results = await userDao.searchUsersAsync({
                    keyword: "' OR '1'='1"
                });
                expect(results.length).toBe(0);
            });

            it('should combine multiple search conditions', async () => {
                const results = await userDao.searchUsersAsync({
                    keyword: 'user',
                    isActive: true,
                    startDate: new Date('2024-01-01T00:00:00Z'),
                    limit: 10
                });
                expect(results.length).toBe(1);
                expect(results[0].username).toBe('user1');
            });

            it('sql injection should be safe', async () => {
                const results = await userDao.searchUsersAsync({
                    keyword: "'; DROP TABLE user; --",
                    isActive: true,
                    startDate: new Date('2024-01-01T00:00:00Z'),
                    limit: 10
                });
                expect(results.length).toBe(0);
            });
        });
    });
}); 