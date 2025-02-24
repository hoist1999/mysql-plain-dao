import { DbUtil } from "./DbUtil";
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config();
/** 
 * 释放数据库连接池
 * 否则单元测试执行后无法正常结束
 */
export async function relaseConnectionPoolAsync() {
    await DbUtil.relaseConnectionPoolAsync();
}

export async function cleanTableAsync(table: string) {
    const sql = `DELETE FROM ${table}`;
    await DbUtil.executeAsync(sql);
}