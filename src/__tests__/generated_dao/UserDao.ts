/* tslint:disable */

import { BaseDaoDoubleID } from '../../core/dao/BaseDaoDoubleID';
import { DbUtil } from '../../core/database/DbUtil';
import type { InsertUser, User } from './User';

export class UserDao extends BaseDaoDoubleID<User, InsertUser> {
    constructor() {
        super({
            table_name: 'user',
        });
    }

    // You can add your own methods below


    // Custom methods below

    /** Find active users who logged in within the last n days */
    async findActiveUsersAsync(): Promise<User[]> {
        const sql = `
            SELECT * FROM user 
            WHERE is_active = true 
            ORDER BY last_login DESC
            LIMIT 100
        `;

        return await DbUtil.executeGetListAsync<User>(sql);
    }

    /** Update user status and record the change time */
    async updateUserStatusAsync(userId: number, isActive: boolean): Promise<number> {
        const sql = `
            UPDATE user 
            SET is_active = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        return await DbUtil.executeUpdateAsync(sql, [isActive, userId]);
    }

    /** Get user statistics by registration date */
    async getUserStatsByDateAsync(startDate: Date, endDate: Date)
        : Promise<Array<{ date: string; count: number }>> {
        const sql = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM user
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `;
        const result = await DbUtil.executeGetListAsync<{ date: string; count: number }>(
            sql,
            [startDate, endDate]
        );
        return result;
    }

    /** Search users with complex conditions */
    async searchUsersAsync(params: {
        keyword?: string;
        isActive?: boolean;
        startDate?: Date;
        limit?: number;
    }): Promise<User[]> {
        const conditions: string[] = ['1=1'];
        const values: any[] = [];

        if (params.keyword) {
            const keyword = `%${params.keyword}%`;
            conditions.push('(username LIKE ? OR email LIKE ?)');
            values.push(keyword, keyword);
        }

        if (params.isActive !== undefined) {
            conditions.push('is_active = ?');
            values.push(params.isActive);
        }

        if (params.startDate) {
            conditions.push('created_at >= ?');
            values.push(params.startDate);
        }

        const sql = `
            SELECT * FROM user
            WHERE ${conditions.join(' AND ')}
            ORDER BY created_at DESC
            LIMIT ?
        `;

        values.push(params.limit || 100);

        return await DbUtil.executeGetListAsync<User>(sql, values);
    }
}
