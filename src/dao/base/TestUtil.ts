// import { STORE_TYPE } from "shared-libs";
// import { StoreBranchDao } from "../DAO/StoreBranchDao";
// import { StoreDao } from "../DAO/StoreDao";
// import { Store, StoreBranch } from "../types/ModelTypes";
// import { InsertModel } from "../types/Types";
import { DbUtil } from "./DbUtil";

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

// /** 插入测试用的用户 */
// export async function insertSampleUser() {
//     // const userDao = new UserDao();
//     // const user01: user = {
//     //     name: 'user01',
//     //     password: 'password01',
//     //     gender: 'male',
//     //     // user_type = string | null;
//     //     // main_user_id = number | null;
//     //     // email = string | null;
//     //     // password = string | null;
//     //     // name = string | null;
//     //     // gender = string | null;
//     //     // position = string | null;
//     //     // country = string | null;
//     //     // province = string | null;
//     //     // // city = string | null;
//     //     // // address = string | null;
//     //     // // qq = string | null;
//     //     // // wechat = string | null;
//     //     // // facebook = string | null;
//     //     // // whatsapp = string | null;
//     //     // // other_contact_type = string | null;
//     //     // // other_contact = string | null;
//     //     // // mobile_number = string | null;
//     //     // // phone = string | null;
//     //     // // car_number = string | null;
//     //     // // image_url = string | null;
//     //     // // status = string | null;
//     //     // // comment = string | null;
//     //     // // json_data = string | null;
//     //     // // created = Date | null;
//     //     // // modified = Date | null;
//     //     // // last_login = Date | null;
//     //     // // sort_order = number;
//     // }
//     // await userDao.insert_with_uuid_async(user01);
// }

// export async function buildSampleStore(
//     name: string = "店铺1",
//     main_account_id: number = 1
// ) {
//     const storeDao = new StoreDao();

//     //插入Store
//     const store: InsertModel<Store> = {
//         name,
//         main_account_id,
//         store_type: STORE_TYPE.AMAZON,
//         sales_type: "B2C",
//         sort_order: 1,
//         created: new Date(),
//     };

//     const insertId = await storeDao.insertAsync(store);
//     const db_store = await storeDao.getByIdAsync(insertId);
//     return db_store;
// }

// export async function insertSampleStoreBranch(
//     store_id: number,
//     name: string = "分店1",
//     country: string = "us"
// ) {
//     const storeBranchDao = new StoreBranchDao();

//     //插入Store
//     const storeBranch: InsertModel<StoreBranch> = {
//         store_id,
//         sort_order: 1,
//         name,
//         country,
//     };

//     const insertId = await storeBranchDao.insertAsync(storeBranch);
//     const db_store_branch = await storeBranchDao.getByIdAsync(insertId);
//     return db_store_branch;
// }

// /** UUID字符串长度 */
// export const UUID_LENGTH = 36;

// /** 昨天 */
// export function getDateYesterday() {
//     const date = new Date();
//     const yesterday = new Date(date.getTime());
//     yesterday.setDate(date.getDate() - 1);
//     return yesterday;
// }

// /** 一个月前 */
// export function getDatePreviousMonth() {
//     const date = new Date();
//     date.setMonth(date.getMonth() - 1);
//     return date;
// }
