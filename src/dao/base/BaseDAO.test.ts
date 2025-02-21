import { TestTableDao } from "./TestTableDao";
import { relaseConnectionPoolAsync, cleanTableAsync } from "./TestUtil";
import { InsertModel } from '../Types';
import { TestTable } from './TestTable';

describe("BaseDAO", () => {
    beforeAll(async () => {
    })

    afterAll(async () => {
        await relaseConnectionPoolAsync();
    })

    afterEach(async () => {
        //clean
        await cleanTableAsync('test_table');
    })


    it("bulk_insert_async: 正确插入多条数据", async () => {
        const testTableDao = new TestTableDao();

        const item1: InsertModel<TestTable> = {
            title: 'test title 01',
            content: 'en',
            sort_order: 1,
            is_ok: true
        };

        const item2: InsertModel<TestTable> = {
            title: 'test title 02',
            content: '',
            sort_order: 2,
            is_ok: false
        };

        const item_list = [item1, item2];

        await testTableDao.bulkInsertAsync(item_list);

        const result_list = await testTableDao.getListAsync();
        expect(result_list.length).toEqual(2);
    });


    it("bulk_insert_async: 插入数据的值顺序正确01", async () => {
        const testTableDao = new TestTableDao();

        const item: InsertModel<TestTable> = {
            title: 'test title',
            content: '',
            sort_order: 2,
            is_ok: false
        };

        const item_list = [item];

        await testTableDao.bulkInsertAsync(item_list);

        const [itemDb] = await testTableDao.getListAsync();

        expect(itemDb.title).toEqual(item.title);
        expect(itemDb.content).toEqual(item.content);
        expect(itemDb.sort_order).toEqual(item.sort_order);
        expect(itemDb.is_ok == item.is_ok).toBeTruthy();
    });


    it("bulk_insert_async: 插入数据的值顺序正确02", async () => {
        const testTableDao = new TestTableDao();

        const item: InsertModel<TestTable> = {
            title: 'test title',
            content: null,
            is_ok: true
        };

        const item_list = [item];

        await testTableDao.bulkInsertAsync(item_list);

        const [itemDb] = await testTableDao.getListAsync();

        expect(itemDb.title).toEqual(item.title);
        expect(itemDb.content).toEqual(item.content);
        expect(itemDb.sort_order).toBeNull();
        expect(itemDb.is_ok == item.is_ok).toBeTruthy();
    });

    it("bulk_insert_async: 性能测试", async () => {
        const testTableDao = new TestTableDao();

        const item_list = [];
        const LENGTH = 100000;

        for (let i = 0; i < 100000; i++) {
            const item: InsertModel<TestTable> = {
                title: `test title ${i}`,
                content: 'en',
                sort_order: 1,
                is_ok: true
            };

            item_list.push(item);
        }

        await testTableDao.bulkInsertAsync(item_list);

        const result_list = await testTableDao.getListAsync();
        expect(result_list.length).toEqual(LENGTH);
    });
});
