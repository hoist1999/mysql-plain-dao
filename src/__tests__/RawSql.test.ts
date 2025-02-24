import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { getDbConfigFromEnv } from '../dao/DbConfigLoader';
import { User } from './User';

/**
 * Integration tests for direct database operations
 * 
 * These tests verify the basic database connectivity and CRUD operations
 * using raw SQL queries without any application-level abstractions.
 * Primary purpose is to ensure database setup and access are working correctly.
 */
describe('Simple SQL CRUD Tests', () => {
    let connection: mysql.Connection;

    beforeAll(async () => {
        connection = await mysql.createConnection(getDbConfigFromEnv());
    });

    afterAll(async () => {
        if (connection) {
            await connection.end();
        }
    });

    beforeEach(async () => {
        await connection.execute('DELETE FROM user');
    });

    // Helper function: Create user with required fields
    async function createTestUser(userData: Partial<User>): Promise<mysql.ResultSetHeader> {
        const uuid = crypto.randomUUID(); // 需要导入 crypto
        const defaultData = {
            uuid,
            password_hash: 'hashed_password', // 实际应用中应该使用proper hash
            is_active: true,
            role: 'user' as const
        };

        const data = { ...defaultData, ...userData };

        const [result] = await connection.execute<mysql.ResultSetHeader>(
            `INSERT INTO user (
                uuid, username, email, password_hash, 
                first_name, last_name, phone, 
                is_active, role
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.uuid,
                data.username,
                data.email,
                data.password_hash,
                data.first_name || null,
                data.last_name || null,
                data.phone || null,
                data.is_active,
                data.role
            ]
        );
        return result;
    }

    // Helper function: Get user
    async function getUser(username: string): Promise<User | null> {
        const [rows] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT *, is_active = 1 as is_active FROM user WHERE username = ?',
            [username]
        );
        if (rows.length === 0) return null;

        // Convert MySQL datetime to JS Date
        const user = rows[0] as any;
        return {
            ...user,
            is_active: Boolean(user.is_active),
            created_at: new Date(user.created_at),
            updated_at: new Date(user.updated_at),
            last_login: user.last_login ? new Date(user.last_login) : undefined
        } as User;
    }

    test('should create a new user with all fields', async () => {
        const testUser = {
            username: 'testuser',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            phone: '1234567890',
            role: 'admin' as const
        };

        const result = await createTestUser(testUser);
        expect(result.affectedRows).toBe(1);

        const user = await getUser(testUser.username);
        expect(user).toBeTruthy();
        expect(user?.email).toBe(testUser.email);
        expect(user?.first_name).toBe(testUser.first_name);
        expect(user?.last_name).toBe(testUser.last_name);
        expect(user?.phone).toBe(testUser.phone);
        expect(user?.role).toBe(testUser.role);
        expect(user?.is_active).toBe(true);
        expect(user?.uuid).toBeTruthy();
        expect(user?.created_at).toBeInstanceOf(Date);
        expect(user?.updated_at).toBeInstanceOf(Date);
    });

    test('should read user data', async () => {
        const testUser = {
            username: 'readuser',
            password: 'password123',
            email: 'read@example.com'
        };

        await createTestUser(testUser);
        const user = await getUser(testUser.username);

        expect(user).toBeTruthy();
        expect(user?.username).toBe(testUser.username);
        expect(user?.email).toBe(testUser.email);
    });

    test('should update user fields', async () => {
        const testUser = {
            username: 'updateuser',
            email: 'update@example.com',
            first_name: 'Update',
            last_name: 'User'
        };

        await createTestUser(testUser);

        const updates = {
            email: 'updated@example.com',
            first_name: 'Updated',
            last_name: 'Name',
            phone: '9876543210',
            is_active: false
        };

        const [updateResult] = await connection.execute<mysql.ResultSetHeader>(
            `UPDATE user 
             SET email = ?, first_name = ?, last_name = ?, phone = ?, is_active = ?
             WHERE username = ?`,
            [updates.email, updates.first_name, updates.last_name, updates.phone, updates.is_active ? 1 : 0, testUser.username]
        );
        expect(updateResult.affectedRows).toBe(1);

        const updatedUser = await getUser(testUser.username);
        expect(updatedUser?.email).toBe(updates.email);
        expect(updatedUser?.first_name).toBe(updates.first_name);
        expect(updatedUser?.last_name).toBe(updates.last_name);
        expect(updatedUser?.phone).toBe(updates.phone);
        expect(updatedUser?.is_active).toBe(updates.is_active);
    });

    test('should delete user data', async () => {
        const testUser = {
            username: 'deleteuser',
            password: 'password123',
            email: 'delete@example.com'
        };

        await createTestUser(testUser);

        const [deleteResult] = await connection.execute<mysql.ResultSetHeader>(
            'DELETE FROM user WHERE username = ?',
            [testUser.username]
        );
        expect(deleteResult.affectedRows).toBe(1);

        const deletedUser = await getUser(testUser.username);
        expect(deletedUser).toBeNull();
    });

    test('should verify mysql_test container is accessible', async () => {
        // Test database connection configuration
        const config = getDbConfigFromEnv();

        try {
            // Attempt to connect to database
            const testConnection = await mysql.createConnection(config);

            // Verify connection success
            const [result] = await testConnection.execute<mysql.RowDataPacket[]>('SELECT 1 as connected');
            expect(result[0].connected).toBe(1);

            // Check database version
            const [versionResult] = await testConnection.execute<mysql.RowDataPacket[]>('SELECT VERSION() as version');
            expect(versionResult[0].version).toContain('MariaDB');

            // Verify current database name
            const [dbResult] = await testConnection.execute<mysql.RowDataPacket[]>('SELECT DATABASE() as db');
            expect(dbResult[0].db).toBe(config.database);


            await testConnection.end();
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    });
}); 