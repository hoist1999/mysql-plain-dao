import crypto from 'crypto';
import { DbUtil } from '../../core/database/DbUtil';
import type { ResultSetHeader } from 'mysql2';
import { getDbConfigFromEnv } from '../../core/database/DbConfigLoader';

interface User {
    id?: number;
    uuid: string;
    username: string;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    role?: string;
}

describe('DbUtil Tests', () => {
    describe('Initialization', () => {
        it('should initialize with connection string', async () => {
            const dbConfig = getDbConfigFromEnv();
            const connectionString = `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
            DbUtil.initialize({ uri: connectionString });

            // Test the connection
            const result = await DbUtil.executeGetSingleAsync<{ value: number }>(
                'SELECT 1 as value'
            );

            expect(result).toBeTruthy();
            expect(result?.value).toBe(1);

            // clean up
            await DbUtil.endPoolAsync();
        });

        it('should initialize with connection config', async () => {
            DbUtil.initialize(getDbConfigFromEnv());

            // Test the connection
            const result = await DbUtil.executeGetSingleAsync<{ value: number }>(
                'SELECT 1 as value'
            );

            expect(result).toBeTruthy();
            expect(result?.value).toBe(1);

            // clean up
            await DbUtil.endPoolAsync();
        });
    });

    describe('CRUD Operations', () => {
        beforeAll(async () => {
            await DbUtil.initialize(getDbConfigFromEnv());
        });

        afterAll(async () => {
            await DbUtil.endPoolAsync();
        });

        const testUser: User = {
            uuid: crypto.randomUUID(),
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashedpassword',
            first_name: 'Test',
            last_name: 'User',
            role: 'user'
        };

        beforeEach(async () => {
            // Clean up test data only
            await DbUtil.executeAsync('DELETE FROM user WHERE email = ?', [testUser.email]);
        });

        it('should insert a new user', async () => {
            const sql = `
                INSERT INTO user (uuid, username, email, password_hash, first_name, last_name, role)
                VALUES (:uuid, :username, :email, :password_hash, :first_name, :last_name, :role)
            `;

            const id = await DbUtil.executeInsertAsync(sql, testUser);
            expect(id).not.toBeNull();
            if (id) {
                expect(id).toBeGreaterThan(0);
            }
            // clean up
            await DbUtil.executeDeleteAsync('DELETE FROM user WHERE id = ?', [id]);
        });

        it('should read user data', async () => {
            // First insert test data
            const insertSql = `
                INSERT INTO user (uuid, username, email, password_hash, first_name, last_name, role)
                VALUES (:uuid, :username, :email, :password_hash, :first_name, :last_name, :role)
            `;
            const id = await DbUtil.executeInsertAsync(insertSql, testUser);
            expect(id).not.toBeNull();
            if (!id) return;

            // Test single row query
            const selectSql = 'SELECT * FROM user WHERE id = ?';
            const user = await DbUtil.executeGetSingleAsync<User>(selectSql, [id]);

            expect(user).toBeTruthy();
            expect(user?.email).toBe(testUser.email);
            expect(user?.username).toBe(testUser.username);

            // Test list query
            const listSql = 'SELECT * FROM user WHERE email = ?';
            const users = await DbUtil.executeGetListAsync<User>(listSql, [testUser.email]);

            expect(users).toHaveLength(1);
            expect(users[0].email).toBe(testUser.email);

            // clean up
            await DbUtil.executeDeleteAsync('DELETE FROM user WHERE id = ?', [id]);
        });

        it('should update user data', async () => {
            // First insert test data
            const insertSql = `
                INSERT INTO user (uuid, username, email, password_hash, first_name, last_name, role)
                VALUES (:uuid, :username, :email, :password_hash, :first_name, :last_name, :role)
            `;
            const id = await DbUtil.executeInsertAsync(insertSql, testUser);
            expect(id).not.toBeNull();
            if (!id) return;

            // Update the user
            const updateSql = `
                UPDATE user 
                SET first_name = :first_name,
                    last_name = :last_name
                WHERE id = :id
            `;

            const updateResult = await DbUtil.executeUpdateAsync(updateSql, {
                id: id,
                first_name: 'Updated',
                last_name: 'Name'
            });

            expect(updateResult).toBe(1);

            // Verify the update
            const user = await DbUtil.executeGetSingleAsync<User>(
                'SELECT * FROM user WHERE id = ?',
                [id]
            );

            expect(user?.first_name).toBe('Updated');
            expect(user?.last_name).toBe('Name');

            // clean up
            await DbUtil.executeDeleteAsync('DELETE FROM user WHERE id = ?', [id]);
        });

        it('should delete user data', async () => {
            // First insert test data
            const insertSql = `
                INSERT INTO user (uuid, username, email, password_hash, first_name, last_name, role)
                VALUES (:uuid, :username, :email, :password_hash, :first_name, :last_name, :role)
            `;
            const id = await DbUtil.executeInsertAsync(insertSql, testUser);
            expect(id).not.toBeNull();
            if (!id) return;

            // Delete the user
            const deleteResult = await DbUtil.executeDeleteAsync(
                'DELETE FROM user WHERE id = ?',
                [id]
            );

            expect(deleteResult).toBe(1);

            // Verify the deletion
            const user = await DbUtil.executeGetSingleAsync<User>(
                'SELECT * FROM user WHERE id = ?',
                [id]
            );

            expect(user).toBeNull();
        });

        it('should handle transactions correctly', async () => {
            const result = await DbUtil.withTransaction(async (connection) => {
                // Insert first user
                const [result1] = await connection.execute(
                    'INSERT INTO user (uuid, username, email, password_hash) VALUES (?, ?, ?, ?)',
                    [crypto.randomUUID(), 'user1', 'user1@test.com', 'hash1']
                );

                // Insert second user
                const [result2] = await connection.execute(
                    'INSERT INTO user (uuid, username, email, password_hash) VALUES (?, ?, ?, ?)',
                    [crypto.randomUUID(), 'user2', 'user2@test.com', 'hash2']
                );

                return {
                    id1: (result1 as ResultSetHeader).insertId,
                    id2: (result2 as ResultSetHeader).insertId
                };
            });

            expect(result.id1).toBeGreaterThan(0);
            expect(result.id2).toBeGreaterThan(0);

            // Clean up
            await DbUtil.executeDeleteAsync('DELETE FROM user WHERE email IN (?, ?)', ['user1@test.com', 'user2@test.com']);
        });

        it('should rollback transaction on error', async () => {
            const email = 'rollback@test.com';

            try {
                await DbUtil.withTransaction(async (connection) => {
                    // First insert succeeds
                    await connection.execute(
                        'INSERT INTO user (uuid, username, email, password_hash) VALUES (?, ?, ?, ?)',
                        [crypto.randomUUID(), 'rollbackuser', email, 'hash']
                    );

                    // Second insert fails (duplicate email)
                    await connection.execute(
                        'INSERT INTO user (uuid, username, email, password_hash) VALUES (?, ?, ?, ?)',
                        [crypto.randomUUID(), 'rollbackuser2', email, 'hash'] // Same email will cause error
                    );
                });
                fail('Should have thrown an error');
            } catch (error) {
                // Verify that no records were inserted (rollback worked)
                const users = await DbUtil.executeGetListAsync<User>(
                    'SELECT * FROM user WHERE email = ?',
                    [email]
                );
                expect(users).toHaveLength(0);
            }
        });
    });
}); 